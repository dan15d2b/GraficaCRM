/**
 * CRMGráfica 2.0 — Dashboard de Produção
 * 
 * Métricas em tempo real: ordens hoje, atrasadas, SLA médio, throughput
 */
"use client";

import { useState, useEffect } from "react";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Truck, 
  TrendingUp,
  Calendar,
  Filter
} from "lucide-react";

interface MetricCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; positive: boolean };
}

interface OrderStat {
  status: string;
  label: string;
  count: number;
  color: string;
}

export default function ProducaoDashboardPage() {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [statusDist, setStatusDist] = useState<OrderStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"today" | "week" | "month">("today");

  useEffect(() => {
    // Simular carga de dados (em produção, buscaria da API)
    setTimeout(() => {
      setMetrics([
        {
          title: "Ordens Hoje",
          value: 12,
          subtitle: "3 aguardando retirada",
          icon: <Calendar className="w-6 h-6" />,
          color: "bg-blue-500",
          trend: { value: 8, positive: true },
        },
        {
          title: "Atrasadas",
          value: 2,
          subtitle: "SLA ultrapassado",
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          color: "bg-red-500",
          trend: { value: -2, positive: false },
        },
        {
          title: "SLA Médio",
          value: "4.2h",
          subtitle: "Dias úteis",
          icon: <Clock className="w-6 h-6" />,
          color: "bg-emerald-500",
          trend: { value: 0.3, positive: true },
        },
        {
          title: "Entregues",
          value: 47,
          subtitle: "Últimos 7 dias",
          icon: <Truck className="w-6 h-6" />,
          color: "bg-purple-500",
          trend: { value: 12, positive: true },
        },
      ]);

      setStatusDist([
        { status: "prospect", label: "Orçamento", count: 8, color: "bg-slate-400" },
        { status: "qualificacao", label: "Qualificação", count: 5, color: "bg-blue-400" },
        { status: "triagem", label: "Triagem", count: 3, color: "bg-yellow-400" },
        { status: "impressao", label: "Impressão", count: 7, color: "bg-blue-500" },
        { status: "acabamento", label: "Acabamento", count: 4, color: "bg-amber-500" },
        { status: "qualidade", label: "Controle Qualidade", count: 2, color: "bg-purple-500" },
        { status: "pronto_retirada", label: "Pronto Retirada", count: 3, color: "bg-emerald-500" },
        { status: "entregue", label: "Entregue", count: 47, color: "bg-green-600" },
      ]);
      setLoading(false);
    }, 500);
  }, [filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard de Produção</h1>
          <p className="text-sm text-gray-500 mt-1">Visão geral do fluxo de produção</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
          </select>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-lg ${metric.color} bg-opacity-10`}>
                {metric.icon}
              </div>
              {metric.trend && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  metric.trend.positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {metric.trend.positive ? "↑" : "↓"} {Math.abs(metric.trend.value)}%
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{metric.title}</p>
              <p className="text-xs text-gray-500">{metric.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Distribuição por Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ordens por Etapa</h2>
        <div className="space-y-3">
          {statusDist.map((stat) => (
            <div key={stat.status} className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-32">{stat.label}</span>
              <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${stat.color} rounded-lg transition-all duration-500`}
                  style={{ width: `${(stat.count / 47) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 w-8 text-right">{stat.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas de SLA */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alertas de Prazo</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Pedido #2847 atrasado</p>
              <p className="text-xs text-red-700">Prazo:Ontem às 18h — Cliente: João Silva</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-red-200 text-red-800 rounded">+4h</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">Pedido #2851 próximo do prazo</p>
              <p className="text-xs text-yellow-700">Prazo:Hoje às 17h — Cliente: Maria Santos</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-yellow-200 text-yellow-800 rounded">2h</span>
          </div>
        </div>
      </div>

      {/* Throughput Semanal */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Throughput Semanal</h2>
        <div className="flex items-end justify-between h-40 gap-2">
          {[65, 78, 52, 90, 85, 45, 70].map((value, idx) => {
            const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                  style={{ height: `${value * 1.6}px` }}
                />
                <span className="text-xs text-gray-600">{days[idx]}</span>
                <span className="text-xs font-medium text-gray-900">{value}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>Total semana: 485 ordens</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            +12% vs semana anterior
          </span>
        </div>
      </div>
    </div>
  );
}
