/**
 * CRMGráfica 2.0 — Exportação CSV de Pedidos
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

const STATUS_LABELS: Record<string, string> = {
  prospect: "Orçamento",
  qualificacao: "Qualificação",
  triagem: "Triagem",
  impressao: "Impressão",
  acabamento: "Acabamento",
  qualidade: "Controle Qualidade",
  pronto_retirada: "Pronto para Retirada",
  aguardando_instalacao: "Aguardando Instalação",
  servico_concluido: "Serviço Concluído",
  nao_fechou: "Não Fechou",
  entregue: "Entregue",
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export async function GET(request: Request) {
  const auth = await requireRole("admin", { resource: "producao_export" });
  if (!auth.ok) return auth.response;

  const { org } = auth;
  const { searchParams } = new URL(request.url);
  const dateFilter = searchParams.get("date") || "today";
  const status = searchParams.get("status") || "";

  const supabase = await createClient();

  // Buscar pedidos
  let query = supabase
    .from("leads")
    .select(`
      id,
      order_number,
      status,
      priority,
      due_date,
      total_value,
      notes,
      contacts (name, phone_number, email)
    `)
    .eq("organization_id", org.orgId);

  // Filtrar por data
  const now = new Date();
  if (dateFilter === "today") {
    const start = new Date(now.setHours(0, 0, 0, 0));
    const end = new Date(now.setHours(23, 59, 59, 999));
    query = query.gte("created_at", start.toISOString());
    query = query.lte("created_at", end.toISOString());
  } else if (dateFilter === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    query = query.gte("created_at", start.toISOString());
  } else if (dateFilter === "month") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    query = query.gte("created_at", start.toISOString());
  }

  // Filtrar por status
  if (status) {
    query = query.eq("status", status);
  }

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 });
  }

  // Gerar CSV
  const headers = [
    "Número",
    "Cliente",
    "Telefone",
    "Email",
    "Status",
    "Prioridade",
    "Data Criação",
    "Prazo",
    "Valor (R$)",
    "Observações",
  ];

  const rows = (orders || []).map((order: any) => [
    order.order_number || order.id,
    order.contacts?.[0]?.name || "N/A",
    order.contacts?.[0]?.phone_number || "",
    order.contacts?.[0]?.email || "",
    STATUS_LABELS[order.status] || order.status,
    PRIORITY_LABELS[order.priority] || order.priority,
    new Date(order.created_at).toLocaleDateString("pt-BR"),
    order.due_date ? new Date(order.due_date).toLocaleDateString("pt-BR") : "",
    (order.total_value || 0).toFixed(2),
    (order.notes || "").replace(/\n/g, " "),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

  const filename = `pedidos_${dateFilter}_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
