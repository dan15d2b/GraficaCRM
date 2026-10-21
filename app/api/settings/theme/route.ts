/**
 * CRMGráfica 2.0 — API de Salvar Configurações de Tema
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

const themeSchema = z.object({
  accentHex: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, "Cor inválida"),
  buttonStyle: z.enum(["rounded", "square", "pill"]),
  borderRadius: z.number().min(0).max(24),
});

export async function POST(request: Request) {
  const auth = await requireRole("admin", { resource: "settings_theme" });
  if (!auth.ok) return auth.response;
  
  const { org } = auth;
  
  try {
    const body = await request.json();
    const validated = themeSchema.parse(body);
    
    const supabase = await createClient();
    const { error } = await supabase
      .from("organization_settings")
      .update({
        accent_hex: validated.accentHex,
        button_style: validated.buttonStyle,
        border_radius: validated.borderRadius,
      })
      .eq("organization_id", org.orgId);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireRole("admin", { resource: "settings_theme" });
  if (!auth.ok) return auth.response;
  
  const { org } = auth;
  const supabase = await createClient();
  
  const { data } = await supabase
    .from("organization_settings")
    .select("accent_hex, button_style, border_radius")
    .eq("organization_id", org.orgId)
    .single();
  
  return NextResponse.json(data || { accentHex: "#3f586d", buttonStyle: "rounded", borderRadius: 8 });
}
