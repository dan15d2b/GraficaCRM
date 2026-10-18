"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, MessageSquare, Users, Clock, CheckCircle, XCircle } from "lucide-react";

interface Conversation {
  id: string;
  contactName: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  status: "open" | "closed" | "pending";
  tags: string[];
}

const STATUS_COLORS = {
  open: "bg-green-100 text-green-700",
  closed: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-700",
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  useEffect(() => {
    // Mock data
    setConversations([
      { id: "1", contactName: "João Silva", lastMessage: "Bom dia! Gostaria de um orçamento para banner...", lastMessageAt: "10:30", unread: 2, status: "open", tags: ["novo"] },
      { id: "2", contactName: "Maria Santos", lastMessage: "O pedido já está pronto para retirada?", lastMessageAt: "09:15", unread: 0, status: "open", tags: [] },
      { id: "3", contactName: "Pedro Costa", lastMessage: "Obrigado pela atenção!", lastMessageAt: "Ontem", unread: 0, status: "closed", tags: ["resolvido"] },
      { id: "4", contactName: "Ana Paula", lastMessage: "Preciso de 500 cartões de visita...", lastMessageAt: "Ontem", unread: 1, status: "pending", tags: ["orcamento"] },
    ]);
  }, []);

  const filtered = conversations.filter(c => {
    const matchSearch = c.contactName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  });

  const selectedConversation = conversations.find(c => c.id === selected);

  return (
    <div className="flex h-full">
      {/* Lista de conversas */}
      <div className="w-80 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-slate-900">Inbox</h1>
            <Button size="sm" className="bg-blue-600">
              <Plus className="w-4 h-4 mr-1" /> Novo
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar conversa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            {(["all", "open", "closed"] as const).map(f => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? "bg-blue-600" : ""}
              >
                {f === "all" ? "Todas" : f === "open" ? "Abertas" : "Fechadas"}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelected(conv.id)}
              className={`w-full p-4 border-b border-slate-100 text-left hover:bg-slate-50 transition-colors ${
                selected === conv.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium">
                    {conv.contactName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{conv.contactName}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[150px]">{conv.lastMessage}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs text-slate-400">{conv.lastMessageAt}</p>
                  {conv.unread > 0 && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[conv.status]}`}>
                  {conv.status === "open" ? "Aberta" : conv.status === "closed" ? "Fechada" : "Pendente"}
                </span>
                {conv.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {selectedConversation.contactName[0]}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{selectedConversation.contactName}</p>
                  <p className="text-sm text-slate-500">Online</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <CheckCircle className="w-4 h-4 mr-1" /> Resolver
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <XCircle className="w-4 h-4 mr-1" /> Fechar
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-lg p-3 max-w-[70%]">
                  <p className="text-sm text-slate-900">Bom dia! Gostaria de um orçamento para 10 banners de 3x2m em lona 13oz.</p>
                  <p className="text-xs text-slate-500 mt-1">10:30</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-lg p-3 max-w-[70%]">
                  <p className="text-sm">Olá! Claro, posso te ajudar com isso. Pode me confirmar o prazo de entrega?</p>
                  <p className="text-xs text-blue-200 mt-1">10:32</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2">
                <Input placeholder="Digite sua mensagem..." className="flex-1" />
                <Button className="bg-blue-600">Enviar</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Selecione uma conversa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
