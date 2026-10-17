import { requireSupportWrite } from "@/lib/impersonate/support";
/**
 * PATCH /api/v1/leads/[id]/aprovar-arte
 *
 * Aprova ou solicita ajuste na arte de um lead (Gráfica / Comunicação Visual).
 *
 * Corpo:
 *   { status: "aprovado" | "ajuste_solicitado", versao?: string, observacoes?: string }
 *
 * Grava em crm_leads: arte_status, arte_versao, arte_aprovado_em, arte_aprovado_por, arte_observacoes.
 */
import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";

import { ApiError } from "@/lib/api/types";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const corpoSchema = z.object({
  status: z.enum(["aprovado", "ajuste_solicitado"]),
  versao: z.string().max(20).optional(),
  observacoes: z.string().max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const supportDenied = await requireSupportWrite();
  if (supportDenied) return supportDenied;

  const requestId = randomUUID();
  const { id: leadId } = await ctx.params;

  const supabase = await createClient();
  const authz = await requireRole("agent", { requestId, resource: "crm_leads" });
  if (!authz.ok) return authz.response;

  let corpo;
  try {
    corpo = corpoSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail("invalid_input", "Corpo inválido.", 400, {
        details: err.flatten(),
        requestId,
      });
    }
    throw err;
  }

  // Verifica se o lead existe e pertence à organização (via RLS).
  const { data: lead, error: leadErr } = await supabase
    .from("crm_leads")
    .select("id, status, arte_status")
    .eq("id", leadId)
    .maybeSingle();

  if (leadErr || !lead) {
    return fail("not_found", "Lead não encontrado.", 404, { requestId });
  }

  const valores: Record<string, unknown> = {
    arte_status: corpo.status,
    arte_aprovado_por: authz.user.id,
  };

  if (corpo.status === "aprovado") {
    valores.arte_aprovado_em = new Date().toISOString();
    if (corpo.versao) valores.arte_versao = corpo.versao;
  }

  if (corpo.observacoes !== undefined) {
    valores.arte_observacoes = corpo.observacoes;
  }

  const { data: atualizado, error: updErr } = await supabase
    .from("crm_leads")
    .update(valores)
    .eq("id", leadId)
    .select("id, arte_status, arte_versao, arte_aprovado_em, arte_aprovado_por, arte_observacoes")
    .maybeSingle();

  if (updErr) {
    return fail("db_error", updErr.message, 500, { requestId });
  }

  // Auditoria da mutação.
  await supabase.from("event_log").insert({
    organization_id: authz.org.orgId,
    event_type: "lead.aprovacao_arte",
    entity_kind: "crm_lead",
    entity_id: leadId,
    payload: {
      lead_id: leadId,
      status_anterior: lead.arte_status,
      status_novo: corpo.status,
      versao: corpo.versao,
      observacoes: corpo.observacoes,
    },
  });

  return ok(atualizado, { requestId });
}
