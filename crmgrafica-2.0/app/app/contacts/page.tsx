"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Phone, Mail } from "lucide-react";

interface Contato { id: string; name: string; email?: string; phone: string; company?: string; }

export default function ContactsPage() {
  const [contacts] = useState<Contato[]>([
    { id: "1", name: "João Silva", email: "joao@email.com", phone: "(11) 99999-1234", company: "Empresa A" },
    { id: "2", name: "Maria Santos", email: "maria@email.com", phone: "(11) 98888-5678" },
  ]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Contatos</h1><p className="text-slate-500 mt-1">Clientes e fornecedores</p></div>
        <Button className="bg-blue-600"><Plus className="w-4 h-4 mr-2" /> Novo Contato</Button>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Buscar..." className="pl-9" /></div>
          <div className="space-y-2">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{c.name[0]}</div>
                <div className="flex-1"><p className="font-medium">{c.name}</p><div className="flex items-center gap-4 text-sm text-slate-500">{c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}{c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}</div></div>
                <Button variant="ghost" size="sm">Ver</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
