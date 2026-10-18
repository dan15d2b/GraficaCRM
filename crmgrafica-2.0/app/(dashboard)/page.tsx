/**
 * CRMGráfica 2.0 — Dashboard principal
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle, Clipboard, MessageSquare, AlertCircle, TrendingUp, Clock, FileText } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 mt-1">Visão geral da gráfica — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-600/20 transition-all">
          + Novo Pedido
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Em Produção" 
          value="12" 
          subtitle="Pedidos em andamento" 
          icon={Printer}
          color="blue"
          trend="+2 hoje"
        />
        <StatCard 
          title="Prontos para Retirada" 
          value="5" 
          subtitle="Aguardando cliente" 
          icon={CheckCircle}
          color="green"
          trend="3 amanhã"
        />
        <StatCard 
          title="Orçamentos Pendentes" 
          value="8" 
          subtitle="Aguardando resposta" 
          icon={Clipboard}
          color="amber"
          trend="2 venceram"
        />
        <StatCard 
          title="Conversas Ativas" 
          value="3" 
          subtitle="No WhatsApp" 
          icon={MessageSquare}
          color="purple"
          trend="2 urgentes"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quadro de Produção */}
        <Card className="lg:col-span-2 shadow-sm border-0 bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Quadro de Produção — Hoje
              </CardTitle>
              <Button variant="outline" className="text-sm">
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: 'Chegada', count: 3, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
                { name: 'Em Impressão', count: 7, color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
                { name: 'Acabamento', count: 5, color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
                { name: 'Pronto', count: 5, color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
              ].map((stage) => (
                <div key={stage.name} className="space-y-2">
                  <div className={`p-4 rounded-xl text-center ${stage.color}`}>
                    <div className="text-2xl font-bold">{stage.count}</div>
                    <div className="text-xs font-medium opacity-75">{stage.name}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Lista de pedidos recentes */}
            <div className="mt-6 space-y-3">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Pedidos em destaque</div>
              {[
                { id: '#1234', client: 'João Silva', product: 'Banner 3x2m', status: 'impressao', time: 'há 2h' },
                { id: '#1235', client: 'Maria Santos', product: 'Adesivo Fachada', status: 'acabamento', time: 'há 1h' },
                { id: '#1236', client: 'Pedro Costa', product: 'Cartões 1000un', status: 'pronto', time: 'há 30min' },
              ].map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      order.status === 'impressao' ? 'bg-blue-500' :
                      order.status === 'acabamento' ? 'bg-amber-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {order.client}
                      </div>
                      <div className="text-xs text-slate-500">{order.product}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">{order.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alertas e Ações */}
        <div className="space-y-6">
          <Card className="shadow-sm border-0 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AlertItem 
                type="danger" 
                title="Prazo vencido" 
                description="2 pedidos com prazo hoje" 
              />
              <AlertItem 
                type="warning" 
                title="Arquivo pendente" 
                description="3 pedidos aguardam arquivo" 
              />
              <AlertItem 
                type="info" 
                title="Manutenção programada" 
                description="Servidor às 2h da manhã" 
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Faturamento do mês</p>
                  <p className="text-3xl font-bold mt-1">R$ 47.850</p>
                  <div className="flex items-center gap-1 mt-2 text-blue-200 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12% vs mês anterior</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color,
  trend 
}: { 
  title: string; 
  value: string | number; 
  subtitle: string; 
  icon: any;
  color: 'blue' | 'green' | 'amber' | 'purple';
  trend: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <Card className="shadow-sm border-0 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</CardTitle>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900 dark:text-white">{value}</div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{trend}</p>
      </CardContent>
    </Card>
  );
}

function AlertItem({ 
  type, 
  title, 
  description 
}: { 
  type: 'danger' | 'warning' | 'info'; 
  title: string; 
  description: string; 
}) {
  const styles = {
    danger: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  };

  const icons = {
    danger: AlertCircle,
    warning: AlertCircle,
    info: Clock,
  };

  const Icon = icons[type];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${styles[type]}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs opacity-75 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
