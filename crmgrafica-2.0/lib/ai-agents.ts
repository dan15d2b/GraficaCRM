/**
 * CRMGráfica 2.0 — Agentes de IA Especializados (Parte 1)
 * 
 * Arquitetura de múltiplos sub-agentes para evitar sobrecarga.
 */

export type AgentType = 
  | 'atendimento-inicial'
  | 'qualificacao'
  | 'triagem-arquivos'
  | 'fechamento'
  | 'apos-venda';

export interface AgentConfig {
  id: AgentType;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  maxTurns: number;
  handoffThreshold: number;
}

/**
 * Prompt para agente de atendimento inicial
 */
export const PROMPT_ATENDIMENTO_INICIAL = `Você é um agente de atendimento de uma gráfica rápida.
Seu objetivo é:
1. Saudar o cliente de forma profissional e acolhedora
2. Entender o que ele precisa (orçamento, acompanhamento, informação)
3. Coletar informações básicas: tipo de produto, quantidade, prazo
4. Transferir para qualificação se necessário

Produtos comuns: banners, lonas, adesivos, fachadas, cartões de visita, panfletos, embalagens.
NÃO faça orçamento final — isso é feito pelo agente de fechamento.`;

/**
 * Prompt para agente de qualificação
 */
export const PROMPT_QUALIFICACAO = `Você é um agente de qualificação de uma gráfica.
Sua função é entender detalhes técnicos do pedido:
- Dimensões, material, acabamento
- Disponibilidade de arquivo (PDF, AI, CDR, PNG)
- Necessidades especiais (laminação, vinil, recorte)

Produtos: banners (PVC 13oz, mesh), adesivos (vinil brito), fachadas (ACM), papelaria.
Sempre pergunte: dimensões, quantidade, prazo, se tem arquivo pronto.`;

/**
 * Prompt para agente de triagem de arquivos
 */
export const PROMPT_TRIAGEM_ARQUIVOS = `Você é um agente de triagem de arquivos para produção gráfica.
Verifique: resolução (150 DPI mínimo), modo de cor (CMYK), sangria (3mm).
Formatos aceitos: PDF, AI, CDR, EPS, PSD, TIFF, JPG alta qualidade.
Explique problemas de forma clara e amigável.`;
/**
 * CRMGráfica 2.0 — Agentes de IA Especializados (Parte 2)
 */

/**
 * Prompt para agente de fechamento
 */
export const PROMPT_FECHAMENTO = `Você é um agente de fechamento de orçamentos para gráfica.
Calcule orçamentos com base nos produtos e especificações.
Informe prazos de produção e entrega.
Confirme dados do cliente e endereço para entrega.
NUNCA confirme pagamento — responsabilidade do financeiro.`;

/**
 * Prompt para agente de pós-venda
 */
export const PROMPT_POS_VENDA = `Você é um agente de pós-venda de uma gráfica.
Funções:
1. Avisar quando o pedido estiver "Pronto para Retirada"
2. Enviar mensagem com endereço da gráfica e link de localização
3. Confirmar retirada ou agendar entrega
4. Solicitar avaliação/NPS após entrega`;

/**
 * Configuração completa dos agentes
 */
export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  'atendimento-inicial': {
    id: 'atendimento-inicial',
    name: 'Atendimento Inicial',
    description: 'Primeiro contato com o cliente',
    model: 'claude-sonnet-4',
    systemPrompt: PROMPT_ATENDIMENTO_INICIAL,
    tools: ['get_product_info', 'search_clients'],
    maxTurns: 5,
    handoffThreshold: 0.6,
  },
  'qualificacao': {
    id: 'qualificacao',
    name: 'Qualificação de Pedido',
    description: 'Detalhamento técnico do pedido',
    model: 'claude-sonnet-4',
    systemPrompt: PROMPT_QUALIFICACAO,
    tools: ['get_product_specs', 'check_file_requirements'],
    maxTurns: 8,
    handoffThreshold: 0.4,
  },
  'triagem-arquivos': {
    id: 'triagem-arquivos',
    name: 'Triagem de Arquivos',
    description: 'Análise técnica de arquivos',
    model: 'claude-sonnet-4',
    systemPrompt: PROMPT_TRIAGEM_ARQUIVOS,
    tools: ['analyze_file', 'check_resolution'],
    maxTurns: 3,
    handoffThreshold: 0.3,
  },
  'fechamento': {
    id: 'fechamento',
    name: 'Fechamento de Orçamento',
    description: 'Cálculo de preço e confirmação',
    model: 'claude-sonnet-4',
    systemPrompt: PROMPT_FECHAMENTO,
    tools: ['calculate_price', 'send_proposal'],
    maxTurns: 6,
    handoffThreshold: 0.2,
  },
  'apos-venda': {
    id: 'apos-venda',
    name: 'Pós-Venda',
    description: 'Acompanhamento e entregas',
    model: 'claude-haiku-4',
    systemPrompt: PROMPT_POS_VENDA,
    tools: ['send_pickup_notification', 'request_feedback'],
    maxTurns: 4,
    handoffThreshold: 0.7,
  },
};

/**
 * Gatilho automático: "Pronto para Retirada"
 */
export function criarGatilhoRetirada(endereco: string, linkMaps: string) {
  return `Olá! Seu pedido está pronto para retirada na nossa gráfica.
📍 Endereço: ${endereco}
🗺️ Localização: ${linkMaps}
Aguardamos você!`;
}

/**
 * Fluxo padrão de agentes por tipo de interação
 */
export const AGENT_FLOW = {
  novo_orcamento: ['atendimento-inicial', 'qualificacao', 'triagem-arquivos', 'fechamento'],
  rastreio_pedido: ['atendimento-inicial'],
  aprovacao_arte: ['atendimento-inicial'],
  pos_venda: ['apos-venda'],
} as const;
