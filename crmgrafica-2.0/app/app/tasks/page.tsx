"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Plus, Trash2, AlertCircle } from "lucide-react";

interface Tarefa { id: string; titulo: string; responsavel: string; prioridade: "low" | "medium" | "high" | "urgent"; status: "pending" | "completed"; dueDate: string; }

export default function TasksPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([
    { id: "1", titulo: "Aprovar arte banner", responsavel: "João", prioridade: "high", status: "pending", dueDate: "2024-01-20" },
    { id: "2", titulo: "Confirmar entrega", responsavel: "Maria", prioridade: "medium", status: "pending", dueDate: "2024-01-20" },
  ]);
  const colors = { low: "bg-slate-100 text-slate-600", medium: "bg-blue-100 text-blue-600", high: "bg-amber-100 text-amber-600", urgent: "bg-red-100 text-red-600" };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Tarefas</h1><p className="text-slate-500 mt-1">Pendências da equipe</p></div>
        <Button className="bg-blue-600"><Plus className="w-4 h-4 mr-2" /> Nova Tarefa</Button>
      </div>
      <div className="space-y-3">
        {tarefas.map(t => (
          <Card key={t.id} className={t.status === "completed" ? "opacity-60" : ""}>
            <CardContent className="p-4 flex items-center gap-4">
              <button><Circle className="w-6 h-6 text-slate-300" /></button>
              <div className="flex-1"><p className="font-medium">{t.titulo}</p><div className="flex items-center gap-4 mt-1 text-sm text-slate-500"><span>{t.responsavel}</span><span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />{t.dueDate}</span></div></div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[t.prioridade]}`}>{t.prioridade}</span>
              <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
