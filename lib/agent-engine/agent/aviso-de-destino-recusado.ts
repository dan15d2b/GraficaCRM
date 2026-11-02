/**
 * O AVISO NA CENTRAL quando a transferência do ROTEADOR DE INTENÇÃO é recusada
 * (#2297, caminho 1).
 *
 * ─── O defeito ──────────────────────────────────────────────────────────────
 *
 * Com a régua na criação (#1710/#2295), `transfereParaOFunil` lança quando a
 * etapa de destino exige um campo que o negócio de origem não tem. A exceção
 * era engolida pelo `catch` de `inbound-turn.ts` — que faz certo em NÃO derrubar
 * a resposta ao lead — e virava só um `runLog.warn("destino da intenção não
 * aplicado")`. O negócio de origem continua aberto (nada se perde), mas NINGUÉM
 * fica sabendo: nem o log é lido por quem opera o funil.
 *
 * Onde o aviso nasce: em `destino-da-intencao.ts`, que é onde o id do negócio
 * de ORIGEM é conhecido — o `catch` de `inbound-turn` só tem o id do CONTATO.
 * Ali a recusa também é capturada quando `transfereParaOFunil` devolve
 * `{ok:false}` em vez de lançar, para que todo `status: "recusado"` tenha o
 * mesmo sinal.
 *
 * ─── As escolhas ────────────────────────────────────────────────────────────
 *
 * `kind = "other"` + `ref_kind = "lead"`: mesmo par do aviso de etapa
 * (`./aviso-de-etapa.handler.ts`), que já tem destino "Abrir negócio" na
 * Central (`POLITICAS_DE_AVISO.other` em `lib/ai/inbox-destino.ts`) sem
 * mexer no CHECK de `agent_inbox_items` — sem migration.
 *
 * Título SEM dado pessoal: o título do negócio costuma ser nome ou telefone do
 * cliente, e a Central mostra o texto como gravado. O aviso aponta para o
 * negócio; quem abre vê o resto com a permissão que tem.
 *
 * Dedup por (kind, ref, título, aberto): o roteador reprocessa a mesma mensagem
 * a cada turno, e empilhar o mesmo aviso transformaria um recado em ruído.
 *
 * Idioma da ORGANIZAÇÃO, como o aviso de etapa (`lib/leads/aviso-de-etapa.handler.ts`):
 * a Central mostra título e corpo como foram gravados. A dedup compara o título
 * já traduzido.
 *
 * NUNCA LANÇA: a resposta ao lead não pode morrer por causa do aviso que pede
 * atenção — a aviso-de-etapa.handler tem a mesma regra.
 */

import { traduzir } from "@/lib/i18n/dicionario";
import { normalizarIdioma, type Idioma } from "@/lib/i18n/idiomas";
import { logger } from "@/lib/logger";
import { dbQuery, dbExecute } from "@/lib/db/local";
import { randomId } from "@/lib/random-id";

/** A marca do aviso (chave do dicionário) — é pelo título que a dedup o reconhece. */
export const TITULO_AVISO_DE_DESTINO_RECUSADO =
  "Transferência para o funil da intenção recusada";

export function tituloDoAvisoDeDestinoRecusado(idioma: Idioma): string {
  return traduzir(TITULO_AVISO_DE_DESTINO_RECUSADO, idioma);
}

/** Sem PII: diz o que aconteceu com o negócio, nunca quem é o cliente. */
export function corpoDoAvisoDeDestinoRecusado(motivo: string, idioma: Idioma = "pt-BR"): string {
  const base = traduzir(
    "O negócio continua ABERTO no funil de origem: a recusa não encerra nem move nada.",
    idioma,
  );
  // O motivo da régua vem como código (`required_fields_missing`) e é o caso
  // nomeado pela issue — a frase dele é a que a pessoa lê ao abrir o aviso.
  if (motivo === "required_fields_missing") {
    return `${base} ${traduzir(
      "A etapa de destino exige campos obrigatórios que este negócio não tem. Abra o negócio, preencha o que falta e refaça a ação.",
      idioma,
    )}`;
  }
  return `${base} ${traduzir("Motivo:", idioma)} ${motivo}.`;
}

export interface EntradaDoAvisoDeDestino {
  organizationId: string;
  /** O negócio de ORIGEM, que continua aberto — é ele que o aviso aponta. */
  leadId: string;
  /** O código/mensagem da recusa, como `transfereParaOFunil` devolveu. */
  motivo: string;
}

/**
 * Abre (se ainda não houver um aberto) o aviso da recusa na Central.
 *
 * Falha ABERTA em log e silenciosa no retorno: o aviso é acessório — sem ele a
 * recusa continua sendo um `runLog.warn`, que é exatamente o defeito, mas derrubar
 * o turno do lead por causa dele seria trocar um recudo invisível por uma pane.
 */
export async function abreAvisoDeDestinoRecusado(
  _dbOrClient: unknown,
  entrada: EntradaDoAvisoDeDestino,
): Promise<void> {
  try {
    const orgResult = await dbQuery(
      "SELECT locale FROM organizations WHERE id = ? LIMIT 1",
      [entrada.organizationId],
    );
    const idioma = normalizarIdioma((orgResult.rows[0] as { locale?: string | null } | undefined)?.locale ?? null);
    const titulo = tituloDoAvisoDeDestinoRecusado(idioma);

    const jaAberto = await dbQuery(
      `SELECT id FROM agent_inbox_items
       WHERE organization_id = ? AND kind = 'other' AND ref_kind = 'lead'
         AND ref_id = ? AND status = 'open' AND title = ?
       LIMIT 1`,
      [entrada.organizationId, entrada.leadId, titulo],
    );
    if (jaAberto.rowCount > 0) return;

    await dbExecute(
      `INSERT INTO agent_inbox_items (id, organization_id, kind, severity, title, body, ref_kind, ref_id, status, created_at)
       VALUES (?, ?, 'other', 'warn', ?, ?, 'lead', ?, 'open', datetime('now'))`,
      [
        randomId(),
        entrada.organizationId,
        titulo,
        corpoDoAvisoDeDestinoRecusado(entrada.motivo, idioma),
        entrada.leadId,
      ],
    );
  } catch (err) {
    logger.warn("[destino-da-intencao] não abri o aviso da recusa na Central", {
      organizationId: entrada.organizationId,
      leadId: entrada.leadId,
      motivo: entrada.motivo,
      error: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    });
  }
}