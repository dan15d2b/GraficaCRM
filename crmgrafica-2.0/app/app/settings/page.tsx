"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Shield, Bell, Key, Palette, Building2, Bot, FileText, Wallet } from "lucide-react";
import Link from "next/link";

const groups = [
  { title: "Perfil", icon: User, items: [{ href: "/app/configuracoes/users", label: "Usuários" }] },
  { title: "Aparência", icon: Palette, items: [{ href: "/app/configuracoes/theme", label: "Tema e cores" }] },
  { title: "Empresa", icon: Building2, items: [] },
  { title: "Integrações", icon: Bot, items: [] },
  { title: "Financeiro", icon: Wallet, items: [] },
];

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Configurações</h1>
      <div className="grid grid-cols-2 gap-6">
        {groups.map(g => (
          <Card key={g.title} className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <g.icon className="w-5 h-5 text-blue-600" />
                {g.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {g.items.length === 0 ? (
                <p className="text-sm text-slate-500">Em breve</p>
              ) : (
                g.items.map(item => (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                      <span className="text-slate-400">→</span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
