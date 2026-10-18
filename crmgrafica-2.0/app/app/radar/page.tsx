"use client";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock, TrendingDown } from "lucide-react";

interface Lead { id: string; nome: string; ultimaInteracao: string; diasSemContato: number; valorEstimado: number; }

export default function RadarPage() {
  const leads: Lead[] = [
    { id: "1", nome: "João Silva", ultimaInteracao: "2024-01-15", diasSemContato: 5, valorEstimado: 2500 },
    { id: "2", nome: "Maria Santos", ultimaInteracao: "2024-01-10", diasSemContato: 10, valorEstimado: 4800 },
    { id: "3", nome: "Pedro Costa", ultimaInteracao: "2024-01-08", diasSemContato: 12, valorEstimado: 1200 },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Radar de Oportunidades</h1>
        <p className="text-slate-500 mt-1">Clientes que esfriaram e precisam de atenção</p>
      </div>
      <div className="grid gap-4">
        {leads.map(l => (
          <Card key={l.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center"><AlertCircle className="w-6 h-6 text-amber-600" /></div>
              <div className="flex-1">
                <p className="font-medium text-lg">{l.nome}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{l.diasSemContato} dias</span>
                  <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500" />R$ {l.valorEstimado.toLocaleString()}</span>
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retomar</button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
