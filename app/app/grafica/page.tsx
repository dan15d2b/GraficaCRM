import { redirect } from "next/navigation";
import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { GraficaClient } from "./_client";

export const dynamic = "force-dynamic";

export default async function GraficaPage() {
  const user = await requireAuth();
  const activeOrg = await resolveActiveOrg(user);
  if (!activeOrg) redirect("/app");

  const supabase = await createClient();

  // Busca nicho da organização para mostrar o título certo. A coluna de nome é
  // `display_name` — `organizations` não tem `name`.
  const { data: org } = await supabase
    .from("organizations")
    .select("display_name, settings")
    .eq("id", activeOrg.orgId)
    .maybeSingle();

  const settings = (org?.settings as Record<string, unknown> | null) ?? {};
  const graficaCfg = settings.grafica as
    | { nicho?: string }
    | undefined
    | null;

  const nicho = graficaCfg?.nicho || "grafica_comunicacao_visual";

  return (
    <GraficaClient
      orgId={activeOrg.orgId}
      orgName={org?.display_name || activeOrg.name}
      nicho={nicho}
    />
  );
}
