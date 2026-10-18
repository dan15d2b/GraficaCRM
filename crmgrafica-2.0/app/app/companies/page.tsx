"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Building2 } from "lucide-react";

interface Empresa { id: string; nome: string; cnpj: string; telefone: string; email: string; contato: string; }

export default function CompaniesPage() {
  const [empresas] = useState<Empresa[]>([
    { id: "1", nome: "Tech Solutions Ltda", cnpj: "12.345.678/0001-99", telefone: "(11) 3333-4444", email: "contato@tech.com", contato: "Carlos" },
    { id: "2", nome: "Marketing Express", cnpj: "98.765.432/0001-00", telefone: "(11) 2222-3333", email: "exp@marketing.com", contato: "Ana" },
  ]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Empresas</h1><p className="text-slate-500 mt-1">Cadastro B2B de clientes</p></div>
        <Button className="bg-blue-600">+ Nova Empresa</Button>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Buscar empresas..." className="pl-9" /></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="pb-2">Empresa</th><th className="pb-2">CNPJ</th><th className="pb-2">Telefone</th><th className="pb-2">E-mail</th><th className="pb-2"></th></tr></thead>
            <tbody>
              {empresas.map(e => (
                <tr key={e.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 font-medium flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" />{e.nome}</td>
                  <td className="py-3 text-slate-500">{e.cnpj}</td>
                  <td className="py-3 text-slate-500">{e.telefone}</td>
                  <td className="py-3 text-slate-500">{e.email}</td>
                  <td className="py-3"><Button variant="ghost" size="sm">Ver</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
