"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Target, Clock, Star } from "lucide-react";

export default function MetricsPage() {
  const m = { pedidos: { total: 156, emProducao: 12, prontos: 5, entregues: 139 }, financeiros: { faturamento: 47850, mediaPedido: 306.86 }, atendimento: { conversasHoje: 23, taxaIA: 78, nps: 7.2 }, producao: { eficiencia: 92, prazo: 95 } };
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Métricas & Análises</h1>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Total Pedidos</p><p className="text-3xl font-bold">{m.pedidos.total}</p></div><div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><Activity className="w-6 h-6 text-blue-600" /></div></div><p className="mt-2 text-sm text-green-500 flex items-center gap-1"><TrendingUp className="w-4 h-4" />+8.5%</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Faturamento</p><p className="text-2xl font-bold text-blue-600">R$ {(m.financeiros.faturamento/1000).toFixed(1)}k</p></div><div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Conversas Hoje</p><p className="text-3xl font-bold">{m.atendimento.conversasHoje}</p></div><div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center"><Star className="w-6 h-6 text-purple-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Eficiência</p><p className="text-3xl font-bold text-green-600">{m.producao.eficiencia}%</p></div><div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center"><Target className="w-6 h-6 text-emerald-600" /></div></div></CardContent></Card>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle>Em Produção</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold text-blue-600">{m.pedidos.emProducao}</p><p className="text-sm text-slate-500 mt-1">Pedidos em andamento</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Prontos</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold text-green-600">{m.pedidos.prontos}</p><p className="text-sm text-slate-500 mt-1">Aguardando retirada</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Entregues</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">{m.pedidos.entregues}</p><p className="text-sm text-slate-500 mt-1">Este mês</p></CardContent></Card>
      </div>
    </div>
  );
}
