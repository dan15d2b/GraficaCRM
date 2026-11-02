/**
 * O PERFIL DO PAÍS DA ORGANIZAÇÃO — o documento do titular, a lei citada, o
 * calendário do prazo e os padrões de dado pessoal que o anonimizador redige.
 *
 * ─── Por que por ORGANIZAÇÃO, e não por instalação ─────────────────────────
 *
 * Duas organizações no mesmo banco podem estar em países diferentes, e cada
 * uma vê o documento, a lei e o prazo do país DELA. Um `.env` (`APP_COUNTRY`)
 * não sabe disso: ele responde por processo, e o processo serve todas as
 * organizações. A coluna `organizations.country` (ISO-3166 alpha-2, `null` =
 * Brasil) é a resposta; este módulo é quem a lê.
 *
 * ─── Por que uma função, e não `select` inline em cada rota ───────────────
 *
 * Mesmo motivo escrito no cabeçalho de `lib/catalogo/moeda-da-org.ts`: são
 * vários consumidores (validador do contato, importação por planilha,
 * anonimizador, PDF de acesso, página de privacidade, prazo do SLA) e duas
 * leituras inline divergem no dia em que uma ganhar fallback e a outra não.
 * A divergência aqui seria pior do que no catálogo: um documento afirmaria a
 * lei de um país e o prazo seria contado pelo calendário de outro.
 */

import { HOLIDAYS_BR_ISO } from "@/lib/lgpd/holidays-br";
import { HOLIDAYS_PT_ISO } from "@/lib/lgpd/holidays-pt";
// import { dbQuery } from "@/lib/db/local"; // REMOVIDO: evita dependência pesada no Edge Runtime

/** ISO-3166 alpha-2, em maiúsculas. `null`/vazio na coluna significa Brasil. */
export type CodigoDePais = string;

/**
 * Um padrão de dado pessoal que ESTE país redige antes de a conversa ir para o
 * modelo de IA.
 *
 * `fonte` é a regex em texto, e não um `RegExp` montado: quem consome precisa
 * de instância nova por chamada — o `lastIndex` do `/g` atravessa `.test()` e
 * corrompe a guarda de vazamento (mesma razão anotada em
 * `lib/ai/anonymize/index.ts`).
 */
export interface PadraoDePiiDoPais {
  /** Rótulo do tipo, o mesmo que aparece no marcador: `[CPF]`, `[BI]`. */
  tipo: string;
  /** Marcador que substitui o dado no texto anonimizado, com colchetes. */
  marcador: string;
  /** A regex, em texto, sem as flags. Cada consumidor cria a instância. */
  fonte: string;
  /**
   * O que este padrão **não** cobre. A issue #1033 exige a declaração: um
   * padrão largo demais redige número de pedido e cria ruído no RAG; largo de
   * menos deixa o documento chegar ao modelo — e os dois defeitos são
   * silenciosos sem esta linha escrita.
   */
  naoCobre: string;
}

export interface DocumentoDoTitular {
  /** O rótulo da tela: "CPF", "Documento". */
  rotulo: string;
  /** Exemplo mostrado no formulário e nas mensagens. */
  exemplo: string;
  /** O que a validação GARANTE. Vai para a mensagem de erro. */
  regra: string;
  /**
   * A mensagem de erro pronta, por país. É texto de produto, e não remendo de
   * `regra`: país sem checksum público precisa DIZER que a validação é de
   * forma (a issue exige), e o texto brasileiro continua `CPF inválido`, o de
   * sempre, para não mexer no que quem já usa conhece.
   */
  mensagemInvalido: string;
  /** `true` quando o validador confere dígito verificador, e não só a forma. */
  confereDigito: boolean;
  /**
   * Cabeçalhos de planilha que apontam para este documento, JÁ normalizados
   * como `normalizaHeader` de `lib/contacts/csv.ts` os entrega (sem acento, em
   * minúsculas, separador `_`): quem importa tem "CPF" no Excel brasileiro e
   * "Bilhete de Identidade" no angolano. A coluna do banco continua `cpf` — o
   * vocabulário de TELA muda, o schema não (decisão escrita na issue #1033).
   */
  apelidosDoCabecalho: readonly string[];
  /** Valida o valor como o usuário digitou. */
  valida(valor: string): boolean;
  /** Como o valor é GRAVADO (a planilha não decide o formato do banco). */
  normaliza(valor: string): string;
}

export interface EmpresaDoPais {
  /** O rótulo da tela do nome legal: "Razão social", "Denominação social". */
  rotuloNomeLegal: string;
  /** O rótulo da tela do número da empresa: "CNPJ", "NIPC". */
  rotuloNumero: string;
}

export interface LeiCitada {
  /** Sigla pela qual a lei é conhecida: "LGPD", "GDPR". */
  nome: string;
  /** Número e data, como se cita em documento: "Lei nº 13.709/2018". */
  numero: string;
  /** O dispositivo do direito de acesso: "Art. 18, II". */
  artigo: string;
  /**
   * Revisão jurídica local feita por quem pode revisar. Enquanto for `false`,
   * o documento não cita esta lei (ver cabeçalho).
   */
  revisada: boolean;
  /**
   * A revisão foi feita por IA, sem advogado local. A tela de Configurações
   * declara isso a quem responde pelo documento (ver o cabeçalho).
   */
  revisadaPorIa?: true;
  /**
   * Como o documento de acesso rotula a citação. Ausente = "Base legal", o
   * rótulo de sempre — o Brasil não declara este campo, e por isso o
   * `data.json` brasileiro não ganha chave nova.
   */
  rotuloNoDocumento?: string;
}

export interface AutoridadeDeSupervisao {
  /** Como a autoridade é conhecida, já com a sigla: "Comissão Nacional de Proteção de Dados (CNPD)". */
  nome: string;
  /** Onde o titular reclama. Site oficial, não buscado em runtime. */
  site: string;
}

export interface CalendarioDeDiasUteis {
  /** Datas `YYYY-MM-DD` dos feriados nacionais, no formato de `holidays-br.ts`. */
  feriados: readonly string[];
  /** Como o calendário se apresenta ao operador: "feriados nacionais brasileiros". */
  rotulo: string;
}

export interface PerfilDoPais {
  /** ISO-3166 alpha-2, maiúsculas. */
  codigo: CodigoDePais;
  /** Nome do país como o operador o lê. */
  nome: string;
  documento: DocumentoDoTitular;
  empresa: EmpresaDoPais;
  telefoneExemplo: string;
  lei: LeiCitada | null;
  autoridadeDeSupervisao?: AutoridadeDeSupervisao;
  calendario: CalendarioDeDiasUteis;
  padroesDePii: readonly PadraoDePiiDoPais[];
}

export const PAIS_PADRAO: CodigoDePais = "BR";

export function isValidCpf(raw: string): boolean {
  const s = raw.replace(/\D/g, "");
  if (!/^\d{11}$/.test(s) || /^(\d)\1{10}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(s[i]!, 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(s[9]!, 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(s[i]!, 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(s[10]!, 10);
}

export function isValidNif(raw: string): boolean {
  const s = raw.replace(/\D/g, "");
  if (!/^\d{9}$/.test(s) || /^(\d)\1{8}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += parseInt(s[i]!, 10) * (9 - i);
  const resto = sum % 11;
  const digito = resto < 2 ? 0 : 11 - resto;
  return digito === parseInt(s[8]!, 10);
}

const DOCUMENTO_BR: DocumentoDoTitular = {
  rotulo: "CPF",
  exemplo: "000.000.000-00",
  regra: "dígito verificador (mod-11 da Receita Federal)",
  mensagemInvalido: "CPF inválido",
  confereDigito: true,
  apelidosDoCabecalho: ["cpf"],
  valida: isValidCpf,
  normaliza: (valor) => valor.replace(/\D/g, ""),
};

const PERFIL_BR: PerfilDoPais = {
  codigo: "BR",
  nome: "Brasil",
  documento: DOCUMENTO_BR,
  empresa: { rotuloNomeLegal: "Razão social", rotuloNumero: "CNPJ" },
  telefoneExemplo: "+5511999998888",
  lei: {
    nome: "LGPD",
    numero: "Lei nº 13.709/2018",
    artigo: "Art. 18, II",
    revisada: true,
  },
  calendario: { feriados: HOLIDAYS_BR_ISO, rotulo: "feriados nacionais brasileiros" },
  padroesDePii: [
    { tipo: "cpf", marcador: "[CPF]", fonte: "\\b\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}\\b", naoCobre: "..." },
    { tipo: "cep", marcador: "[CEP]", fonte: "\\b\\d{5}-?\\d{3}\\b", naoCobre: "..." },
  ],
};

const DOCUMENTO_PT: DocumentoDoTitular = {
  rotulo: "NIF",
  exemplo: "123 456 789",
  regra: "dígito de controlo (mod-11 da Autoridade Tributária)",
  mensagemInvalido: "NIF inválido",
  confereDigito: true,
  apelidosDoCabecalho: ["nif", "contribuinte"],
  valida: isValidNif,
  normaliza: (valor) => valor.replace(/\D/g, ""),
};

const PERFIL_PT: PerfilDoPais = {
  codigo: "PT",
  nome: "Portugal",
  documento: DOCUMENTO_PT,
  empresa: { rotuloNomeLegal: "Denominação social", rotuloNumero: "NIPC" },
  telefoneExemplo: "+351912345678",
  lei: {
    nome: "RGPD",
    numero: "Regulamento (UE) 2016/679",
    artigo: "art. 15.º",
    revisada: true,
    revisadaPorIa: true,
    rotuloNoDocumento: "Direito exercido",
  },
  autoridadeDeSupervisao: { nome: "Comissão Nacional de Proteção de Dados (CNPD)", site: "https://www.cnpd.pt" },
  calendario: { feriados: HOLIDAYS_PT_ISO, rotulo: "feriados nacionais portugueses" },
  padroesDePii: [],
};

export const PERFIS_DO_PAIS: Record<CodigoDePais, PerfilDoPais> = { BR: PERFIL_BR, PT: PERFIL_PT };

export function perfilDoPais(codigo: CodigoDePais | null | undefined): PerfilDoPais {
  const chave = (codigo ?? "").trim().toUpperCase();
  if (chave === "") return PERFIS_DO_PAIS[PAIS_PADRAO]!;
  return PERFIS_DO_PAIS[chave] ?? PERFIS_DO_PAIS[PAIS_PADRAO]!;
}

export function paisesOferecidos(): PerfilDoPais[] {
  return Object.values(PERFIS_DO_PAIS)
    .filter((p) => p.lei?.revisada === true)
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export function citacaoDaLei(perfil: PerfilDoPais): string | null {
  const lei = perfil.lei;
  if (!lei || !lei.revisada) return null;
  return `${lei.nome} ${lei.artigo} (${lei.numero})`;
}

export async function perfilDaOrganizacao(_dbOrClient: unknown, orgId: string): Promise<PerfilDoPais> {
  try {
    // Importação dinâmica para evitar carregar better-sqlite3 no Edge Runtime
    const { dbQuery } = await import("@/lib/db/local");
    const result = await dbQuery("SELECT country FROM organizations WHERE id = ? LIMIT 1", [orgId]);
    const row = result.rows[0] as { country?: string | null } | undefined;
    const declarado = row?.country ?? null;
    return perfilDoPais(declarado);
  } catch (error) {
    console.error("[perfil-do-pais] erro ao ler perfil:", { orgId, error });
    return perfilDoPais(PAIS_PADRAO);
  }
}
