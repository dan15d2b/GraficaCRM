"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Building2, Mail, Phone } from "lucide-react";

interface Empresa { id: string; nome: string; segmento: string; cidade: string; funcionarios: number; }

export default function ProspectingPage() {
  const empresas: Empresa[] = [
    { id: "1", nome: "Tech Solutions Ltda", segmento: "Tecnologia", cidade: "São Paulo", funcionarios: 50 },
    { id: "2", nome: "Marketing Express", segmento: "Publicidade", cidade: "Rio de Janeiro", funcionarios: 25 },
    { id: "3", nome: "Construtora Norte", segmento: "Construção", cidade: "Manaus", funcionarios: 120 },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Prospecção</h1><p className="text-slate-500 mt-1">Busque novas empresas para abordar</p></div>
        <Button className="bg-blue-600">+ Nova Empresa</Button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input placeholder="Buscar empresa..." className="w-full pl-9 px-4 py-2 border rounded-lg" />
      </div>
      <div className="grid gap-4">
        {empresas.map(e => (
          <Card key={e.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center"><Building2 className="w-6 h-6 text-blue-600" /></div>
              <div className="flex-1">
                <p className="font-medium text-lg">{e.nome}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                  <span>{e.segmento}</span><span>{e.cidade}</span><span>{e.funcionarios} func.</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Mail className="w-4 h-4 mr-1" />Email</Button>
                <Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-1" />Ligar</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
