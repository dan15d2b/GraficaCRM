/**
 * Rotas de integração com o sistema Vetor
 *
 * Autenticação: Header X-Vetor-Token (configurado em VETOR_INTEGRATION_TOKEN)
 *
 * Estas rotas são de integração automatizada e usam tokens de serviço.
 * São consideradas infrastructure routes - não requerem requireSupportWrite pois
 * são chamadas automatizadas pelo sistema Vetor, não por humanos.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbQuery, dbExecute } from "@/lib/db/local";
import { randomUUID } from "crypto";

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
      { error: { code: "validation_error", message: "Dados inválidos" } },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const orgId = process.env.DEFAULT_ORGANIZATION_ID!;

  // Busca cliente existente por CPF/CNPJ ou telefone
  let existingContact: { id: string } | null = null;
  if (data.cpf_cnpj) {
    const result = await dbQuery<{ id: string }>(
      "SELECT id FROM contacts WHERE organization_id = ? AND cpf_cnpj = ? LIMIT 1",
      [orgId, data.cpf_cnpj]
    );
    existingContact = result.rowCount > 0 ? (result.rows[0] as { id: string }) : null;
  }
  if (!existingContact && data.telefone) {
    const result = await dbQuery<{ id: string }>(
      "SELECT id FROM contacts WHERE organization_id = ? AND phone LIKE ? LIMIT 1",
      [orgId, `%${data.telefone}`]
    );
    existingContact = result.rowCount > 0 ? (result.rows[0] as { id: string }) : null;
  }

  const contactId = existingContact?.id ?? randomUUID();

  if (existingContact) {
    await dbExecute(
      `UPDATE contacts SET name = ?, phone = ?, email = ?, notes = ?, tags = ?, updated_at = ? WHERE id = ?`,
      [data.nome, data.telefone ?? null, data.email ?? null, data.observacoes ?? null, data.tags ?? [], new Date().toISOString(), existingContact.id]
    );
  } else {
    await dbExecute(
      `INSERT INTO contacts (id, organization_id, name, phone, email, notes, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [contactId, orgId, data.nome, data.telefone ?? null, data.email ?? null, data.observacoes ?? null, data.tags ?? [], new Date().toISOString(), new Date().toISOString()]
    );
  }

  // Busca pipeline Comercial
  const pipelineResult = await dbQuery<{ id: string }>(
    `SELECT id FROM crm_pipelines WHERE organization_id = ? AND slug = 'comercial' LIMIT 1`,
    [orgId]
  );
  const pipelineId = pipelineResult.rowCount > 0 ? (pipelineResult.rows[0] as { id: string }).id : null;

  const stageResult = await dbQuery<{ id: string }>(
    `SELECT id FROM crm_stages WHERE pipeline_id = ? AND slug = 'novo_lead' LIMIT 1`,
    [pipelineId]
  );
  const stageId = stageResult.rowCount > 0 ? (stageResult.rows[0] as { id: string }).id : null;

  await dbExecute(
    `INSERT INTO crm_leads (id, organization_id, pipeline_id, stage_id, contact_id, title, source, custom_fields, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [randomUUID(), orgId, pipelineId, stageId, contactId, data.nome_fantasia ?? data.nome, "vetor", JSON.stringify({ id_vetor: data.id_vetor }), new Date().toISOString(), new Date().toISOString()]
  );

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

export async function PUT(request: NextRequest) {
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
      { error: { code: "validation_error", message: "Dados inválidos" } },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const orgId = process.env.DEFAULT_ORGANIZATION_ID!;

  // Busca lead pelo id_vetor do cliente
  const leadResult = await dbQuery<{ id: string; contact_id: string | null }>(
    `SELECT id, contact_id FROM crm_leads WHERE organization_id = ? AND custom_fields->>id_vetor = ? LIMIT 1`,
    [orgId, data.cliente_id]
  );

  if (leadResult.rowCount === 0) {
    return NextResponse.json(
      { error: { code: "client_not_found", message: `Cliente ${data.cliente_id} não encontrado` } },
      { status: 404 }
    );
  }

  const lead = leadResult.rows[0] as { id: string; contact_id: string | null };

  // Busca pipeline e stage
  const pipelineResult = await dbQuery<{ id: string }>(
    `SELECT id FROM crm_pipelines WHERE organization_id = ? AND slug = 'comercial' LIMIT 1`,
    [orgId]
  );
  const pipelineId = pipelineResult.rowCount > 0 ? (pipelineResult.rows[0] as { id: string }).id : null;

  const stageResult = await dbQuery<{ id: string }>(
    `SELECT id FROM crm_stages WHERE pipeline_id = ? AND slug = 'orcamento_enviado' LIMIT 1`,
    [pipelineId]
  );
  const stageId = stageResult.rowCount > 0 ? (stageResult.rows[0] as { id: string }).id : null;

  // Atualiza lead
  await dbExecute(
    `UPDATE crm_leads SET stage_id = ?, value_cents = ?, custom_fields = ?, prazo_entrega = ?, updated_at = ? WHERE id = ?`,
    [stageId, Math.round(data.valor_total * 100), JSON.stringify({ id_vetor: data.id_vetor, numero_os: data.numero_os, prazo_entrega: data.prazo_entrega, condicoes_pagamento: data.condicoes_pagamento, itens_orcamento: data.itens }), data.prazo_entrega ? new Date(data.prazo_entrega) : null, new Date().toISOString(), lead.id]
  );

  return NextResponse.json({
    success: true,
    lead_id: lead.id,
    pipeline_id: pipelineId,
    stage_id: stageId,
    message: "Orçamento recebido e lead atualizado",
  }, { status: 201 });
}