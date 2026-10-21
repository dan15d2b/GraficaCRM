import { requireSupportWrite } from "@/lib/impersonate/support";
/**
 * PATCH /api/v1/revendedor/assinaturas/[id] — atualiza status/plano de uma assinatura.
 * Usado para ativar, suspender (inadimplência) ou mudar o plano de uma gráfica cliente.
 *
 * Exige papel de administrador da instalação (platform_admin).
 */
import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { z } from "zod";

import { ok, fail } from "@/lib/api/wrappers";
import {
  falhaDaEscritaDePlatformAdmin,
  requirePlatformAdminEscrita,
} from "@/lib/auth/requirePlatformAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const atualizarAssinaturaSchema = z.object({
  status: z.enum(["ativo", "suspenso", "cancelado"]).optional(),
  plano_id: z.string().uuid().optional(),
  valor_mensal_cents: z.coerce.number().int().nonnegative().optional(),
  dia_vencimento: z.coerce.number().int().min(1).max(28).optional(),
  taxa_implantação_cents: z.coerce.number().int().nonnegative().optional(),
  implantação_paga: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const supportDenied = await requireSupportWrite();
  if (supportDenied) return supportDenied;

  const requestId = randomUUID();
  const { id: assinaturaId } = await ctx.params;

  try {
    await requirePlatformAdminEscrita();
  } catch (err) {
    return falhaDaEscritaDePlatformAdmin(err, requestId);
  }

  let corpo;
  try {
    corpo = atualizarAssinaturaSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail("invalid_input", "Corpo inválido.", 400, {
        details: err.flatten(),
        requestId,
      });
    }
    throw err;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("revendedor_assinaturas")
    .update(corpo)
    .eq("id", assinaturaId)
    .select()
    .maybeSingle();

  if (error) {
    return fail("db_error", error.message, 500, { requestId });
  }

  if (!data) {
    return fail("not_found", "Assinatura não encontrada.", 404, { requestId });
  }

  return ok(data, { requestId });
}
