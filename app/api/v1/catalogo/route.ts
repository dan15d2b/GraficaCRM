import { requireSupportWrite } from "@/lib/impersonate/support";
/**
 * GET /api/v1/catalogo — lista produtos/serviços da organização (com filtro opcional por categoria/ativo).
 * POST /api/v1/catalogo — cria um novo item do catálogo.
 *
 * Ambas exigem sessão válida (agent+). A organização vem do cookie/JWT, nunca do corpo.
 */
import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

import { resolveAuthDual, tetoDeEscritaDoToken } from "@/lib/api/auth-dual";
import { ApiError } from "@/lib/api/types";
import { ok, fail } from "@/lib/api/wrappers";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const criarProdutoSchema = z.object({
  nome: z.string().min(2).max(200),
  descricao: z.string().max(1000).optional(),
  categoria: z.enum([
    "grafica",
    "comunicacao_visual",
    "acabamento",
    "instalacao",
    "arte",
    "outro",
  ]),
  unidade: z.string().min(1).max(40).default("unidade"),
  preco_cents: z.coerce.number().int().nonnegative(),
  moeda: z.string().length(3).default("BRL"),
  ativo: z.boolean().default(true),
});

export async function GET(
  req: NextRequest,
): Promise<Response> {
  const supportDenied = await requireSupportWrite();
  if (supportDenied) return supportDenied;

  const requestId = randomUUID();

  const supabase = await createClient();
  const authz = await resolveAuthDual(req, {
    requestId,
    resource: "catalogo_produtos",
    role: "agent",
    scope: "mcp:read",
  });
  if (!authz.ok) return authz.response;

  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria") || undefined;
  const ativo = searchParams.get("ativo");

  let query = supabase
    .from("catalogo_produtos")
    .select("id, nome, descricao, categoria, unidade, preco_cents, moeda, ativo, created_at, updated_at")
    .eq("organization_id", authz.organizationId)
    .order("nome", { ascending: true });

  if (categoria) query = query.eq("categoria", categoria);
  if (ativo !== null && ativo !== undefined) {
    query = query.eq("ativo", ativo === "true");
  }

  const { data, error } = await query;

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
    corpo = criarProdutoSchema.parse(await req.json());
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
    .insert({
      organization_id: authz.organizationId,
      nome: corpo.nome,
      descricao: corpo.descricao ?? null,
      categoria: corpo.categoria,
      unidade: corpo.unidade,
      preco_cents: corpo.preco_cents,
      moeda: corpo.moeda,
      ativo: corpo.ativo,
    })
    .select()
    .maybeSingle();

  if (error) {
    return fail("db_error", error.message, 500, { requestId });
  }

  return ok(data, { requestId, status: 201 });
}
