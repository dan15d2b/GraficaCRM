"use client";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Activity, Target, Clock, Star, Users, FileText, Printer, CheckCircle, Inbox, Bot, BarChart3, Settings, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    { label: "Em Produção", value: "12", change: "+2", icon: Printer, color: "blue" },
    { label: "Prontos", value: "5", change: "+1", icon: CheckCircle, color: "green" },
    { label: "Orçamentos", value: "8", change: "-1", icon: FileText, color: "amber" },
    { label: "Conversas", value: "3", change: "+2", icon: Inbox, color: "purple" },
  ];

  const recentOrders = [
    { id: "PED-1234", cliente: "João Silva", produto: "Banner 3x2m", valor: "R$ 450,00", status: "impressao", time: "há 2h" },
    { id: "PED-1235", cliente: "Maria Santos", produto: "Adesivo Fachada", valor: "R$ 890,00", status: "acabamento", time: "há 1h" },
    { id: "PED-1236", cliente: "Pedro Costa", produto: "Cartões 1000un", valor: "R$ 250,00", status: "pronto", time: "há 30min" },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case "impressao": return "bg-blue-100 text-blue-700";
      case "pronto": return "bg-green-100 text-green-700";
      case "acabamento": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const statusLabel = (status: string) => {
    switch(status) {
      case "impressao": return "Em Impressão";
      case "pronto": return "Pronto";
      case "acabamento": return "Acabamento";
      default: return status;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 ${mounted ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{today}</span>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors">
              <TrendingUp className="w-4 h-4" />
              Novo Pedido
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            const colors = {
              blue: "border-blue-200 bg-blue-50",
              green: "border-green-200 bg-green-50",
              amber: "border-amber-200 bg-amber-50",
              purple: "border-purple-200 bg-purple-50",
            };
            const iconColors = {
              blue: "text-blue-600",
              green: "text-green-600",
              amber: "text-amber-600",
              purple: "text-purple-600",
            };
            
            return (
              <div key={i} className={`border rounded-xl p-5 ${colors[stat.color as keyof typeof colors]}`}>
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-6 h-6 ${iconColors[stat.color as keyof typeof iconColors]}`} />
                  <span className={`text-xs font-medium ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Production Board */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Quadro de Produção — Hoje</h2>
                <p className="text-sm text-slate-500 mt-1">Acompanhe os pedidos em andamento</p>
              </div>
              <Link href="/app/producao/kanban" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Ver todos →
              </Link>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              {["Chegada", "Impressão", "Acabamento", "Pronto"].map((stage, i) => (
                <div key={stage} className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-2xl font-bold text-slate-900 mb-1">{["3", "7", "5", "5"][i]}</p>
                  <p className="text-xs text-slate-500">{stage}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-500 mb-3">Pedidos em destaque</p>
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {order.cliente.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{order.cliente}</p>
                      <p className="text-sm text-slate-500">{order.produto}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{order.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts & Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Alertas</h3>
              <div className="space-y-3">
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">Prazo vencido</span>
                  </div>
                  <p className="text-xs text-red-600">2 pedidos com prazo hoje</p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">Arquivo pendente</span>
                  </div>
                  <p className="text-xs text-amber-600">3 pedidos aguardam arquivo</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Manutenção programada</span>
                  </div>
                  <p className="text-xs text-blue-600">Servidor às 2h da manhã</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <p className="text-blue-100 text-sm mb-1">Faturamento do mês</p>
              <p className="text-3xl font-bold mb-2">R$ 47.850</p>
              <div className="flex items-center gap-1 text-blue-100 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+12% vs mês anterior</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
