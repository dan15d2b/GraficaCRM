"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Inbox, Clipboard, Kanban, Printer, Scissors, CheckCircle,
  Users, Wallet, Calendar, BookOpen, Bot, Settings, Key, Palette,
  MessageCircle, LayoutGrid, FileText, Package, Truck, AlertCircle,
  TrendingUp, BarChart3, Building2, ShieldCheck, Flag, Phone,
  RefreshCw, Tag, Bell, ChevronDown, ChevronRight, Maximize2, Minimize2,
  Home, Search
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  group: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home, group: "Principal" },
  { href: "/app/inbox", label: "Conversas", icon: Inbox, group: "Atendimento" },
  { href: "/app/radar", label: "Radar", icon: AlertCircle, group: "Atendimento" },
  { href: "/app/agenda", label: "Agenda", icon: Calendar, group: "Atendimento" },
  { href: "/app/contacts", label: "Contatos", icon: Users, group: "CRM" },
  { href: "/app/companies", label: "Empresas", icon: Building2, group: "CRM" },
  { href: "/app/products", label: "Produtos", icon: Package, group: "CRM" },
  { href: "/app/proposals", label: "Propostas", icon: FileText, group: "CRM" },
  { href: "/app/campaigns", label: "Campanhas", icon: Flag, group: "CRM" },
  { href: "/app/tasks", label: "Tarefas", icon: Clipboard, group: "CRM" },
  { href: "/app/prospecting", label: "Prospecção", icon: Search, group: "CRM" },
  { href: "/app/producao/kanban", label: "Quadro Produção", icon: Printer, group: "Produção" },
  { href: "/app/financeiro", label: "Financeiro", icon: Wallet, group: "Financeiro" },
  { href: "/app/metrics", label: "Métricas", icon: BarChart3, group: "Análise" },
  { href: "/app/ia/agents", label: "Agentes IA", icon: Bot, group: "Inteligência" },
  { href: "/app/settings", label: "Configurações", icon: Settings, group: "Sistema" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  
  const groups = Array.from(new Set(NAV_ITEMS.map(item => item.group)));
  
  return (
    <aside className={`h-screen fixed left-0 top-0 z-50 flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } bg-slate-900 border-r border-slate-800`}>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Printer className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-white text-sm">CRMGráfica</h1>
              <p className="text-xs text-slate-500">v2.0</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="mx-2 mt-2 p-2 rounded hover:bg-slate-800 transition-all"
      >
        {collapsed ? <Maximize2 className="w-4 h-4 text-slate-400" /> : <Minimize2 className="w-4 h-4 text-slate-400" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {groups.map((group) => {
          const items = NAV_ITEMS.filter(item => item.group === group);
          if (items.length === 0) return null;
          
          return (
            <div key={group} className="mb-3">
              {!collapsed && (
                <div className="px-3 mb-1 text-xs font-semibold text-slate-500 uppercase">
                  {group}
                </div>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {!collapsed && <span className="text-xs text-slate-500">Sistema Online</span>}
        </div>
      </div>
    </aside>
  );
}
