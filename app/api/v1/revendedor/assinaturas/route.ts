import { requireSupportWrite } from "@/lib/impersonate/support";
/**
 * GET /api/v1/revendedor/assinaturas — lista assinaturas de todas as organizações.
 *
 * Exige papel de administrador da instalação (platform_admin).
 */
import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";

import { resolveAuthDual } from "@/lib/api/auth-dual";
import { requireRole } from "@/lib/auth/require-role";
import { ok, fail } from "@/lib/api/wrappers";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
): Promise<Response> {
  const supportDenied = await requireSupportWrite();
  if (supportDenied) return supportDenied;

  const requestId = randomUUID();

  const admin = createAdminClient();
  const authz = await resolveAuthDual(req, {
    requestId,
    resource: "revendedor_assinaturas",
    role: "platform_admin",
    scope: "mcp:read",
  });
  if (!authz.ok) return authz.response;

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
