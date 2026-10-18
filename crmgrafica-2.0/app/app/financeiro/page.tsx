"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Wallet, Plus } from "lucide-react";

interface Lancamento { id: string; tipo: "entrada" | "saida"; descricao: string; valor: number; data: string; categoria: string; }

export default function FinanceiroPage() {
  const [lancamentos] = useState<Lancamento[]>([
    { id: "1", tipo: "entrada", descricao: "Pagamento pedido #1234", valor: 450, data: "2024-01-20", categoria: "vendas" },
    { id: "2", tipo: "entrada", descricao: "Pagamento pedido #1235", valor: 890, data: "2024-01-19", categoria: "vendas" },
    { id: "3", tipo: "saida", descricao: "Compra de insumos", valor: 1200, data: "2024-01-18", categoria: "insumos" },
    { id: "4", tipo: "saida", descricao: "Conta de luz", valor: 350, data: "2024-01-17", categoria: "infra" },
  ]);

  const entradas = lancamentos.filter((l: Lancamento) => l.tipo === "entrada").reduce((s: number, l: Lancamento) => s + l.valor, 0);
  const saidas = lancamentos.filter((l: Lancamento) => l.tipo === "saida").reduce((s: number, l: Lancamento) => s + l.valor, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Financeiro</h1><p className="text-slate-500 mt-1">Fluxo de caixa</p></div>
        <Button className="bg-blue-600"><Plus className="w-4 h-4 mr-2" /> Novo Lançamento</Button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-green-600" /></div><div><p className="text-sm text-slate-500">Entradas</p><p className="text-2xl font-bold text-green-600">R$ {entradas}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><TrendingDown className="w-6 h-6 text-red-600" /></div><div><p className="text-sm text-slate-500">Saídas</p><p className="text-2xl font-bold text-red-600">R$ {saidas}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><Wallet className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-slate-500">Saldo</p><p className="text-2xl font-bold text-blue-600">R$ {entradas - saidas}</p></div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Lançamentos</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="pb-2">Data</th><th className="pb-2">Descrição</th><th className="pb-2">Categoria</th><th className="pb-2 text-right">Valor</th><th className="pb-2 text-center">Tipo</th></tr></thead>
            <tbody>
              {lancamentos.map((l: Lancamento) => (
                <tr key={l.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 text-slate-500">{l.data}</td>
                  <td className="py-3 font-medium">{l.descricao}</td>
                  <td className="py-3 text-slate-500">{l.categoria}</td>
                  <td className={`py-3 text-right font-bold ${l.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>{l.tipo === "entrada" ? "+" : "-"} R$ {l.valor}</td>
                  <td className="py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${l.tipo === "entrada" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{l.tipo}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
