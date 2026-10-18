"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Shield, Bell, Key, Palette, Building2, Tag, Bot, FileText, Calendar, Wallet } from "lucide-react";
import Link from "next/link";

const groups = [
  { title: "Perfil", icon: User, items: [{ href: "/app/settings/profile", label: "Dados pessoais" }, { href: "/app/settings/security", label: "Segurança" }] },
  { title: "Empresa", icon: Building2, items: [{ href: "/app/settings/tenant", label: "Dados da empresa" }, { href: "/app/settings/tags", label: "Tags" }] },
  { title: "Aparência", icon: Palette, items: [{ href: "/app/settings/theme", label: "Tema e cores" }] },
  { title: "Operação", icon: FileText, items: [{ href: "/app/settings/automacoes", label: "Automações" }, { href: "/app/settings/templates", label: "Modelos" }] },
  { title: "Integrações", icon: Bot, items: [{ href: "/app/settings/whatsapp", label: "WhatsApp" }, { href: "/app/settings/api-tokens", label: "API Tokens" }] },
  { title: "Financeiro", icon: Wallet, items: [{ href: "/app/settings/billing", label: "Plano" }] },
];

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Configurações</h1>
      <div className="grid grid-cols-2 gap-6">
        {groups.map(g => (
          <Card key={g.title} className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <g.icon className="w-5 h-5 text-blue-400" />
                {g.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {g.items.map(item => (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-500/10 transition-colors cursor-pointer">
                    <p className="font-medium text-white">{item.label}</p>
                    <span className="text-blue-400">→</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
