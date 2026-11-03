"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Download,
  Funnel,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Bell,
  Settings,
  Home,
  BarChart3,
  ShoppingCart,
  Users as UsersIcon,
  Box,
  Megaphone,
  Mail,
  Link as LinkIcon,
} from "lucide-react";

const DADOS_FATURAMENTO = [
  { data: "01", faturamento: 12500 },
  { data: "03", faturamento: 15200 },
  { data: "05", faturamento: 18700 },
  { data: "07", faturamento: 21000 },
  { data: "09", faturamento: 13200 },
  { data: "11", faturamento: 14500 },
  { data: "13", faturamento: 17200 },
  { data: "15", faturamento: 19800 },
  { data: "17", faturamento: 16500 },
  { data: "19", faturamento: 18000 },
  { data: "21", faturamento: 22000 },
  { data: "23", faturamento: 19500 },
  { data: "25", faturamento: 21500 },
  { data: "27", faturamento: 18500 },
  { data: "29", faturamento: 20000 },
  { data: "31", faturamento: 22500 },
];

const DADOS_ORDENS = [
  { nome: "Entregues", valor: 824, cor: "#6366f1" },
  { nome: "Em Produção", valor: 225, cor: "#8b5cf6" },
  { nome: "Aguardando", valor: 97, cor: "#ec4899" },
  { nome: "Cancelados", valor: 58, cor: "#f59e0b" },
];

const DADOS_FUNIL = [
  { nome: "Visitantes", valor: 12480, cor: "#6366f1", percentual: "100%" },
  { nome: "Veio Produtos", valor: 3920, cor: "#818cf8", percentual: "31.4%" },
  { nome: "Adicionou", valor: 1204, cor: "#a5b4fc", percentual: "9.6%" },
  { nome: "Comprou", valor: 482, cor: "#c7d2fe", percentual: "3.9%" },
];

const DADOS_TRASCOSO = [
  { fonte: "Orgânico", valor: 38.4, cor: "#6366f1", icon: Search },
  { fonte: "Direto", valor: 22.1, cor: "#8b5cf6", icon: LinkIcon },
  { fonte: "Social Media", valor: 18.7, cor: "#ec4899", icon: Megaphone },
  { fonte: "Paid Ads", valor: 12.6, cor: "#f59e0b", icon: Bell },
  { fonte: "Email", valor: 6.2, cor: "#10b981", icon: Mail },
  { fonte: "Referências", valor: 4.0, cor: "#64748b", icon: LinkIcon },
];

const PRODUTOS_VENDAS = [
  { id: 1, nome: "Banner Lona 2x1m", vendas: 342, receita: 20580, img: "🖼️" },
  { id: 2, nome: "Adesivo Vinil", vendas: 281, receita: 14050, img: "🏷️" },
  { id: 3, nome: "Cartão de Visita", vendas: 219, receita: 13140, img: "🪪" },
  { id: 4, nome: "Faixa Pavimenteira", vendas: 187, receita: 9350, img: "🎗️" },
  { id: 5, nome: "Placa ACM", vendas: 156, receita: 7800, img: "📋" },
];

const PEDIDOS_RECENTES = [
  { id: 1024, cliente: "Emily Carter", produto: "Banner Lona 2x1m", valor: 129.00, status: "Entregue" },
  { id: 1023, cliente: "Daniel Kim", produto: "Adesivo Vinil", valor: 89.00, status: "Em Produção" },
  { id: 1022, cliente: "Sophia Lee", produto: "Cartão de Visita", valor: 199.00, status: "Entregue" },
  { id: 1021, cliente: "James Wilson", produto: "Faixa Pavimenteira", valor: 45.00, status: "Aguardando" },
  { id: 1020, cliente: "Olivia Brown", produto: "Placa ACM", valor: 25.00, status: "Em Produção" },
];

const KPI_DATA = {
  faturamento: 48230,
  servicos: 1204,
  clientesNovos: 892,
  ticketMedio: 40.08,
};

const KPI_ANTERIOR = {
  faturamento: 38500,
  servicos: 1100,
  clientesNovos: 750,
  ticketMedio: 35.00,
};

function calcularVariacao(atual: number, anterior: number): number {
  if (anterior === 0) return 0;
  return ((atual - anterior) / anterior) * 100;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function CardKPI({ titulo, valor, variacao, icon: Icon, cor = "blue" }: {
  titulo: string;
  valor: string | number;
  variacao: number;
  icon: any;
  cor?: string;
}) {
  const isPositive = variacao >= 0;
  const gradientes: Record<string, string> = {
    blue: "from-blue-500 to-indigo-600",
    purple: "from-purple-500 to-pink-600",
    green: "from-emerald-500 to-teal-600",
    orange: "from-orange-500 to-red-600",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 p-6 shadow-lg">
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${gradientes[cor]} opacity-10`} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <p className="text-3xl font-bold text-slate-900">{valor}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradientes[cor]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1">
        <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
          <ArrowUpRight className={`h-4 w-4 ${!isPositive && "rotate-180"}`} />
          {isPositive ? "+" : ""}{variacao.toFixed(1)}%
        </span>
        <span className="text-sm text-slate-500">vs mês anterior</span>
      </div>
    </div>
  );
}

export default function GestaoProducaoClient() {
  const [periodo, setPeriodo] = useState("30d");

  const variacoes = {
    faturamento: calcularVariacao(KPI_DATA.faturamento, KPI_ANTERIOR.faturamento),
    servicos: calcularVariacao(KPI_DATA.servicos, KPI_ANTERIOR.servicos),
    clientesNovos: calcularVariacao(KPI_DATA.clientesNovos, KPI_ANTERIOR.clientesNovos),
    ticketMedio: calcularVariacao(KPI_DATA.ticketMedio, KPI_ANTERIOR.ticketMedio),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-white/50 p-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <img src="/logo-icon.svg" alt="GraficaCRM" className="h-7 w-7 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">GraficaCRM</h1>
            <p className="text-xs text-slate-500">Gestão de Produção</p>
          </div>
        </div>

        <nav className="space-y-2">
          {[
            { icon: Home, label: "Dashboard", active: true },
            { icon: ShoppingCart, label: "Pedidos", count: 24 },
            { icon: Box, label: "Produtos" },
            { icon: UsersIcon, label: "Clientes" },
            { icon: BarChart3, label: "Analytics" },
            { icon: Megaphone, label: "Marketing" },
            { icon: Settings, label: "Configurações" },
          ].map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                item.active
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                  : "text-slate-600 hover:bg-white/50"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white">
            <p className="text-sm font-semibold">Upgrade Pro</p>
            <p className="mt-1 text-xs opacity-80">Desbloqueie analytics avançados</p>
            <button className="mt-3 w-full rounded-lg bg-white/20 py-2 text-sm font-medium hover:bg-white/30">
              Atualizar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Bem-vindo de volta, João 👋</p>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Veja o que está acontecendo na sua gráfica hoje.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar produtos, pedidos..."
                className="w-64 rounded-xl border border-white/50 bg-white/70 backdrop-blur-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <button className="relative rounded-xl border border-white/50 bg-white/70 backdrop-blur-xl p-2.5 hover:bg-white">
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">3</span>
            </button>
            <div className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/70 backdrop-blur-xl px-4 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                JD
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">John Doe</p>
                <p className="text-xs text-slate-500">Store Owner</p>
              </div>
            </div>
          </div>
        </header>

        {/* KPIs */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <CardKPI titulo="Faturamento Total" valor={formatarMoeda(KPI_DATA.faturamento)} variacao={variacoes.faturamento} icon={Wallet} cor="blue" />
          <CardKPI titulo="Total de Pedidos" valor={KPI_DATA.servicos.toLocaleString()} variacao={variacoes.servicos} icon={ShoppingCart} cor="purple" />
          <CardKPI titulo="Novos Clientes" valor={KPI_DATA.clientesNovos.toLocaleString()} variacao={variacoes.clientesNovos} icon={Users} cor="green" />
          <CardKPI titulo="Ticket Médio" valor={formatarMoeda(KPI_DATA.ticketMedio)} variacao={variacoes.ticketMedio} icon={TrendingUp} cor="orange" />
        </div>

        {/* Charts Row 1 */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="col-span-1 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 p-6 shadow-lg lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Visão de Faturamento</h3>
                <p className="text-sm text-slate-500">Faturamento total este mês</p>
              </div>
              <select className="rounded-lg border border-white/50 bg-white/50 px-3 py-1.5 text-sm">
                <option>Mensal</option>
                <option>Semanal</option>
                <option>Domingo</option>
              </select>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-slate-900">{formatarMoeda(KPI_DATA.faturamento)}</span>
              <span className="flex items-center gap-1 text-emerald-600">
                <ArrowUpRight className="h-4 w-4" />
                {variacoes.faturamento.toFixed(1)}%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={DADOS_FATURAMENTO}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="data" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                        <p className="text-sm font-medium text-slate-900">Mar {payload[0].payload.data}</p>
                        <p className="text-sm font-semibold text-indigo-600">{formatarMoeda(payload[0].value)}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Area type="monotone" dataKey="faturamento" stroke="#6366f1" strokeWidth={3} fill="url(#colorFaturamento)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Visão de Pedidos</h3>
                <p className="text-sm text-slate-500">Este mês</p>
              </div>
              <select className="rounded-lg border border-white/50 bg-white/50 px-3 py-1.5 text-sm">
                <option>Este Mês</option>
              </select>
            </div>
            <div className="flex items-center justify-center mb-4">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={DADOS_ORDENS} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="valor">
                    {DADOS_ORDENS.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.cor} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-slate-900">{KPI_DATA.servicos.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Pedidos</p>
            </div>
            <div className="space-y-3">
              {DADOS_ORDENS.map((item) => (
                <div key={item.nome} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.cor }} />
                    <span className="text-sm text-slate-600">{item.nome}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{item.valor}</p>
                    <p className="text-xs text-slate-500">{((item.valor / KPI_DATA.servicos) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Fontes de Tráfego</h3>
              <select className="rounded-lg border border-white/50 bg-white/50 px-3 py-1.5 text-sm"><option>Este Mês</option></select>
            </div>
            <div className="space-y-4">
              {DADOS_TRASCOSO.map((item) => (
                <div key={item.fonte} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.cor}20` }}>
                    <item.icon className="h-5 w-5" style={{ color: item.cor }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{item.fonte}</span>
                      <span className="text-sm font-semibold text-slate-900">{item.valor}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${item.valor}%`, backgroundColor: item.cor }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Funnel className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-slate-900">Funil de Conversão</h3>
              </div>
              <select className="rounded-lg border border-white/50 bg-white/50 px-3 py-1.5 text-sm"><option>Este Mês</option></select>
            </div>
            <div className="flex flex-col items-center gap-2">
              {DADOS_FUNIL.map((item, index) => (
                <div key={item.nome} className="w-full rounded-xl p-4 text-center text-white"
                  style={{ backgroundColor: item.cor, width: `${100 - index * 15}%`, alignSelf: index === 0 ? "center" : "flex-end" }}>
                  <p className="text-2xl font-bold">{item.valor.toLocaleString()}</p>
                  <p className="text-sm opacity-80">{item.nome}</p>
                  <p className="text-xs opacity-60 mt-1">{item.percentual}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-slate-900">Produtos Mais Vendidos</h3>
              </div>
              <button className="text-sm text-indigo-600 hover:text-indigo-700">Ver todos</button>
            </div>
            <div className="space-y-4">
              {PRODUTOS_VENDAS.map((produto, index) => (
                <div key={produto.id} className="flex items-center gap-4 rounded-xl bg-white/50 p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">{index + 1}</span>
                  <span className="text-2xl">{produto.img}</span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{produto.nome}</p>
                    <p className="text-sm text-slate-500">{produto.vendas} vendidos</p>
                  </div>
                  <p className="font-semibold text-slate-900">{formatarMoeda(produto.receita)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-slate-900">Pedidos Recentes</h3>
              </div>
              <button className="text-sm text-indigo-600 hover:text-indigo-700">Ver todos</button>
            </div>
            <div className="space-y-4">
              {PEDIDOS_RECENTES.map((pedido) => (
                <div key={pedido.id} className="flex items-center gap-4 rounded-xl bg-white/50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg">
                    {pedido.produto.includes("Banner") ? "🖼️" : pedido.produto.includes("Adesivo") ? "🏷️" : pedido.produto.includes("Cartão") ? "🪪" : pedido.produto.includes("Faixa") ? "🎗️" : "📋"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">#{pedido.id}</p>
                    <p className="text-sm text-slate-500">{pedido.cliente}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatarMoeda(pedido.valor)}</p>
                    <p className="text-xs text-slate-500">{pedido.produto}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    pedido.status === "Entregue" ? "bg-emerald-100 text-emerald-700" :
                    pedido.status === "Em Produção" ? "bg-indigo-100 text-indigo-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>{pedido.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
