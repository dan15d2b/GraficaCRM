/**
 * CRMGráfica 2.0 — Página de Agentes de IA
 */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AGENT_CONFIGS } from '@/lib/ai-agents';
import type { AgentType } from '@/lib/ai-agents';
import { Bot, MessageSquare, Settings, Play } from 'lucide-react';

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [messages, setMessages] = useState<{role: string; content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const agent = selectedAgent ? AGENT_CONFIGS[selectedAgent] : null;

  async function sendMessage() {
    if (!input.trim() || !selectedAgent) return;
    
    setLoading(true);
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      const res = await fetch('/api/producao/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent,
          messages: [...messages, userMessage],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agentes de IA</h1>
          <p className="text-slate-500 mt-1">Configure e teste os agentes especializados</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Lista de Agentes */}
        <div className="space-y-3">
          {Object.values(AGENT_CONFIGS).map((a) => (
            <Card 
              key={a.id} 
              className={`cursor-pointer transition-all ${
                selectedAgent === a.id ? 'border-blue-500 shadow-md' : 'hover:shadow-sm'
              }`}
              onClick={() => setSelectedAgent(a.id as AgentType)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">{a.name}</CardTitle>
                    <p className="text-xs text-slate-500">{a.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Settings className="w-3 h-3 mr-1" /> Configurar
                  </Button>
                  <Button size="sm" className="text-xs bg-blue-600">
                    <Play className="w-3 h-3 mr-1" /> Testar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chat do Agente */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {agent?.name || 'Selecione um agente'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agent ? (
              <>
                <div className="bg-slate-50 rounded-lg p-4 mb-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-900 mb-2">System Prompt:</p>
                  <p className="whitespace-pre-wrap">{agent.systemPrompt}</p>
                </div>
                
                <div className="h-64 overflow-y-auto bg-slate-50 rounded-lg p-4 space-y-3 mb-4">
                  {messages.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      Inicie uma conversa com o agente...
                    </p>
                  ) : (
                    messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white border border-slate-200 text-slate-900'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button onClick={sendMessage} disabled={loading} className="bg-blue-600">
                    {loading ? '...' : 'Enviar'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                Selecione um agente para começar
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
