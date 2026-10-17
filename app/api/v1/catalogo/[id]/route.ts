import { requireSupportWrite } from "@/lib/impersonate/support";
/**
 * PATCH /api/v1/catalogo/[id] — atualiza um item do catálogo.
 * DELETE /api/v1/catalogo/[id] — exclui um item do catálogo.
 *
 * A organização vem do cookie/JWT, nunca do corpo.
 */
import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";

import { resolveAuthDual, tetoDeEscritaDoToken } from "@/lib/api/auth-dual";
import { ApiError } from "@/lib/api/types";
import { ok, fail } from "@/lib/api/wrappers";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const atualizarProdutoSchema = z.object({
  nome: z.string().min(2).max(200).optional(),
  descricao: z.string().max(1000).optional().nullable(),
  categoria: z.enum([
    "grafica",
    "comunicacao_visual",
    "acabamento",
    "instalacao",
    "arte",
    "outro",
  ]).optional(),
  unidade: z.string().min(1).max(40).optional(),
  preco_cents: z.coerce.number().int().nonnegative().optional(),
  moeda: z.string().length(3).optional(),
  ativo: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const supportDenied = await requireSupportWrite();
  if (supportDenied) return supportDenied;

  const requestId = randomUUID();
  const { id: produtoId } = await ctx.params;

  const supabase = await createClient();
  const authz = await resolveAuthDual(req, {
    requestId,
    resource: "catalogo_produtos",
    role: "agent",
    scope: "mcp:write",
  });
  if (!authz.ok) return authz.response;

  const tetoEstourado = await tetoDeEscritaDoToken(authz, "catalogo", requestId);
  if (tetoEstourado) return tetoEstourado;

  let corpo;
  try {
    corpo = atualizarProdutoSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return fail("invalid_input", "Corpo inválido.", 400, {
        details: err.flatten(),
        requestId,
      });
    }
    throw err;
  }

  const { data, error } = await supabase
    .from("catalogo_produtos")
    .update(corpo)
    .eq("id", produtoId)
    .eq("organization_id", authz.org.orgId)
    .select()
    .maybeSingle();

  if (error) {
    return fail("db_error", error.message, 500, { requestId });
  }

  if (!data) {
    return fail("not_found", "Produto não encontrado.", 404, { requestId });
  }

  return ok(data, { requestId });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const supportDenied = await requireSupportWrite();
  if (supportDenied) return supportDenied;

  const requestId = randomUUID();
  const { id: produtoId } = await ctx.params;

  const supabase = await createClient();
  const authz = await resolveAuthDual(req, {
    requestId,
    resource: "catalogo_produtos",
    role: "agent",
    scope: "mcp:write",
  });
  if (!authz.ok) return authz.response;

  const tetoEstourado = await tetoDeEscritaDoToken(authz, "catalogo", requestId);
  if (tetoEstourado) return tetoEstourado;

  const { error } = await supabase
    .from("catalogo_produtos")
    .delete()
    .eq("id", produtoId)
    .eq("organization_id", authz.org.orgId);

  if (error) {
    return fail("db_error", error.message, 500, { requestId });
  }

  return ok({ id: produtoId, excluido: true }, { requestId });
}
