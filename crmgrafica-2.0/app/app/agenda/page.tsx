"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Clock, MapPin } from "lucide-react";

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [events] = useState([
    { id: "1", tipo: "entrega", cliente: "João Silva", endereco: "Rua A, 123", hora: "14:00" },
    { id: "2", tipo: "coleta", cliente: "Maria Santos", endereco: "Rua B, 456", hora: "16:30" },
  ]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Agenda</h1><p className="text-slate-500 mt-1">Entregas, coletas e compromissos</p></div>
        <Button className="bg-blue-600"><Plus className="w-4 h-4 mr-2" /> Novo Agendamento</Button>
      </div>
      <div className="grid grid-cols-4 gap-6">
        <Card><CardHeader><CardTitle>Selecionar Data</CardTitle></CardHeader><CardContent><input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg" /></CardContent></Card>
        <div className="col-span-3 space-y-3">
          {events.map(e => (
            <Card key={e.id}><CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${e.tipo === "entrega" ? "bg-green-100" : "bg-blue-100"}`}>
                {e.tipo === "entrega" ? <MapPin className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-blue-600" />}
              </div>
              <div className="flex-1"><p className="font-medium">{e.cliente}</p><p className="text-sm text-slate-500">{e.endereco}</p></div>
              <div className="text-right"><p className="font-medium">{e.hora}</p><span className={`px-2 py-1 rounded-full text-xs ${e.tipo === "entrega" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{e.tipo}</span></div>
            </CardContent></Card>
          ))}
        </div>
      </div>
    </div>
  );
}
