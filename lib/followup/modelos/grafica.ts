/**
 * FOLLOW-UPS PARA GRÁFICA E COMUNICAÇÃO VISUAL
 */
import type { ModeloDeFollowup } from "./tipos";
import { montarEscada } from "./escada";

const MIN_MS = 60_000;
const HORA_MS = 3_600_000;
const DIA_MS = 86_400_000;

const O_ATENDIMENTO_ASSUME =
  "O cliente respondeu — quem segue a conversa é o atendimento.";

export const MODELOS_DE_GRAFICA: readonly ModeloDeFollowup[] = [
  {
    id: "grafica-orcamento-retomada",
    nicho: "grafica",
    nome: "Orçamento · retomar quem sumiu",
    jornada: "Orçamento",
    resumo: "O orçamento foi enviado e o cliente não respondeu.",
    oQueDispara: "24 horas sem resposta após envio de orçamento.",
    pedeEtapa: true,
    handoffPolicy: "pause",
    gatilho: () => ({
      kind: "stage_change",
      params: { stage_id: "" },
      cancel_on_reply: true,
    }),
    grafo: montarEscada({
      toques: [
        {
          esperaAntesMs: HORA_MS,
          texto: "Olá! Enviamos nosso orçamento e gostaria de saber se ficou alguma dúvida. Posso ajudar?",
          rotulo: "1º toque",
        },
        {
          esperaAntesMs: DIA_MS,
          texto: "Olá! Passando para saber se conseguiu analisar o orçamento. Estou à disposição.",
          rotulo: "2º toque",
        },
      ],
      prazoDeRespostaMs: 2 * DIA_MS,
      sim: { rotulo: "Cliente respondeu", padrao: O_ATENDIMENTO_ASSUME },
      notaDeResposta: O_ATENDIMENTO_ASSUME,
    }),
  },
  {
    id: "grafica-arquivo-pendente",
    nicho: "grafica",
    nome: "Arquivo · solicitar arquivo",
    jornada: "Triagem",
    resumo: "O cliente quer produzir, mas não enviou os arquivos.",
    oQueDispara: "Estágio mudou para triagem e arquivo não recebido.",
    pedeEtapa: true,
    handoffPolicy: "pause",
    gatilho: () => ({
      kind: "stage_change",
      params: { stage_id: "" },
      cancel_on_reply: true,
    }),
    grafo: montarEscada({
      toques: [
        {
          esperaAntesMs: HORA_MS,
          texto: "Olá! Para iniciarmos a produção, precisamos dos arquivos finais. Pode enviar por aqui?",
          rotulo: "1º toque",
        },
        {
          esperaAntesMs: DIA_MS,
          texto: "Olá! Estamos aguardando os arquivos para dar início ao seu pedido.",
          rotulo: "2º toque",
        },
      ],
      prazoDeRespostaMs: 2 * DIA_MS,
      sim: { rotulo: "Arquivo recebido", padrao: "Arquivo recebido! Vamos iniciar." },
      notaDeResposta: "Aguardando arquivo.",
    }),
  },
  {
    id: "grafica-pronto-retirada",
    nicho: "grafica",
    nome: "Pronto · notificar retirada",
    jornada: "Produção",
    resumo: "Pedido pronto para retirada.",
    oQueDispara: "Estágio mudou para 'pronto_retirada'.",
    pedeEtapa: true,
    handoffPolicy: "pause",
    gatilho: () => ({
      kind: "stage_change",
      params: { stage_id: "" },
      cancel_on_reply: true,
    }),
    grafo: montarEscada({
      toques: [
        {
          texto: "Olá! Seu pedido está pronto para retirada. Pode vir buscar no horário de funcionamento!",
          rotulo: "Notificação",
        },
      ],
      prazoDeRespostaMs: 7 * DIA_MS,
      sim: { rotulo: "Retirada confirmada", padrao: "Perfeito! Aguardamos você." },
      notaDeResposta: "Cliente retirou o pedido.",
    }),
  },
  {
    id: "grafica-servico-concluido",
    nicho: "grafica",
    nome: "Conclusão · solicitar avaliação",
    jornada: "Entrega",
    resumo: "Serviço concluído. Solicitar avaliação.",
    oQueDispara: "Estágio mudou para 'servico_concluido'.",
    pedeEtapa: true,
    handoffPolicy: "pause",
    gatilho: () => ({
      kind: "stage_change",
      params: { stage_id: "" },
      cancel_on_reply: true,
    }),
    grafo: montarEscada({
      toques: [
        {
          texto: "Olá! Seu pedido foi concluído. Gostaríamos de saber sua avaliação sobre nosso atendimento. Obrigado!",
          rotulo: "Solicitar avaliação",
        },
      ],
      prazoDeRespostaMs: 7 * DIA_MS,
      sim: { rotulo: "Avaliação recebida", padrao: "Obrigado pela avaliação!" },
      notaDeResposta: "Avaliação enviada pelo cliente.",
    }),
  },
];
