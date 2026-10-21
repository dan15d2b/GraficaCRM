import { requireSupportWrite } from "@/lib/impersonate/support";
/**
 * GET /api/v1/revendedor/assinaturas — lista assinaturas de todas as organizações.
 *
 * Exige papel de administrador da instalação (platform_admin).
 */
import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";

import { ok, fail } from "@/lib/api/wrappers";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  const supportDenied = await requireSupportWrite();
  if (supportDenied) return supportDenied;

  const requestId = randomUUID();
  await requirePlatformAdmin();

  const admin = createAdminClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;

  let query = admin
    .from("revendedor_assinaturas")
    .select(`
      *,
      plano:revendedor_planos (nome, preco_mensal_cents),
      organizacao:organizations (name, display_name, cnpj)
    `)
    .order("proximo_vencimento", { ascending: true });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return fail("db_error", error.message, 500, { requestId });
  }

  return ok(data ?? [], { requestId });
}
