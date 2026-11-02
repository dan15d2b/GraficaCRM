import type { HandlerCtx } from "@/lib/api/handlers/types";
import { ApiError } from "@/lib/api/types";
import { dbQuery, dbExecute } from "@/lib/db/local";
import { randomId } from "@/lib/random-id";
import {
  recusaDeCamposObrigatorios,
  validaCamposExigidos,
} from "@/lib/leads/campos-exigidos";
import {
  escolheEtapaDeDestino,
  montaPayloadDoClone,
  recusaTrocaDeFunil,
  type EtapaDoFunil,
  type OrigemParaClonar,
} from "@/lib/leads/clonar-para-funil";
import { motivoDaPerdaDaOrigem } from "@/lib/leads/motivo-da-perda";

/** As colunas que o clone precisa copiar da origem. */
export const COLUNAS_DA_ORIGEM =
  "id, pipeline_id, status, title, description, contact_id, value_cents, currency, " +
  "owner_user_id, owner_agent_id, expected_close_date, tags, source, custom_fields, source_metadata, lost_reason, won_reason, external_id, created_by_user_id";

/** A linha COMPLETA do negócio de origem, como a automação a lê. */
export type OrigemDaTransferencia = OrigemParaClonar;

/**
 * Busca as etapas de um funil pelo ID do funil e organização.
 * Usa o banco local SQLite.
 */
async function buscaEtapasDoFunil(
  organizationId: string,
  pipelineId: string,
): Promise<{ etapas: EtapaDoFunil[]; erro?: string }> {
  try {
    const resultado = await dbQuery(
      `SELECT id, pipeline_id, position, is_won, is_lost, is_archived
       FROM crm_stages
       WHERE organization_id = ? AND pipeline_id = ? AND is_archived = 0
       ORDER BY position ASC`,
      [organizationId, pipelineId],
    );
    const etapas = (resultado.rows as any[]).map((row) => ({
      id: row.id as string,
      pipeline_id: row.pipeline_id as string,
      position: row.position as number | string,
      is_won: row.is_won === 1,
      is_lost: row.is_lost === 1,
      is_archived: row.is_archived === 1,
    })) as EtapaDoFunil[];
    return { etapas };
  } catch (e) {
    return { etapas: [], erro: (e as Error).message };
  }
}

/**
 * Busca a etapa de perda do funil de origem.
 */
async function buscaEtapaDePerda(
  organizationId: string,
  pipelineId: string,
): Promise<{ etapaId?: string; erro?: string }> {
  try {
    const resultado = await dbQuery(
      `SELECT id FROM crm_stages
       WHERE organization_id = ? AND pipeline_id = ? AND is_lost = 1 AND is_archived = 0
       LIMIT 1`,
      [organizationId, pipelineId],
    );
    if (resultado.rowCount === 0) {
      return { erro: "origem_sem_etapa_de_perda" };
    }
    return { etapaId: (resultado.rows[0] as { id?: string }).id };
  } catch (e) {
    return { erro: (e as Error).message };
  }
}

/**
 * Busca as configurações do funil pelo ID.
 * Temporariamente retorna null - implementação completa requer migração adicional.
 */
async function buscaSettingsDoFunil(
  _pipelineId: string,
): Promise<unknown> {
  return null;
}

/**
 * Cria um lead no banco local.
 * Retorna o ID do lead criado.
 */
async function criarLeadLocal(
  organizationId: string,
  input: Parameters<typeof montaPayloadDoClone>[0] & {
    dono_herdado?: boolean;
    retomado_de_lead_id?: string | null;
  },
): Promise<{ id: string; lead: Record<string, unknown>; erro?: string }> {
  try {
    // Busca posição máxima na etapa
    const maxPosResult = await dbQuery(
      `SELECT position_in_stage FROM crm_leads
       WHERE stage_id = ?
       ORDER BY position_in_stage DESC
       LIMIT 1`,
      [input.stage_id],
    );

    const maxPos = maxPosResult.rowCount > 0
      ? Number(maxPosResult.rows[0]?.position_in_stage || 1000)
      : 1000;
    const nextPos = maxPos + 1000;

    // Prepara os campos dono
    const ownerUserId = input.dono_herdado ? null : (input.owner_user_id as string | null | undefined);
    const ownerAgentId = input.dono_herdado ? null : (input.owner_agent_id as string | undefined);
    const assignedAt = (ownerUserId || ownerAgentId) ? new Date().toISOString() : null;

    // Converte arrays JSONB para texto
    const tagsJson = JSON.stringify(input.tags || []);
    const customFieldsJson = JSON.stringify(input.custom_fields || {});
    const sourceMetadataJson = JSON.stringify(input.source_metadata || {});

    // Gera ID único para o lead
    const leadId = randomId();

    // Insere o lead
    await dbExecute(
      `INSERT INTO crm_leads (
        id, organization_id, pipeline_id, stage_id, position_in_stage, title, description,
        contact_id, value_cents, currency, owner_user_id, owner_agent_id, assigned_at,
        expected_close_date, tags, source, custom_fields, source_metadata, retomado_de_lead_id,
        status, created_at, updated_at, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', datetime('now'), datetime('now'), ?)`,
      [
        leadId,
        organizationId,
        input.pipeline_id,
        input.stage_id,
        nextPos,
        input.title,
        input.description || null,
        input.contact_id || null,
        input.value_cents || null,
        input.currency || "BRL",
        ownerUserId,
        ownerAgentId,
        assignedAt,
        input.expected_close_date || null,
        tagsJson,
        input.source || "manual",
        customFieldsJson,
        sourceMetadataJson,
        input.retomado_de_lead_id || null,
        (input as any).created_by_user_id || null,
      ],
    );

    const lead = {
      id: leadId,
      organization_id: organizationId,
      pipeline_id: input.pipeline_id,
      stage_id: input.stage_id,
      position_in_stage: nextPos,
      title: input.title,
      description: input.description || null,
      contact_id: input.contact_id || null,
      value_cents: input.value_cents || null,
      currency: input.currency || "BRL",
      owner_user_id: ownerUserId,
      owner_agent_id: ownerAgentId,
      assigned_at: assignedAt,
      expected_close_date: input.expected_close_date || null,
      tags: input.tags || [],
      source: input.source || "manual",
      custom_fields: input.custom_fields || {},
      source_metadata: input.source_metadata || {},
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return { id: leadId, lead };
  } catch (e) {
    return { id: "", lead: {}, erro: (e as Error).message };
  }
}

/**
 * Envia uma atividade para a timeline.
 */
async function emitirAtividadeLead(
  organizationId: string,
  leadId: string,
  type: string,
  sourceModule: string,
  sourceId: string,
  _actor: { type: string; id: string },
  reason: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const activityId = randomId();
    await dbExecute(
      `INSERT INTO crm_lead_activities (
        id, organization_id, lead_id, type, body, reason, payload, source_module, source_id, created_at
      ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, datetime('now'))`,
      [activityId, organizationId, leadId, type, reason, JSON.stringify(payload), sourceModule, sourceId],
    );
  } catch {
    // Falha baixo - não derruba a operação
  }
}

/**
 * Envia evento para o event_log.
 */
async function emitirEvento(
  organizationId: string,
  eventType: string,
  aggregateType: string,
  aggregateId: string,
  payload: Record<string, unknown>,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    const eventId = randomId();
    await dbExecute(
      `INSERT INTO event_log (
        id, organization_id, event_type, aggregate_type, aggregate_id, payload, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        eventId,
        organizationId,
        eventType,
        aggregateType,
        aggregateId,
        JSON.stringify(payload),
        JSON.stringify(metadata),
      ],
    );
  } catch {
    // Falha baixo - não derruba a operação
  }
}

/**
 * Envia auditoria para o api_audit_log.
 */
async function gravarAudit(
  organizationId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  actorUserId: string | null,
  metadata: Record<string, unknown> = {},
  requestId?: string,
): Promise<void> {
  try {
    await dbExecute(
      `INSERT INTO api_audit_log (
        id, organization_id, user_id, action, resource_type, resource_id, request_body, response_body,
        ip, user_agent, duration_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, datetime('now'))`,
      [
        randomId(),
        organizationId,
        actorUserId,
        action,
        resourceType,
        resourceId,
        JSON.stringify(metadata),
        requestId || null,
      ],
    );
  } catch {
    // Falha baixo
  }
}

/**
 * Clona o negócio no funil de destino e encerra a origem — a ÚNICA forma de
 * trocar de funil do sistema (automação e roteador de intenção, #2155).
 *
 * Mesma ordem da rota do clone, e pelas mesmas razões: o funil de destino
 * confere a etapa, a origem confere se tem onde fechar (sem isso o clone
 * nasceria com a origem aberta — o defeito de novo, agora em dobro) e só então
 * o clone é criado e a origem encerrada como PERDIDA com o motivo da
 * transferência. A exigência de campos da etapa de perda da ORIGEM pergunta
 * ANTES do clone (#2303): `encerraDemanda` faria a mesma pergunta, mas já com
 * o clone gravado — dois abertos.
 *
 * O motivo é o canônico `moved_to_another_pipeline`, que não é
 * perda comercial: `fn_attendant_metrics` o exclui (migration 0266).
 *
 * `razaoNaTimeline` diz QUEM levou o card — a automação ou o roteador de
 * intenção —, porque é a única pista que o operador tem ao ler a linha do tempo.
 *
 * Devolve o erro em vez de lançar (uma exceção: a régua de campos obrigatórios,
 * que LANÇA o MESMO 422 `required_fields_missing` de `createLeadHandler`, para
 * os dois chamadores continuarem tratando exatamente o mesmo código): quem
 * chama transforma isso no `status: "failed"` da execução, que é o que a aba
 * Atividade mostra ao operador.
 */
export async function transfereParaOFunil(
  _dbOrClient: unknown,
  organizationId: string,
  handlerCtx: HandlerCtx,
  origem: OrigemParaClonar,
  pipelineId: string,
  stageId: string | null,
  razaoNaTimeline: string,
): Promise<{ ok: true; clone: Record<string, unknown> } | { ok: false; error: string }> {
  const recusa = recusaTrocaDeFunil(origem, pipelineId);
  if (recusa) return { ok: false, error: recusa.code };

  // Busca etapas do funil de destino pelo banco local
  const { etapas, erro: etapasErr } = await buscaEtapasDoFunil(organizationId, pipelineId);
  if (etapasErr) return { ok: false, error: etapasErr };

  const destino = escolheEtapaDeDestino(etapas, stageId);
  if (!destino.ok) return { ok: false, error: destino.code };

  // Busca etapa de perda do funil de origem
  const { etapaId, erro: perdaErr } = await buscaEtapaDePerda(organizationId, origem.pipeline_id);
  if (perdaErr) return { ok: false, error: perdaErr };
  if (!etapaId) return { ok: false, error: "origem_sem_etapa_de_perda" };

  // ── A RÉGUA DE CAMPOS DA ETAPA DE PERDA DA ORIGEM, ANTES DA PRIMEIRA ESCRITA ──
  //
  // `encerraDemanda` faz esta mesma pergunta — com a MESMA função
  // (`validaCamposExigidos`) —, mas lá dentro ela só roda DEPOIS do clone já
  // gravado: a troca de funil são duas escritas sem transação entre elas. Quando
  // a etapa de perda da ORIGEM tem `obrigatorio_em` (por `ao_perder` ou por
  // etapa) com um campo que o negócio não tem, o `required_fields_missing`
  // nascia tarde e o cliente ficava com DOIS negócios abertos, um em cada funil
  // (#2303) — a recusa dizendo "nada mudou" com o clone já no destino.
  //
  // Aqui a pergunta custa uma leitura e não deixa meio-estado nenhuma: se
  // recusar, o clone ainda não existe. Mesmo veredito de lá, byte a byte —
  // settings do funil da ORIGEM (fail-open: `null` = nada exigido) e destino =
  // a etapa de perda que a busca acima acabou de achar, com `desfecho: "lost"`.
  // O atalho "já estava perdido" de `encerraDemanda` (que devolve `jaEstaria`
  // sem validar) não é alcançável por aqui: `recusaTrocaDeFunil` lá em cima já
  // recusou origem que não está `open`.
  //
  // A recusa é o MESMO 422 `required_fields_missing` com `details.faltando` que
  // os dois chamadores já tratam — a automação vira `status: "failed"` na aba
  // Atividade e o roteador de intenção (#2297) abre o aviso na Central apontando
  // para o negócio de origem, que continua aberto.
  const settingsDaOrigem = await buscaSettingsDoFunil(origem.pipeline_id);
  const vereditoDaOrigem = validaCamposExigidos({
    lead: origem as unknown as Record<string, unknown>,
    settingsDoFunil: settingsDaOrigem,
    destino: { stageId: etapaId, desfecho: "lost" },
    motivoDeGanho: null,
  });
  if (vereditoDaOrigem.faltando.length > 0) {
    const recusaDaOrigem = recusaDeCamposObrigatorios(
      vereditoDaOrigem.faltando,
      handlerCtx.idioma,
    );
    throw new ApiError(
      422,
      recusaDaOrigem.codigo,
      { faltando: vereditoDaOrigem.faltando },
      handlerCtx.requestId,
      recusaDaOrigem.mensagem,
    );
  }

  // Prepara o payload do clone
  const payloadDoClone = montaPayloadDoClone(origem, destino.etapa);

  // Cria o lead no funil de destino pelo banco local
  const { id: cloneId, lead: cloneLead, erro: erroCriacao } = await criarLeadLocal(
    organizationId,
    payloadDoClone as any,
  );
  if (erroCriacao) return { ok: false, error: erroCriacao };

  // ── EMITE EVENTOS E TIMELINE ────────────────────────────────────────────────
  //
  // Emite a atividade de "moved_from_pipeline" e o evento lead.moved_to_pipeline

  // Atualiza a origem com o source_metadata e status
  const motivoTransferencia = motivoDaPerdaDaOrigem(null);
  const sourceMetadata = {
    ...(origem.source_metadata || {}),
    movido_para: {
      lead_id: cloneId,
      pipeline_id: pipelineId,
      stage_id: destino.etapa.id,
    },
  };

  const nowIso = new Date().toISOString();
  await dbExecute(
    `UPDATE crm_leads
     SET stage_id = ?, position_in_stage = position_in_stage + 1000,
         status = 'lost', lost_reason = ?, source_metadata = ?, updated_at = ?, closed_at = ?
     WHERE id = ? AND organization_id = ? AND status = 'open'`,
    [
      etapaId,
      motivoTransferencia,
      JSON.stringify(sourceMetadata),
      nowIso,
      nowIso,
      origem.id,
      organizationId,
    ],
  );

  // Emite atividade na timeline
  await emitirAtividadeLead(
    organizationId,
    origem.id,
    "moved_from_pipeline",
    "crm",
    origem.id,
    { type: handlerCtx.actor.type, id: handlerCtx.actor.id },
    razaoNaTimeline,
    {
      to_pipeline_id: pipelineId,
      to_lead_id: cloneId,
    },
  );

  // Emite evento
  await emitirEvento(
    organizationId,
    "lead.moved_to_pipeline",
    "crm_lead",
    origem.id,
    {
      to_pipeline_id: pipelineId,
      to_lead_id: cloneId,
    },
    {
      ...handlerCtx.actor,
      request_id: handlerCtx.requestId,
    },
  );

  // Grava audit
  const actorUserId = handlerCtx.actor.type === "user" ? handlerCtx.actor.id : null;
  await gravarAudit(
    organizationId,
    "lead.moved_to_pipeline",
    "crm_lead",
    origem.id,
    actorUserId,
    {
      from_pipeline_id: origem.pipeline_id,
      to_pipeline_id: pipelineId,
      to_stage_id: destino.etapa.id,
      cloned_lead_id: cloneId,
      lost_reason: motivoTransferencia,
    },
    handlerCtx.requestId,
  );

  return { ok: true, clone: cloneLead };
}