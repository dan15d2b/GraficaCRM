"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowsClockwise, ChartLineUp, ClipboardText, ImageSquare, Kanban, Storefront } from "@/lib/ui/icons";

interface Lead {
  id: string;
  title: string;
  status: string;
  value_cents: number | null;
  currency: string | null;
  pipeline_id: string | null;
  arte_status: string;
  arte_versao: string;
  producao_status: string;
  producao_prioridade: string;
  producao_sla_dias: number | null;
  producao_data_prevista: string | null;
  created_at: string;
  contact_id: string | null;
}

type ArteStatus = "aprovado" | "ajuste_solicitado";

// Row crua vindas do GET /api/v1/leads — campos de arte/produção podem vir
// null no banco, e a tela aplica o default (pendente/na_fila) no map.
interface LeadApi {
  id: string;
  title: string | null;
  status: string | null;
  value_cents: number | null;
  currency: string | null;
  pipeline_id: string | null;
  arte_status: string | null;
  arte_versao: string | null;
  producao_status: string | null;
  producao_prioridade: string | null;
  producao_sla_dias: number | null;
  producao_data_prevista: string | null;
  created_at: string;
  contact_id: string | null;
}

export function GraficaClient({
  orgId: _orgId,
  orgName,
  nicho,
}: {
  orgId: string;
  orgName: string;
  nicho: string;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [arteDialogOpen, setArteDialogOpen] = useState(false);
  const [arteLeadId, setArteLeadId] = useState<string | null>(null);
  const [arteStatus, setArteStatus] = useState<ArteStatus>("aprovado");
  const [arteVersao, setArteVersao] = useState("");
  const [arteObservacoes, setArteObservacoes] = useState("");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      // A org vem do cookie de sessão no servidor (fonte confiável) —
      // nunca da query. Mandar organization_id no GET seria furo.
      const res = await fetch(`/api/v1/leads?limit=100`);
      const json = await res.json();
      // A tela da gráfica é a fila de produção: o operador quer ver TODOS os
      // negócios, inclusive os ainda sem funil. Filtrar por pipeline_id aqui
      // escondia lead órfão e parecia "tela vazia" sem erro nenhum.
      const data = Array.isArray(json.data) ? json.data : [];
      setLeads(
        data.map((l: LeadApi) => ({
            id: l.id,
            title: l.title ?? "Sem título",
            status: l.status ?? "novo",
            value_cents: l.value_cents,
            currency: l.currency,
            pipeline_id: l.pipeline_id,
            arte_status: l.arte_status || "pendente",
            arte_versao: l.arte_versao || "V1",
            producao_status: l.producao_status || "na_fila",
            producao_prioridade: l.producao_prioridade || "normal",
            producao_sla_dias: l.producao_sla_dias,
            producao_data_prevista: l.producao_data_prevista,
            created_at: l.created_at,
            contact_id: l.contact_id,
          })),
      );
    } catch {
      // ignora erro de carregamento
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Busca inicial na abertura da tela — setLoading(true) síncrono é o
    // padrão de todo _client.tsx do repo (estado de carregamento honesto).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLeads();
  }, [loadLeads]);

  async function aprovarArte(payload: {
    leadId: string;
    status: ArteStatus;
    versao?: string;
    observacoes?: string;
  }) {
    const res = await fetch(`/api/v1/leads/${payload.leadId}/aprovar-arte`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: payload.status,
        versao: payload.versao || undefined,
        observacoes: payload.observacoes || undefined,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      alert(j?.error?.message || "Não foi possível atualizar a arte.");
      return;
    }
    setArteDialogOpen(false);
    setArteLeadId(null);
    setArteStatus("aprovado");
    setArteVersao("");
    setArteObservacoes("");
    void loadLeads();
  }

  function statusArteLabel(s: string) {
    switch (s) {
      case "pendente": return "Pendente";
      case "aprovado": return "Aprovado";
      case "ajuste_solicitado": return "Ajuste solicitado";
      default: return s;
    }
  }

  function statusArteColor(s: string) {
    switch (s) {
      case "pendente": return "default";
      case "aprovado": return "success";
      case "ajuste_solicitado": return "warning";
      default: return "destructive";
    }
  }

  function statusProducaoLabel(s: string) {
    switch (s) {
      case "na_fila": return "Na fila";
      case "em_producao": return "Em produção";
      case "concluido": return "Concluído";
      case "entregue": return "Entregue";
      default: return s;
    }
  }

  function prioridadeLabel(s: string) {
    switch (s) {
      case "baixa": return "Baixa";
      case "normal": return "Normal";
      case "alta": return "Alta";
      case "urgente": return "Urgente";
      default: return s;
    }
  }

  const abrirArteDialog = (leadId: string) => {
    setArteLeadId(leadId);
    setArteDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {nicho === "comunicacao_visual"
              ? "Comunicação Visual"
              : nicho === "grafica"
              ? "Gráfica"
              : "Gráfica & Comunicação Visual"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Pedidos de {orgName} — briefing, orçamento, arte e produção
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/app/pipelines">
              <ClipboardText className="mr-2 size-4" /> Funis
            </Link>
          </Button>
          <Button onClick={() => void loadLeads()} size="sm" variant="outline">
            <ArrowsClockwise className="mr-2 size-4" /> Atualizar
          </Button>
        </div>
      </header>

      {/* Resumo rápido */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total de pedidos</p>
              <p className="text-2xl font-bold">{leads.length}</p>
            </div>
            <Storefront className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Aguardando arte</p>
              <p className="text-2xl font-bold text-warning-fg">
                {leads.filter((l) => l.arte_status === "pendente").length}
              </p>
            </div>
            <ImageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Em produção</p>
              <p className="text-2xl font-bold text-primary">
                {leads.filter((l) => l.producao_status === "em_producao").length}
              </p>
            </div>
            <Kanban className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Entregues</p>
              <p className="text-2xl font-bold text-success">
                {leads.filter((l) => l.producao_status === "entregue").length}
              </p>
            </div>
            <ChartLineUp className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Tabela de pedidos */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Arte</TableHead>
              <TableHead>Produção</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                  Carregando pedidos…
                </TableCell>
              </TableRow>
            )}
            {!loading && leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">
                  {lead.title}
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    Contato #{lead.contact_id?.slice(0, 8) ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  {lead.value_cents != null
                    ? `R$ ${(lead.value_cents / 100).toFixed(2)}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={statusArteColor(lead.arte_status)}>
                    {statusArteLabel(lead.arte_status)} — v{lead.arte_versao}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {statusProducaoLabel(lead.producao_status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{prioridadeLabel(lead.producao_prioridade)}</Badge>
                </TableCell>
                <TableCell>
                  {lead.producao_data_prevista
                    ? new Date(lead.producao_data_prevista).toLocaleDateString("pt-BR")
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => abrirArteDialog(lead.id)}
                    className="h-8 px-2"
                  >
                    {lead.arte_status === "pendente" ? "Avaliar arte" : "Ver arte"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog de aprovação de arte */}
      <Dialog open={arteDialogOpen} onOpenChange={setArteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovação de arte</DialogTitle>
            <DialogDescription>
              Pedido #{arteLeadId?.slice(0, 8) ?? ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={arteStatus} onValueChange={(v: ArteStatus) => setArteStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="ajuste_solicitado">Ajuste solicitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Versão</label>
              <Input
                value={arteVersao}
                onChange={(e) => setArteVersao(e.target.value)}
                placeholder="V1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações (opcional)</label>
              <Input
                value={arteObservacoes}
                onChange={(e) => setArteObservacoes(e.target.value)}
                placeholder="Ex: mudar a cor do logo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                void aprovarArte({
                  leadId: arteLeadId!,
                  status: arteStatus,
                  versao: arteVersao,
                  observacoes: arteObservacoes,
                });
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
