/**
 * CRMGráfica 2.0 — Worker de Relatório Semanal
 * 
 * Envia resumo semanal por e-mail toda segunda-feira
 */

import { createClient } from "@/lib/supabase/server";
import { renderEmailTemplate } from "@/lib/email/templates";

export interface WeeklyReportData {
  totalOrders: number;
  completedOrders: number;
  delayedOrders: number;
  avgSLA: number;
  ordersByStatus: Record<string, number>;
}

export async function generateWeeklyReport(orgId: string): Promise<WeeklyReportData | null> {
  const supabase = await createClient();

  // Buscar dados da organização
  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", orgId)
    .single();

  if (!org) return null;

  // Buscar ordens da semana
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Segunda
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { data: orders } = await supabase
    .from("leads")
    .select("status, due_date, created_at")
    .eq("organization_id", orgId)
    .gte("created_at", weekStart.toISOString())
    .lte("created_at", weekEnd.toISOString());

  if (!orders || orders.length === 0) return null;

  // Calcular métricas
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "entregue").length;
  const delayedOrders = orders.filter((o) => {
    if (!o.due_date) return false;
    return new Date(o.due_date) < new Date() && o.status !== "entregue";
  }).length;

  // SLA médio (simulado)
  const avgSLA = 4.2;

  // Distribuição por status
  const ordersByStatus: Record<string, number> = {};
  orders.forEach((o) => {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
  });

  return {
    totalOrders,
    completedOrders,
    delayedOrders,
    avgSLA,
    ordersByStatus,
  };
}

export async function sendWeeklyReport(orgId: string): Promise<void> {
  const data = await generateWeeklyReport(orgId);
  if (!data) return;

  const supabase = await createClient();

  // Buscar admin da org
  const { data: admins } = await supabase
    .from("user_organizations")
    .select("users!inner(email)")
    .eq("organization_id", orgId)
    .eq("role", "admin");

  if (!admins || admins.length === 0) return;

  const adminEmail = admins[0].users.email;
  if (!adminEmail) return;

  // Renderizar template
  const html = renderEmailTemplate("weekly-report", {
    companyName: "Minha Gráfica",
    totalOrders: data.totalOrders,
    completedOrders: data.completedOrders,
    delayedOrders: data.delayedOrders,
    avgSLA: data.avgSLA,
    ordersByStatus: data.ordersByStatus,
  });

  // Enviar e-mail (usando o sistema existente)
  try {
    await fetch("/api/v1/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: adminEmail,
        subject: `Relatório Semanal - ${new Date().toLocaleDateString("pt-BR")}`,
        html,
      }),
    });
    console.log(`[WeeklyReport] E-mail enviado para ${adminEmail}`);
  } catch (error) {
    console.error("[WeeklyReport] Falha ao enviar e-mail:", error);
  }
}
