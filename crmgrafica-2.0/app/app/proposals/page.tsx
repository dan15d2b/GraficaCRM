"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Printer, Download, Eye } from "lucide-react";

interface Proposta { id: string; cliente: string; valor: number; status: "rascunho" | "enviada" | "aprovada" | "rejeitada"; data: string; validade: string; }

const propostas: Proposta[] = [
  { id: "1", cliente: "João Silva", valor: 450, status: "enviada", data: "2024-01-20", validade: "2024-02-20" },
  { id: "2", cliente: "Maria Santos", valor: 890, status: "aprovada", data: "2024-01-19", validade: "2024-02-19" },
  { id: "3", cliente: "Pedro Costa", valor: 1250, status: "rascunho", data: "2024-01-18", validade: "2024-02-18" },
];

const statusColors = { rascunho: "bg-slate-100 text-slate-700", enviada: "bg-blue-100 text-blue-700", aprovada: "bg-green-100 text-green-700", rejeitada: "bg-red-100 text-red-700" };

export default function ProposalsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Propostas</h1><p className="text-slate-500 mt-1">Orçamentos e propostas comerciais</p></div>
        <Button className="bg-blue-600"><Plus className="w-4 h-4 mr-2" /> Nova Proposta</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr className="text-left text-slate-500"><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Validade</th><th className="px-4 py-3"></th></tr></thead>
            <tbody>
              {propostas.map(p => (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{p.cliente}</td>
                  <td className="px-4 py-3">R$ {p.valor.toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColors[p.status]}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-slate-500">{p.data}</td>
                  <td className="px-4 py-3 text-slate-500">{p.validade}</td>
                  <td className="px-4 py-3"><div className="flex gap-1"><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button><Button variant="ghost" size="sm"><Printer className="w-4 h-4" /></Button><Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
