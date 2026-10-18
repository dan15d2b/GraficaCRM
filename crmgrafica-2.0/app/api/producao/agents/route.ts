import { NextResponse } from 'next/server';
import { AGENT_CONFIGS, AGENT_FLOW } from '@/lib/ai-agents';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const flow = searchParams.get('flow');
  const step = searchParams.get('step');
  
  if (flow && AGENT_FLOW[flow as keyof typeof AGENT_FLOW]) {
    const agentIds = AGENT_FLOW[flow as keyof typeof AGENT_FLOW];
    const agents = agentIds.map((id: string) => AGENT_CONFIGS[id as keyof typeof AGENT_CONFIGS]);
    
    return NextResponse.json({
      success: true,
      flow,
      agents: agents.map((a: any) => ({ id: a.id, name: a.name, description: a.description, model: a.model })),
    });
  }
  
  if (step && AGENT_CONFIGS[step as keyof typeof AGENT_CONFIGS]) {
    const agent = AGENT_CONFIGS[step as keyof typeof AGENT_CONFIGS];
    return NextResponse.json({
      success: true,
      agent: { id: agent.id, name: agent.name, description: agent.description, systemPrompt: agent.systemPrompt, tools: agent.tools, maxTurns: agent.maxTurns, handoffThreshold: agent.handoffThreshold },
    });
  }
  
  return NextResponse.json({
    success: true,
    agents: Object.values(AGENT_CONFIGS).map((a: any) => ({ id: a.id, name: a.name, description: a.description, model: a.model })),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { agentId, messages, orderId } = body;
  
  const agent = AGENT_CONFIGS[agentId as keyof typeof AGENT_CONFIGS];
  if (!agent) {
    return NextResponse.json({ success: false, error: 'Agente não encontrado' }, { status: 404 });
  }
  
  const lastMessage = messages?.[messages.length - 1]?.content || '';
  let response = '';
  
  switch (agent.id) {
    case 'atendimento-inicial':
      response = 'Olá! Sou o assistente da gráfica. Para melhor ajudá-lo, poderia me informar: 1) Que tipo de produto você precisa? 2) Dimensões? 3) Prazo?';
      break;
    case 'qualificacao':
      response = 'Para qualificar este pedido, preciso verificar: Dimensões exatas, material, acabamento e se possui arquivo pronto.';
      break;
    case 'triagem-arquivos':
      response = 'Analisando o arquivo... Verifiquei que a resolução está abaixo do recomendado. Precisamos de 150 DPI para grandes formatos.';
      break;
    case 'fechamento':
      response = 'Orçamento: Banner lona 13oz 3x2m = R$ 270,00. Prazo: 3 dias úteis. Forma de pagamento: PIX ou transferência.';
      break;
    case 'apos-venda':
      response = 'Seu pedido está pronto para retirada! Endereço: Rua das Gráficas, 123. Aguardamos você!';
      break;
    default:
      response = 'Como posso ajudá-lo com seu pedido na gráfica?';
  }
  
  return NextResponse.json({ success: true, agent: agent.id, response, needsHuman: false });
}
