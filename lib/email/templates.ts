/**
 * CRMGráfica 2.0 — Templates de E-mail
 */

export function renderEmailTemplate(template: string, data: Record<string, unknown>): string {
  if (template === "weekly-report") {
    const { companyName, totalOrders, completedOrders, delayedOrders, avgSLA, ordersByStatus } = data as {
      companyName: string;
      totalOrders: number;
      completedOrders: number;
      delayedOrders: number;
      avgSLA: number;
      ordersByStatus: Record<string, number>;
    };

    const statusRows = Object.entries(ordersByStatus)
      .map(([status, count]) => `<tr><td>${status}</td><td>${count}</td></tr>`)
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório Semanal</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3f586d;">📊 Relatório Semanal - ${companyName}</h1>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Métricas da Semana</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Total de Ordens</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${totalOrders}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Concluídas</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #10b981; font-weight: bold;">${completedOrders}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Atrasadas</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #ef4444; font-weight: bold;">${delayedOrders}</td></tr>
            <tr><td style="padding: 8px;">SLA Médio</td><td style="padding: 8px; font-weight: bold;">${avgSLA}h</td></tr>
          </table>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Distribuição por Status</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${statusRows}
          </table>
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 40px;">
          Este relatório foi gerado automaticamente pelo CRMGráfica 2.0
        </p>
      </body>
      </html>
    `.trim();
  }

  return "<p>Template não encontrado</p>";
}
