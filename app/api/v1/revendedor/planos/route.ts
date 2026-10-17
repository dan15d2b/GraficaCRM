import { requireSupportWrite } from "@/lib/impersonate/support";
/**
 * GET /api/v1/revendedor/planos — lista planos de assinatura do revendedor.
 * POST /api/v1/revendedor/planos — cria um novo plano.
 *
 * Exige papel de administrador da instalação (platform_admin).
 */
import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";

import { resolveAuthDual } from "@/lib/api/auth-dual";
import { requireRole } from "@/lib/auth/require-role";
import { ok, fail } from "@/lib/api/wrappers";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const criarPlanoSchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().max(500).optional(),
  preco_mensal_cents: z.coerce.number().int().nonnegative(),
  limite_usuarios: z.coerce.number().int().positive().default(3),
  limite_conversas_mes: z.coerce.number().int().positive().default(500),
  limite_ia_mes: z.coerce.number().int().positive().default(1000),
  ativo: z.boolean().default(true),
});

export async function GET(
  req: NextRequest,
): Promise<Response> {
  const supportDenied = await requireSupportWrite();
  if (supportDenied) return supportDenied;

  const requestId = randomUUID();

  const admin = createAdminClient();
  const authz = await resolveAuthDual(req, {
    requestId,
    resource: "revendedor_planos",
    role: "platform_admin",
    scope: "mcp:read",
  });
  if (!authz.ok) return authz.response;

  const { data, error } = await admin
    .from("revendedor_planos")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    return fail("db_error", error.message, 500, { requestId });
  }

  return ok(data ?? [], { requestId });
}

export async function POST(
  req: NextRequest,
): Promise<Response> {
  const supportDenied = await requireSupportWrite();
  if (supportDenied) return supportDenied;

  const requestId = randomUUID();

  const admin = createAdminClient();
  const authz = await resolveAuthDual(req, {
    requestId,
    resource: "revendedor_planos",
    role: "platform_admin",
    scope: "mcp:write",
  });
  if (!authz.ok) return authz.response;

  let corpo;
  try {
    corpo = criarPlanoSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail("invalid_input", "Corpo inválido.", 400, {
        details: err.flatten(),
        requestId,
      });
    }
    throw err;
  }

  const { data, error } = await admin
    .from("revendedor_planos")
    .insert({
      nome: corpo.nome,
      descricao: corpo.descricao ?? null,
      preco_mensal_cents: corpo.preco_mensal_cents,
      limite_usuarios: corpo.limite_usuarios,
      limite_conversas_mes: corpo.limite_conversas_mes,
      limite_ia_mes: corpo.limite_ia_mes,
      ativo: corpo.ativo,
    })
    .select()
    .maybeSingle();

  if (error) {
    return fail("db_error", error.message, 500, { requestId });
  }

  return ok(data, { requestId, status: 201 });
}
