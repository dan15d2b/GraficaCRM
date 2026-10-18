"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Play, Pause, Trash2, Plus } from "lucide-react";

interface Campanha { id: string; nome: string; status: "ativa" | "pausada" | "finalizada"; mensagens: number; cliques: number; }

const campanhas: Campanha[] = [
  { id: "1", nome: "Promoção Black Friday", status: "ativa", mensagens: 1250, cliques: 340 },
  { id: "2", nome: "Lembrete de pagamento", status: "pausada", mensagens: 500, cliques: 120 },
  { id: "3", nome: "Nova coleção", status: "finalizada", mensagens: 2000, cliques: 580 },
];

export default function CampaignsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Campanhas</h1><p className="text-slate-500 mt-1">Disparos em massa via WhatsApp</p></div>
        <Button className="bg-blue-600"><Plus className="w-4 h-4 mr-2" /> Nova Campanha</Button>
      </div>
      <div className="grid gap-4">
        {campanhas.map(c => (
          <Card key={c.id}><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center"><Megaphone className="w-6 h-6 text-blue-600" /></div>
                <div><p className="font-medium text-lg">{c.nome}</p><div className="flex gap-4 mt-1 text-sm text-slate-500"><span>{c.mensagens} mensagens</span><span>{c.cliques} cliques</span></div></div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.status === "ativa" ? "bg-green-100 text-green-700" : c.status === "pausada" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>{c.status}</span>
                <Button variant="ghost" size="sm"><Play className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm"><Pause className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
