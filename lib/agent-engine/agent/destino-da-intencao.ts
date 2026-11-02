import type { HandlerCtx } from "@/lib/api/handlers/types";
import { dbQuery } from "@/lib/db/local";
import { logger } from "@/lib/logger";
import {
  transfereParaOFunil,
  type OrigemDaTransferencia,
} from "@/lib/leads/transfere-para-o-funil";
import { resolveActiveLeadForContact, type LeadCandidate } from "@/lib/leads/active-lead";
import { abreAvisoDeDestinoRecusado } from "./aviso-de-destino-recusado";

export type StatusDoDestino =
  /** A intenção não declarou funil — o roteamento de sempre (#2155). */
  | "sem_destino"
  /** Nenhum negócio aberto do contato: não há card a mover. */
  | "sem_negocio"
  /** Dois negócios empatados: mover um seria chute (§3.2). */
  | "nao_roteado"
  /** O card já está no funil destino — nada a fazer, sem retroceder. */
  | "ja_no_destino"
  /**
   * O contato JÁ tem outro negócio aberto no funil destino: transferir criaria
   * o segundo card do mesmo cliente no mesmo funil. Não se move nada.
   */
  | "destino_ocupado"
  | "transferido"
  /** A transferência recusou (`stage_pipeline_mismatch`, etapa, etc.). */
  | "recusado";

export interface ResultadoDoDestino {
  status: StatusDoDestino;
  error?: string;
  origemId?: string;
  cloneId?: string;
}

export interface DestinoDaIntencaoDeps {
  _dbOrClient: unknown;
  organizationId: string;
  /** O CONTATO do turno (`leadId` em inbound-turn), não o id do negócio. */
  contactId: string;
  destinoPipelineId: string;
  destinoStageId: string | null;
  handlerCtx: HandlerCtx;
}

/**
 * Busca leads abertos de um contato pelo banco local.
 */
async function buscarLeadsAbertosDoContato(
  organizationId: string,
  contactId: string,
): Promise<LeadCandidate[]> {
  try {
    const resultado = await dbQuery(
      `SELECT id, organization_id, pipeline_id, status, last_activity_at, created_at
       FROM crm_leads
       WHERE organization_id = ? AND contact_id = ? AND status = 'open'`,
      [organizationId, contactId],
    );
    return (resultado.rows as any[]).map((row) => ({
      id: row.id as string,
      organization_id: row.organization_id as string,
      pipeline_id: row.pipeline_id as string,
      status: row.status as string,
      last_activity_at: row.last_activity_at as string | null,
      created_at: row.created_at as string,
    })) as LeadCandidate[];
  } catch {
    return [];
  }
}

/**
 * Busca o funil padrão da organização pelo banco local.
 */
async function buscarFunilPadrao(
  organizationId: string,
): Promise<string | null> {
  try {
    const resultado = await dbQuery(
      `SELECT id FROM crm_pipelines
       WHERE organization_id = ? AND is_default = 1 AND is_archived = 0
       LIMIT 1`,
      [organizationId],
    );
    if (resultado.rowCount === 0) return null;
    return (resultado.rows[0] as { id?: string })?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Busca todas as etapas de um funil pelo banco local.
 */
async function buscarEtapasDoFunil(
  organizationId: string,
  pipelineId: string,
): Promise<{ id: string; name: string; is_won: boolean; is_lost: boolean; is_archived: boolean; position: number; pipeline_id: string }[]> {
  try {
    const resultado = await dbQuery(
      `SELECT id, name, is_won, is_lost, is_archived, position, pipeline_id
       FROM crm_stages
       WHERE organization_id = ? AND pipeline_id = ? AND is_archived = 0
       ORDER BY position ASC`,
      [organizationId, pipelineId],
    );
    return (resultado.rows as any[]).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      is_won: row.is_won === 1,
      is_lost: row.is_lost === 1,
      is_archived: row.is_archived === 1,
      position: row.position as number,
      pipeline_id: row.pipeline_id as string,
    })) as any[];
  } catch {
    return [];
  }
}

/**
 * Leva o card do contato para o funil que a intenção do roteador declarou (#2155).
 *
 * O roteador escolhia o AGENTE e o card ficava no funil de entrada: o agente do
 * produto não escrevia nele. Aqui o destino é aplicado com a MESMA transferência
 * das regras de automação (`transfereParaOFunil`: clona no destino e encerra a
 * origem como transferência) — duas implementações de "trocar de funil"
 * divergiriam na primeira mudança de uma delas.
 *
 * Quatro recusas são silenciosas e propositalmente não são erro: card já no
 * destino (idempotente em toda mensagem seguinte), destino já com negócio aberto
 * (não duplica o card do cliente), sem negócio aberto e alvo ambíguo — a única
 * coisa visível ao cliente final que este caminho pode causar é mover o card
 * errado.
 *
 * A QUINTA — `recusado`, quando a transferência é barrada (a régua de campos
 * obrigatórios do destino, entre outras) — NÃO é silenciosa desde o #2297: ela
 * abre um aviso na Central apontando para o negócio de origem, que continua
 * aberto. Silenciar uma recusa é diferente de não mover nada: aqui o card não
 * foi para onde a intenção mandou, e alguém precisa saber.
 */
export async function aplicaDestinoDaIntencao(
  deps: DestinoDaIntencaoDeps,
): Promise<ResultadoDoDestino> {
  const { organizationId, contactId, destinoPipelineId, destinoStageId, handlerCtx } = deps;

  try {
    // 1. Busca leads abertos do contato
    const candidatos = await buscarLeadsAbertosDoContato(organizationId, contactId);

    // 2. Verifica se há leads abertos
    if (candidatos.length === 0) {
      return { status: "sem_negocio" };
    }

    // 3. Verifica se o destino é sem funil (sem_destino)
    if (!destinoPipelineId) {
      return { status: "sem_destino" };
    }

    // 4. Resolve o lead ativo do contato
    const funilPadrao = await buscarFunilPadrao(organizationId);
    const resolucao = resolveActiveLeadForContact(candidatos, { defaultPipelineId: funilPadrao });

    if (!resolucao.routed) {
      // Nenhum lead elegível ou ambiguidade
      return {
        status: resolucao.reason === "no_open_lead" ? "sem_negocio" : "nao_roteado",
        error: resolucao.reason,
      };
    }

    const leadId = resolucao.leadId;

    // 5. Busca o lead de origem
    const origemResult = await dbQuery(
      `SELECT * FROM crm_leads
       WHERE organization_id = ? AND id = ? AND status = 'open' LIMIT 1`,
      [organizationId, leadId],
    );

    if (origemResult.rowCount === 0) {
      return { status: "sem_negocio" };
    }

    const origem = origemResult.rows[0] as any;

    // 6. Verifica se já está no destino
    if (origem.pipeline_id === destinoPipelineId && origem.stage_id === destinoStageId) {
      return { status: "ja_no_destino" };
    }

    // 7. Verifica se já há um lead aberto no funil destino
    const leadNoDestino = await dbQuery(
      `SELECT id FROM crm_leads
       WHERE organization_id = ? AND pipeline_id = ? AND status = 'open'
       LIMIT 1`,
      [organizationId, destinoPipelineId],
    );

    if (leadNoDestino.rowCount > 0) {
      return { status: "destino_ocupado" };
    }

    // 8. Busca as etapas do funil de destino
    const etapas = await buscarEtapasDoFunil(organizationId, destinoPipelineId);

    if (etapas.length === 0) {
      return { status: "recusado", error: "pipeline_without_initial_stage" };
    }

    // 9. Determina a etapa de destino
    let etapaDestino: { id: string; name: string; pipeline_id: string } | null = null;
    if (destinoStageId) {
      etapaDestino = etapas.find((e) => e.id === destinoStageId) ?? null;
      if (!etapaDestino) {
        return { status: "recusado", error: "stage_pipeline_mismatch" };
      }
    } else {
      // Primeira etapa aberta (não ganha, não perde)
      etapaDestino = etapas.find((e) => !e.is_won && !e.is_lost) ?? null;
      if (!etapaDestino) {
        return { status: "recusado", error: "pipeline_without_initial_stage" };
      }
    }

    // 10. Converte origem para o formato esperado
    const origemParaClonar: OrigemDaTransferencia = {
      id: origem.id,
      pipeline_id: origem.pipeline_id,
      status: origem.status,
      title: origem.title,
      description: origem.description,
      contact_id: origem.contact_id,
      value_cents: origem.value_cents,
      currency: origem.currency,
      owner_user_id: origem.owner_user_id,
      owner_agent_id: origem.owner_agent_id,
      expected_close_date: origem.expected_close_date,
      tags: origem.tags,
      source: origem.source,
      custom_fields: origem.custom_fields,
      source_metadata: origem.source_metadata,
    };

    // 11. Chama a função de transferência
    const resultado = await transfereParaOFunil(
      deps._dbOrClient,
      organizationId,
      handlerCtx,
      origemParaClonar,
      destinoPipelineId,
      destinoStageId,
      `Transferido pelo roteador de intenção para ${destinoPipelineId}`,
    );

    if (!resultado.ok) {
      // Abre aviso de recusa na Central
      await abreAvisoDeDestinoRecusado(deps._dbOrClient, {
        organizationId,
        leadId,
        motivo: resultado.error,
      });
      return { status: "recusado", error: resultado.error };
    }

    return {
      status: "transferido",
      origemId: leadId,
      cloneId: (resultado as any).clone.id,
    };
  } catch (err) {
    logger.error("[destino-da-intencao] erro inesperado", {
      organizationId,
      contactId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { status: "recusado", error: "erro_interno" };
  }
}