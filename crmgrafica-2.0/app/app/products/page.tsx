"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Package } from "lucide-react";

interface Produto { id: string; name: string; category: string; unitPrice: number; unit: string; }

export default function ProductsPage() {
  const [produtos] = useState<Produto[]>([
    { id: "1", name: "Banner Lona 13oz", category: "Banners", unitPrice: 25, unit: "m²" },
    { id: "2", name: "Adesivo Vinil", category: "Adesivos", unitPrice: 35, unit: "m²" },
    { id: "3", name: "Cartão de Visita", category: "Papelaria", unitPrice: 89.90, unit: "bd" },
    { id: "4", name: "Fachada ACM", category: "Fachadas", unitPrice: 450, unit: "m²" },
  ]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const categories = ["Todos", "Banners", "Adesivos", "Papelaria", "Fachadas"];

  const filtered = produtos.filter(p => (category === "Todos" || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Produtos</h1><p className="text-slate-500 mt-1">Catálogo de produtos e serviços</p></div>
        <Button className="bg-blue-600"><Plus className="w-4 h-4 mr-2" /> Novo Produto</Button>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {categories.map(cat => <Button key={cat} variant={category === cat ? "default" : "outline"} size="sm" onClick={() => setCategory(cat)} className={category === cat ? "bg-blue-600" : ""}>{cat}</Button>)}
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Buscar produtos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(p => (
              <Card key={p.id}>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{p.name}</CardTitle></CardHeader>
                <CardContent><p className="text-xs text-slate-500 mb-2">{p.category}</p><div className="flex items-center justify-between"><span className="text-lg font-bold">R$ {p.unitPrice.toFixed(2)}</span><span className="text-xs text-slate-500">/{p.unit}</span></div></CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
