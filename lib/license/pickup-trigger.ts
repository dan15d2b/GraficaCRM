/**
 * CRMGráfica 2.0 — Trigger: "Pronto para Retirada" e "Serviço Concluído"
 */

import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export interface CompanyLocationConfig {
  name: string;
  address: string;
  phone: string;
  mapsLink: string;
  hours: string;
  reviewLink: string;
  serviceType: string;
}

export async function getCompanyLocationConfig(orgId: string): Promise<CompanyLocationConfig | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("organization_settings")
      .select("company_name, address, phone, maps_link, business_hours, review_link, service_type")
      .eq("organization_id", orgId)
      .single();

    if (error || !data) return null;

    return {
      name: data.company_name || "Nossa Gráfica",
      address: data.address || "Rua Principal, 123 - Centro",
      phone: data.phone || "(11) 9999-9999",
      mapsLink: data.maps_link || "https://maps.google.com",
      hours: data.business_hours || "Seg-Sex: 8h às 18h",
      reviewLink: data.review_link || "",
      serviceType: data.service_type || "retirada",
    };
  } catch {
    return null;
  }
}

export function generatePickupMessage(clientName: string, orderNumber: string, config: CompanyLocationConfig): string {
  return [
    `Olá ${clientName}! 🎉`,
    ``,
    `Seu pedido #${orderNumber} está **pronto para retirada** na ${config.name}.`,
    ``,
    `📍 Endereço: ${config.address}`,
    `🗺️ Localização: ${config.mapsLink}`,
    `📞 Telefone: ${config.phone}`,
    `🕐 Horário: ${config.hours}`,
    ``,
    `Aguardamos você para retirar seu material!`,
  ].join("\n");
}

export function generateCompletionMessage(clientName: string, orderNumber: string, config: CompanyLocationConfig): string {
  const parts = [
    `Olá ${clientName}! ✅`,
    ``,
    `Seu pedido #${orderNumber} foi **concluído** na ${config.name}.`,
  ];
  
  if (config.serviceType === "instalacao") {
    parts.push(``, `O serviço de instalação foi realizado com sucesso!`);
  } else {
    parts.push(``, `Material pronto para retirada ou entrega.`);
  }
  
  if (config.reviewLink) {
    parts.push(
      ``,
      `🌟 Gostou do nosso atendimento? Deixe uma avaliação:`,
      config.reviewLink,
      ``,
      `Agradecemos a preferência! 🙏`
    );
  } else {
    parts.push(``, `Obrigado pela preferência! 🙏`);
  }
  
  return parts.join("\n");
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const wahaUrl = env.WAHA_API_BASE_URL || "http://waha:3000";
    const response = await fetch(`${wahaUrl}/message/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.WAHA_API_KEY ? { Authorization: `Bearer ${env.WAHA_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        chatId: phone.replace(/\D/g, ""),
        message,
      }),
    });

    if (!response.ok) {
      return { success: false, error: `WAHA retornou ${response.status}` };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

export async function handleStatusChange(
  orgId: string,
  clientId: string,
  orderNumber: string,
  newStatus: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: client } = await supabase
      .from("contacts")
      .select("name, phone_number")
      .eq("id", clientId)
      .single();

    if (!client?.phone_number) {
      console.warn(`[CRMGráfica] Sem telefone para notificação: ${clientId}`);
      return;
    }

    const config = await getCompanyLocationConfig(orgId);
    if (!config) {
      console.warn(`[CRMGráfica] Configuração da empresa não encontrada para ${orgId}`);
      return;
    }

    const phone = client.phone_number;
    const name = client.name || "Cliente";

    if (newStatus === "pronto_retirada") {
      const message = generatePickupMessage(name, orderNumber, config);
      const result = await sendWhatsAppMessage(phone, message);
      if (result.success) {
        console.log(`[CRMGráfica] Notificação de retirada enviada para ${phone}`);
      } else {
        console.error(`[CRMGráfica] Falha ao enviar notificação de retirada: ${result.error}`);
      }
    } else if (newStatus === "servico_concluido") {
      const message = generateCompletionMessage(name, orderNumber, config);
      const result = await sendWhatsAppMessage(phone, message);
      if (result.success) {
        console.log(`[CRMGráfica] Notificação de conclusão + avaliação enviada para ${phone}`);
      } else {
        console.error(`[CRMGráfica] Falha ao enviar notificação de conclusão: ${result.error}`);
      }
    }
  } catch (error) {
    console.error("[CRMGráfica] Erro no handler de status:", error);
  }
}
