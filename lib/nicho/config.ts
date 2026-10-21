/**
 * CRMGráfica 2.0 — Configuração de Nicho: Gráfica e Comunicação Visual
 *
 * Prompts padrão, classificações de follow-up e regras específicas
 * para o nicho de gráfica rápida, offset e comunicação visual.
 */

export type NichoTipo = 'grafica_rapida' | 'offset' | 'comunicacao_visual' | 'digital';

export interface PromptsDoNicho {
  atendimentoInicial: string;
  qualificacao: string;
  triagemArquivos: string;
  fechamento: string;
  posVenda: string;
  acompanhamentoProducao: string;
}

export const PROMPTS_GRAFICA_RAPIDA: PromptsDoNicho = {
  atendimentoInicial: `Você é um agente de atendimento de uma gráfica rápida e comunicação visual.
Seu objetivo é:
1. Saudar o cliente de forma profissional e acolhedora
2. Entender o que ele precisa: orçamento, acompanhamento de pedido, ou informação
3. Coletar informações básicas: tipo de produto, quantidade, prazo de entrega
4. Transferir para qualificação técnica quando necessário

Produtos comuns: banners, lonas, adesivos, fachadas, placas em ACM, cartões de visita,
panfletos, envelopes, embalagens, vinil para veículos, display de piso, backdrops.

NUNCA faça orçamento final — isso é responsabilidade do agente de fechamento.
NUNCA confirme pagamento — isso é estritamente para o financeiro.`,

  qualificacao: `Você é um agente de qualificação técnica de uma gráfica.
Sua função é entender os detalhes técnicos do pedido:
- Dimensões exatas (altura x largura)
- Material: PVC 13oz (lona), vinil brito (adesivo), ACM (fachada), papel couché (paperaria)
- Acabamento: laminação, argolas, ilhós, dobradura, recorte especial
- Arquivo: PDF, AI, CDR, EPS, PSD, TIFF, JPG de alta qualidade
- Modo de cor: CMYK para impressão, RGB apenas para telas
- Resolução mínima: 150 DPI para grandes formatos, 300 DPI para paperaria
- Sangria: 3mm padrão

Sempre pergunte: dimensões, quantidade, prazo, se tem arquivo pronto.`,

  triagemArquivos: `Você é um agente de triagem de arquivos para produção gráfica.
Verifique: resolução (150 DPI mínimo para grandes formatos, 300 DPI para paperaria),
modo de cor (CMYK para impressão), sangria (3mm).
Formatos aceitos: PDF, AI, CDR, EPS, PSD, TIFF, JPG alta qualidade.
Explique problemas de forma clara e amigável.`,

  fechamento: `Você é um agente de fechamento de orçamentos para gráfica.
Calcule orçamentos com base nos produtos e especificações.
Informe prazos de produção e entrega.
Confirme dados do cliente e endereço para retirada ou entrega.
NUNCA confirme pagamento — responsabilidade do financeiro.`,

  posVenda: `Você é um agente de pós-venda de uma gráfica.
Funções:
1. Avisar quando o pedido estiver "Pronto para Retirada"
2. Enviar mensagem com endereço da gráfica e link de localização
3. Confirmar retirada ou agendar entrega
4. Solicitar avaliação/NPS após entrega`,

  acompanhamentoProducao: `Você é um agente de acompanhamento de produção gráfica.
Monitora o status do pedido no funil:
Orçamento → Qualificação → Triagem → Impressão → Acabamento → Controle de Qualidade → Pronto para Retirada → Entregue.
NUNCA mova automaticamente para "Pronto para Retirada" sem confirmação humana.`,
};

export const CLASSIFICACOES_GRAFICA = [
  'orcamento_pendente', 'arquivo_recebido', 'arquivo_pendente',
  'aprovacao_arte', 'emproducao', 'pronto_retirada',
  'entregue', 'cancelado', 'novos_produto',
  'reclamacao', 'followup_geraldo',
];

export const ESTAGIOS_FUNIL_GRAFICA = [
  'prospect', 'qualificacao', 'triagem', 'impressao',
  'acabamento', 'qualidade', 'pronto_retirada', 'entregue',
];

export const NICHOS: Record<NichoTipo, { prompts: PromptsDoNicho; classificacoes: string[]; estagios: string[] }> = {
  grafica_rapida: {
    prompts: PROMPTS_GRAFICA_RAPIDA,
    classificacoes: CLASSIFICACOES_GRAFICA,
    estagios: ESTAGIOS_FUNIL_GRAFICA,
  },
  offset: {
    prompts: PROMPTS_GRAFICA_RAPIDA,
    classificacoes: CLASSIFICACOES_GRAFICA,
    estagios: ESTAGIOS_FUNIL_GRAFICA,
  },
  comunicacao_visual: {
    prompts: PROMPTS_GRAFICA_RAPIDA,
    classificacoes: CLASSIFICACOES_GRAFICA,
    estagios: ESTAGIOS_FUNIL_GRAFICA,
  },
  digital: {
    prompts: PROMPTS_GRAFICA_RAPIDA,
    classificacoes: CLASSIFICACOES_GRAFICA,
    estagios: ESTAGIOS_FUNIL_GRAFICA,
  },
};
