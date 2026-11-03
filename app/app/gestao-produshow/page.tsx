import type { Metadata } from "next";
import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import GestaoProducaoClient from "./_components/GestaoProducaoClient";

export const metadata: Metadata = {
  title: "Gestão de Produção",
};

export default async function GestaoProducaoPage() {
  const user = await requireAuth();
  const activeOrg = await resolveActiveOrg(user);
  if (!activeOrg) redirect("/app");

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestão de Produção</h1>
          <p className="text-sm text-muted-foreground">
            visão geral do negócio da gráfica
          </p>
        </div>
      </header>
      <GestaoProducaoClient />
    </div>
  );
}