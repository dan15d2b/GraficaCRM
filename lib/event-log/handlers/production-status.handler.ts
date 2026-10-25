/**
 * CRMGráfica 2.0 — Handler de alteração de status de produção
 *
 * Disparado quando um pedido muda de estágio no funil de produção.
 * Envia notificação WhatsApp automática para "Pronto para Retirada"
 * e mensagem com link de avaliação para "Serviço Concluído".
 */

import { handleStatusChange } from "@/lib/license/pickup-trigger";
import type { EventHandler, EventRow, HandlerResult } from "@/lib/event-log/dispatcher";

export interface ProductionStatusEventPayload {
  orderId?: string;
  orderNumber?: string;
  clientId?: string;
  fromStatus?: string;
  toStatus?: string;
  organizationId?: string;
}

const CONSUMER_KEY = "production_status_handler";

export const productionStatusHandler: EventHandler = {
  key: CONSUMER_KEY,
  events: ["lead.stage_changed", "order.status_changed"],
  naOrgParada: "pula",
  async handle(row: EventRow): Promise<HandlerResult> {
    const p = (row.payload ?? null) as ProductionStatusEventPayload | null;
    if (!p) {
      return { consumer_key: CONSUMER_KEY, status: "skipped", detail: "empty_payload" };
    }

    const { orderNumber, clientId, toStatus } = p;
    const organizationId = p.organizationId || row.organization_id;

    // Só processa os statuses que geram automação
    if (toStatus !== "pronto_retirada" && toStatus !== "servico_concluido") {
      return { consumer_key: CONSUMER_KEY, status: "skipped", detail: "status_ignorado" };
    }

    if (!clientId || !orderNumber) {
      return { consumer_key: CONSUMER_KEY, status: "skipped", detail: "dados_incompletos" };
    }

    await handleStatusChange(organizationId, clientId, orderNumber, toStatus);
    return { consumer_key: CONSUMER_KEY, status: "ok" };
  },
};
