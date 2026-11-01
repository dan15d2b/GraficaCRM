/**
 * Rotas de integração com o sistema Vetor
 * 
 * Autenticação: Header X-Vetor-Token (configurado em VETOR_INTEGRATION_TOKEN)
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";

// ============================================================================
// VALIDAÇÃO DE INPUT
// ============================================================================

const VetorClientSchema = z.object({
  id_vetor: z.string().min(1),
  nome: z.string().min(1),
  nome_fantasia: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  endereco: z.object({
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    cep: z.string().optional(),
  }).optional(),
  observacoes: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
});

const VetorQuoteItemSchema = z.object({
  produto: z.string().min(1),
  quantidade: z.number().min(1),
  unidade: z.string().default("un"),
  preco_unitario: z.number().min(0),
  total: z.number().min(0).optional(),
});

const VetorQuoteSchema = z.object({
  id_vetor: z.string().min(1),
  cliente_id: z.string().min(1),
  numero_os: z.string().optional(),
  valor_total: z.number().min(0),
  moeda: z.string().default("BRL"),
  prazo_entrega: z.string().optional(),
  condicoes_pagamento: z.string().optional(),
  itens: z.array(VetorQuoteItemSchema).min(1),
  observacoes: z.string().max(1000).optional(),
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "crm-grafica-vetor-integration",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// SINCRONIZAR CLIENTE
// ============================================================================

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-vetor-token") ?? "";
  if (token !== process.env.VETOR_INTEGRATION_TOKEN) {
    return NextResponse.json(
      { error: { code: "invalid_token", message: "Token inválido" } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_json", message: "JSON inválido" } },
      { status: 400 }
    );
  }

  const parsed = VetorClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "Dados inválidos", details: parsed.error.errors } },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const supabase = await createClient();
  const orgId = process.env.DEFAULT_ORGANIZATION_ID!;

  // Busca cliente existente por CPF/CNPJ ou telefone
  let existingContact = null;
  if (data.cpf_cnpj) {
    const { data: found } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", orgId)
      .eq("cpf_cnpj", data.cpf_cnpj)
      .maybeSingle();
    existingContact = found;
  }
  if (!existingContact && data.telefone) {
    const { data: found } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", orgId)
      .ilike("phone", data.telefone)
      .maybeSingle();
    existingContact = found;
  }

  const contactId = existingContact?.id ?? randomUUID();

  if (existingContact) {
    await supabase
      .from("contacts")
      .update({
        name: data.nome,
        phone: data.telefone ?? null,
        email: data.email ?? null,
        notes: data.observacoes ?? null,
        tags: data.tags ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingContact.id);
  } else {
    await supabase.from("contacts").insert({
      id: contactId,
      organization_id: orgId,
      name: data.nome,
      phone: data.telefone ?? null,
      email: data.email ?? null,
      notes: data.observacoes ?? null,
      tags: data.tags ?? [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Busca pipeline Comercial
  const { data: pipeline } = await supabase
    .from("crm_pipelines")
    .select("id")
    .eq("organization_id", orgId)
    .eq("slug", "comercial")
    .single();

  const { data: stage } = await supabase
    .from("crm_stages")
    .select("id")
    .eq("pipeline_id", pipeline?.id)
    .eq("slug", "novo_lead")
    .single();

  await supabase.from("crm_leads").insert({
    id: randomUUID(),
    organization_id: orgId,
    pipeline_id: pipeline?.id,
    stage_id: stage?.id,
    contact_id: contactId,
    title: data.nome_fantasia ?? data.nome,
    source: "vetor",
    custom_fields: { id_vetor: data.id_vetor } as Record<string, unknown>,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    client_id: data.id_vetor,
    lead_id: contactId,
    action: existingContact ? "updated" : "created",
    message: existingContact ? "Cliente atualizado com sucesso" : "Cliente criado com sucesso",
  }, { status: 201 });
}

// ============================================================================
// RECEBER ORÇAMENTO
// ============================================================================

export async function quotesPOST(request: NextRequest) {
  const token = request.headers.get("x-vetor-token") ?? "";
  if (token !== process.env.VETOR_INTEGRATION_TOKEN) {
    return NextResponse.json(
      { error: { code: "invalid_token", message: "Token inválido" } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_json", message: "JSON inválido" } },
      { status: 400 }
    );
  }

  const parsed = VetorQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "Dados inválidos", details: parsed.error.errors } },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const supabase = await createClient();
  const orgId = process.env.DEFAULT_ORGANIZATION_ID!;

  // Busca lead pelo id_vetor do cliente
  const { data: lead } = await supabase
    .from("crm_leads")
    .select("id, contact_id")
    .eq("organization_id", orgId)
    .eq("custom_fields->>id_vetor", data.cliente_id)
    .single();

  if (!lead) {
    return NextResponse.json(
      { error: { code: "client_not_found", message: `Cliente ${data.cliente_id} não encontrado` } },
      { status: 404 }
    );
  }

  // Busca pipeline e stage
  const { data: pipeline } = await supabase
    .from("crm_pipelines")
    .select("id")
    .eq("organization_id", orgId)
    .eq("slug", "comercial")
    .single();

  const { data: stage } = await supabase
    .from("crm_stages")
    .select("id")
    .eq("pipeline_id", pipeline?.id)
    .eq("slug", "orcamento_enviado")
    .single();

  // Atualiza lead
  await supabase
    .from("crm_leads")
    .update({
      stage_id: stage?.id,
      value_cents: Math.round(data.valor_total * 100),
      custom_fields: {
        id_vetor: data.id_vetor,
        numero_os: data.numero_os,
        prazo_entrega: data.prazo_entrega,
        condicoes_pagamento: data.condicoes_pagamento,
        itens_orcamento: data.itens,
      } as Record<string, unknown>,
      prazo_entrega: data.prazo_entrega ? new Date(data.prazo_entrega) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lead.id);

  return NextResponse.json({
    success: true,
    lead_id: lead.id,
    pipeline_id: pipeline?.id,
    stage_id: stage?.id,
    message: "Orçamento recebido e lead atualizado",
  }, { status: 201 });
}

// ============================================================================
// ROTEAMENTO
// ============================================================================

export async function handler(request: NextRequest) {
  const { pathname } = new URL(request.url);

  if (pathname === "/api/v1/integration/vetor/health") {
    return GET();
  }

  if (pathname === "/api/v1/integration/vetor/clients") {
    if (request.method === "POST") return POST(request);
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (pathname === "/api/v1/integration/vetor/quotes") {
    if (request.method === "POST") return quotesPOST(request);
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
