/**
 * CRMGráfica 2.0 — Handler de alteração de status de produção
 * 
 * Disparado quando um pedido muda de estágio no funil de produção.
 * Envia notificação WhatsApp automática para "Pronto para Retirada"
 * e mensagem com link de avaliação para "Serviço Concluído".
 */

import { handleStatusChange } from "@/lib/license/pickup-trigger";
import { registerHandler } from "@/lib/event-log/dispatcher";

export interface ProductionStatusEventPayload {
  orderId: string;
  orderNumber: string;
  clientId: string;
  fromStatus: string;
  toStatus: string;
  organizationId: string;
}

async function productionStatusHandler(event: {
  organization_id: string;
  event_type: string;
  entity_kind: string;
  entity_id: string;
  status: string;
  payload: unknown;
}): Promise<void> {
  const p = event.payload as ProductionStatusEventPayload | null;
  if (!p) return;

  const { orderId, orderNumber, clientId, toStatus, organizationId } = p;

  // Só processa os statuses que geram automação
  if (toStatus !== "pronto_retirada" && toStatus !== "servico_concluido") return;

  await handleStatusChange(organizationId, clientId, orderNumber, toStatus);
}

// Registrar handler
registerHandler({
  name: "production_status_handler",
  eventTypes: ["lead.stage_changed", "order.status_changed"],
  handler: productionStatusHandler,
});
