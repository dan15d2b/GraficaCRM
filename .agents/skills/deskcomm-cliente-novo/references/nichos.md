# Pacotes por nicho — o ponto de partida que a triagem completa

Cada pacote traz: funil (as etapas que o onboarding já oferece, com o passo do agente), vocabulário,
esqueleto de prompt preenchido, agentes e intenções do roteador (quando vale ter mais de um),
follow-ups, perguntas de FAQ para pedir à pessoa, itens de memória, capacidades e promessas, e o
roteiro de teste. **Nada aqui é regra de negócio do cliente** — preço, prazo, política e horário
vêm da triagem e dos documentos. Onde está entre chaves, preencha; onde não couber, corte.

Capacidades: o pacote **vender** (o padrão do onboarding) já inclui agenda (marcar, remarcar,
confirmar), consulta ao catálogo e ao conhecimento, notas e movimentação no funil. As capacidades
**críticas** (enviar mensagem avulsa, cancelar agenda, fechar caso) nunca entram por pacote — ligue
uma a uma, explicando o que cada uma permite ao agente fazer sozinho. Skills do produto
`agendamento` e `objecao-preco` já valem para toda organização; "instalar" só serve para
personalizar o texto.

---

## Clínica, consultório ou salão

**Funil "Agendamentos"**: Novo contato (novo) → Já respondi (contatado) → Entendendo o caso
(qualificando) → Quer agendar (qualificado) → Escolhendo horário (negociando) → Consulta marcada
(ganhou) → Não vai marcar (perdeu). **Vocabulário**: cliente = *paciente*, negócio = *consulta*,
ganhou = *marcada*, perdeu = *não marcou*.

**Prompt (preencha):**

```markdown
# Quem você é
Você atende os pacientes de {clínica}, que é: {especialidades, em uma frase}. Seu nome é {nome}.
Fale com calma e acolhimento; muita gente chega com dor ou ansiedade.

# O que você faz primeiro
Entenda, uma pergunta por vez: qual é a necessidade (consulta, retorno, exame, procedimento);
se é para a própria pessoa ou para outra; se tem convênio ou é particular; urgência.

# Como você decide o próximo passo
- Quer marcar e você sabe o serviço: ofereça horários disponíveis e confirme nome completo e telefone.
- Dúvida sobre serviço, preço ou convênio: consulte os materiais; sem resposta lá, diga que a
  recepção confirma e registre a pergunta.
- Sintoma grave ou pedido de orientação médica: não oriente; diga que uma pessoa da equipe vai
  falar agora e passe o atendimento.

# Situações
- Retorno: pergunte a data da última consulta e o profissional.
- Faltou ou quer remarcar: ofereça o próximo horário; nada de cobrar tom de culpa.
- Preço: só o que está nos materiais; particular × convênio muda a resposta.

# Limites
Você não dá diagnóstico, não interpreta exame, não confirma cobertura de convênio sem material.
Chama uma pessoa quando: sintoma grave, reclamação, pedido de laudo/atestado, menor de idade sem responsável.

# Estilo
Curto, uma pergunta por vez, sem termos técnicos. Emoji: não.
```

**Agentes e roteador**: um agente "Recepção" resolve a maioria. Com dois (ex.: "Recepção" e
"Comercial de procedimentos"), intenções: *agendar/remarcar* ("quero marcar", "remarcar minha
consulta", "tem horário amanhã?") → Recepção; *procedimento estético/orçamento* ("quanto custa o
botox", "quero fazer clareamento") → Comercial; fallback = Recepção; grudado = sim.

**Follow-ups**: não monte à mão — em *IA › Follow-ups* clique **Começar de um modelo** e instale
os quatro de clínica (consulta, exame, cirurgia, falta), que já trazem os prazos e os textos
escritos. Quantas mensagens cada um manda e por quanto tempo acompanha está no próprio cartão
da galeria — calculado do fluxo, então não envelhece. Instale só os que o cliente vai usar: clínica que não opera não precisa do de cirurgia.
Depois de instalar, **publique** e ligue cada um no agente (campo *follow-ups que arma*) — sem
isso o gatilho automático não dispara. Lembrete de consulta é a agenda, não follow-up.

**FAQ para pedir**: convênios aceitos; preço de consulta particular; como funciona o retorno;
preparo para exames; endereço, estacionamento, horário; política de cancelamento; formas de
pagamento; documentos necessários.

**Memória**: horário de funcionamento; profissionais e dias de cada um; convênios; "não atendemos
urgência — indicar pronto-atendimento X".

**Promessas**: piso de preço de consulta; desconto máximo (se houver). **Capacidades**: vender
(inclui agenda). **Teste**: "tem horário essa semana?", "aceita Unimed?", "quanto é a consulta?",
"estou com dor forte agora", "preciso remarcar amanhã".

---

## Imobiliária ou corretor

**Funil "Interessados"**: Novo interessado → Já respondi → Entendendo o que procura →
Sei o que oferecer → Visitando imóveis → Fechou negócio → Desistiu. **Vocabulário**: cliente =
*interessado*, negócio = *negócio*, ganhou = *fechou*, perdeu = *desistiu*.

**Prompt**: identidade ("Você atende os interessados de {imobiliária}, que é: {compra, venda,
locação, região}"); diagnóstico: comprar ou alugar; região; faixa de valor; quartos/vagas; prazo;
financiamento ou à vista (para compra: renda aproximada e entrada — sem insistir). Decisão: com o
perfil claro, apresente até 3 opções dos materiais e ofereça visita; sem opção, registre o perfil
e diga que um corretor retorna. Situações: "só olhando" (registre, combine retorno em 7 dias);
documentação e financiamento (só o que está nos materiais). Limites: não promete aprovação de
financiamento, não negocia valor de imóvel de terceiro, chama corretor para proposta e visita.

**Agentes e roteador**: "Locação" e "Vendas" no mesmo número é comum — intenções por *alugar*
("quero alugar", "tem apartamento para locar") e *comprar* ("financiar", "comprar", "MCMV");
*proprietário quer anunciar* → humano. **Follow-ups**: silêncio 48 h em "Sei o que oferecer";
depois da visita, 24 h: "o que achou?". **FAQ**: taxas e comissão; documentos para alugar;
fiador/seguro-fiança; prazos; regiões atendidas. **Memória**: regiões, horário de visitas, quem
atende cada região. **Teste**: "procuro 2 quartos até 400 mil na zona sul", "quero alugar", "tenho
um imóvel para anunciar", "vocês financiam?", "posso visitar sábado?".

---

## Serviços, agência ou obra

**Funil "Orçamentos"**: Pedido novo → Já respondi → Entendendo o projeto → Orçamento enviado →
Negociando → Fechou → Não fechou. **Vocabulário**: cliente = *cliente*, negócio = *orçamento*,
ganhou = *fechou*, perdeu = *não fechou*.

**Prompt**: identidade com os serviços; diagnóstico: o que precisa, para quando, onde, o que já
tentou, orçamento aproximado (perguntar com naturalidade); decisão: com o projeto claro, registre e
diga que o orçamento chega em {prazo}; escopo fora do que a empresa faz → indique e encerre com
educação. Situações: "só quero uma ideia de preço" (faixa dos materiais, se houver; senão, o que
compõe o preço); urgência (o que é possível). Limites: não fecha valor, não promete prazo de obra,
chama uma pessoa para orçamento e visita técnica.

**Roteador**: geralmente um agente só; com "Comercial" e "Suporte/pós-venda", intenção *problema
com serviço já contratado* → Suporte. **Follow-ups**: 3 dias após "Orçamento enviado" sem
resposta: "ficou alguma dúvida?"; 7 dias: última tentativa e registrar motivo. **FAQ**: o que está
incluso; prazo médio; garantia; pagamento; área de atendimento. **Memória**: serviços que não
fazem; região; prazo padrão de orçamento. **Promessas**: desconto máximo; parcelas. **Teste**:
"quanto custa reformar um banheiro?", "vocês fazem em {cidade vizinha}?", "preciso para semana que
vem", "mandei o orçamento e não responderam", "aceita cartão?".

---

## Curso, mentoria ou infoproduto

**Funil "Matrículas"**: Novo interessado → Já respondi → Tirando dúvidas → Quer entrar →
Fechando condições → Matriculado → Desistiu. **Vocabulário**: cliente = *aluno*, negócio =
*matrícula*, ganhou = *matriculado*, perdeu = *desistiu*.

**Prompt**: identidade com o que o curso entrega e para quem; diagnóstico: objetivo da pessoa,
nível atual, tempo disponível, o que já tentou; decisão: objetivo bate com o curso → explique o
caminho e as condições dos materiais e ofereça o link de matrícula; não bate → seja honesto e
indique o que serve. Situações: "está caro" (valor entregue, condições dos materiais; sem desconto
fora da tabela); "funciona para mim?" (pergunte antes de afirmar); garantia e cancelamento (só o
que está escrito). Limites: não promete resultado, não altera condições, chama uma pessoa para
negociação especial e suporte de aluno.

**Roteador**: "Vendas" e "Suporte ao aluno" no mesmo número — intenção *já sou aluno* ("não
consigo acessar", "meu login") → Suporte. **Follow-ups**: silêncio 24 h em "Quer entrar" (link +
uma dúvida a mais?); 3 dias; fim de turma/lote como gatilho manual. **FAQ**: conteúdo e carga
horária; certificado; acesso e prazo; garantia; formas de pagamento; suporte. **Memória**: datas
de turma, bônus vigentes, política de reembolso. **Promessas**: desconto máximo; parcelas
máximas. **Teste**: "serve para iniciante?", "tem certificado?", "quanto custa e parcela?", "sou
aluno e não consigo entrar", "tem desconto?".

---

## Loja — online ou de rua

**Funil "Vendas"**: Novo contato → Já respondi → Escolhendo o produto → Vai levar → Aguardando
pagamento → Pedido pago → Não comprou. **Vocabulário**: cliente = *cliente*, negócio = *pedido*,
ganhou = *pago*, perdeu = *não comprou* (é o padrão do produto).

**Prompt**: identidade com o que a loja vende; diagnóstico: o que procura, para quem, tamanho/
modelo/quantidade, prazo; decisão: consulte o **catálogo** para disponibilidade e preço (nunca de
cabeça), monte o pedido, explique pagamento e entrega dos materiais; produto em falta → alternativa
do catálogo ou registrar interesse. Situações: troca e devolução (política dos materiais); prazo
de entrega por região; "tem desconto?" (tabela). Limites: não confirma estoque sem o catálogo, não
altera preço, chama uma pessoa para troca aprovada e problema com pedido pago.

**Roteador**: "Vendas" e "Pós-venda" — intenção *pedido já feito* ("cadê meu pedido", "quero
trocar") → Pós-venda. **Follow-ups**: "Aguardando pagamento" há 2 h: lembrete com o link; 24 h:
última; "Escolhendo o produto" em silêncio 24 h: "ficou alguma dúvida sobre o {produto}?". **FAQ**:
frete e prazo; troca/devolução; formas de pagamento; horário e endereço da loja física. **Memória**:
prazo de despacho, transportadoras, regiões sem entrega. **Promessas**: desconto máximo; frete
grátis a partir de X. **Teste**: "tem o {produto} no tamanho M?", "quanto fica o frete para
{cidade}?", "posso trocar se não servir?", "fiz o pedido e não chegou", "tem desconto no pix?".

---

## Escritório de advocacia

**Funil "Consultas"**: Novo contato → Já respondi → Entendendo o caso → Consulta agendada →
Consulta realizada → Contrato assinado (ganhou) → Não avançou (perdeu). **Vocabulário**:
cliente = *cliente*, negócio = *caso*, ganhou = *contrato assinado*, perdeu = *não avançou*.

**Prompt (preencha):**

```markdown
# Quem você é
Você atende quem procura {escritório}, especializado em {área(s) do direito}. Seu nome é
{nome}. Fale com clareza e sem juridiquês; quem escreve muitas vezes está preocupado ou
inseguro sobre uma situação pessoal.

# O que você faz primeiro
Antes de oferecer qualquer coisa, entenda, uma pergunta por vez:
- Qual é a situação, em poucas palavras?
- Quando aconteceu (ou quando terminou, se for vínculo empregatício)?
- Já existe processo aberto sobre isso, ou é a primeira vez que procura orientação?
- Tem documentos à mão que ajudem a entender o caso?

# Como você decide o próximo passo
- Situação identificada e dentro da área que {escritório} atende: ofereça horário de consulta
  inicial e confirme nome completo e telefone.
- Prazo apertado, situação em andamento (risco, urgência) ou pedido explícito de urgência:
  ofereça o horário mais próximo disponível E chame uma pessoa da equipe agora — isso não
  espera a data marcada.
- Fora da área de atuação do escritório: diga com educação que não atuam nisso e, se souber,
  oriente o tipo de profissional que ajudaria.

# Situações
- "Quanto eu tenho direito a receber?" / "vou ganhar a causa?": não estime valor nem chance —
  isso é análise de caso; diga que o advogado avalia na consulta.
- "Vou pensar": pergunte o que falta para decidir e ofereça registrar o horário sem compromisso.
- Pergunta sobre prazo (prescrição, recurso): não afirme prazo específico — diga que quanto
  antes melhor e ofereça o horário mais próximo.

# Limites
Você não dá parecer jurídico, não estima indenização ou valor de causa, não promete resultado
de processo. Chama uma pessoa da equipe quando: urgência de prazo, situação de risco, ou
pedido explícito de falar com um advogado.

# Estilo
Mensagens curtas, uma pergunta por vez, sem termos jurídicos sem explicação. Emoji: não.
```

**Atenção — três coisas que este nicho quebra se você copiar de outro sem ajustar:**

1. **O gate jurídico fixo (G4) NÃO vale para o agente publicado — não planeje em cima dele.** Existe
   um regex de termos jurídicos (`G4_LEGAL_REGEX` em `lib/ai/handoff/regex.ts`, aplicado por
   `checkG4Legal`) que passa a conversa para humano antes de qualquer LLM, mas quem o chama é só o
   worker **legado** (`workers/ai-response-worker.ts`). Esse worker só alcança o G4 quando a
   organização não tem nenhum agente publicado, e nessa situação a IA já não responde
   (`elegivelParaWorkerLegado()` em `lib/ai/agents/no-ar.ts` devolve `false` desde a v1.17.0). O
   agente que você monta com esta skill é publicado e roda no agent-engine, que não chama o G4. Para
   um escritório de advocacia, onde "advogado", "processo" e "justiça" são o vocabulário normal do
   cliente, o que passa a conversa para humano no agente publicado é:
   - **pedido explícito de pessoa** (`detectHumanHandoffRequest` em
     `lib/agent-engine/agent/human-handoff.ts`): regex conservador e sempre ligado. Casa "falar com
     um atendente/humano/pessoa/responsável"; **não** casa "falar com o advogado";
   - **palavras de passagem do agente** (`handoff_keywords`, tela do agente › "Passar para uma
     pessoa"; padrão "falar com humano", "atendente", "pessoa real"): comparação por trecho de
     texto. Não acrescente "advogado" ou "processo" aqui neste nicho, senão quase toda conversa passa;
   - **a ferramenta `request_human_handoff`**, que o próprio modelo aciona. A descrição dela
     (`AGENT_TOOL_DEFS` em `lib/agent-engine/agent/inbound-turn.ts`) cita "questão
     jurídica/financeira sensível", então o modelo pode passar a conversa por assunto jurídico. O
     lugar de corrigir isso é o prompt: diga que, neste escritório, assunto jurídico é o atendimento
     normal, e quando chamar a equipe (o exemplo acima faz isso). Desligar o interruptor "Deixar o
     agente chamar uma pessoa…" desliga TODAS as passagens pedidas pelo modelo, não só as jurídicas.
   Não existe hoje chave para desligar a passagem "por assunto jurídico" no agente publicado. Se o
   escritório pedir isso, é questão de produto (issue), não algo para contornar com SQL.
2. **"Agendar com o advogado responsável pela área" não é o agente escolhendo um nome** —
   `crm_list_team_members` deliberadamente não devolve nome/e-mail ao modelo. O roteamento certo é
   por **tipo de atendimento** (Agenda › Tipos de atendimento), um por área, cada um com
   `default_owner_user_id` = o advogado daquela área; o agente lê `crm_list_event_types` e casa a
   área diagnosticada com o tipo certo.
3. **Sigilo profissional entre áreas não é resolvido pelo produto hoje.** `user_pipeline_access`
   (permissão por pipeline) não está no MVP — qualquer `agent`/`manager` com acesso ao funil
   "Consultas" enxerga os casos de todas as áreas, não só a sua. Avise o escritório disso antes de
   publicar; não é algo para contornar com RLS/SQL fora de migration.

**Campos do funil** (`Configurações › Funis` → campos personalizados, não pede migration):
`area_direito` (select, com as áreas que o escritório atende), `urgencia` (select: Alta/Média/
Baixa), `numero_processo` (text, se já houver processo aberto). `type: date` (ex. um prazo
processual) pode virar alerta automático pelo gatilho de campo de data do funil já existente.

**Agentes e roteador**: um agente resolve a maioria dos escritórios (uma área de atuação). Com
mais de uma área (ex. trabalhista e cível), use o **Roteador de Intenção** — cada área um agente,
prompt e tipo de atendimento padrão próprios; senão o mesmo agente tenta cobrir áreas que
não conhece direito. **Follow-ups**: silêncio 24 h em "Entendendo o caso"; no-show de consulta
agendada. **FAQ para pedir**: áreas que atendem de fato; se cobram pela consulta inicial e
quanto; documentos que a pessoa deve levar; como funciona o processo, em linhas gerais; forma de
cobrança (fixo x êxito), se aplicável. **Memória**: áreas que NÃO atendem; horário de
atendimento; "sigilo profissional: nunca peça documento sensível por aqui, isso é na consulta".
**Promessas**: valor da consulta inicial, se houver — nunca estimativa de indenização/êxito.
**Capacidades**: vender (agenda, conhecimento, notas, funil) **+ a capacidade crítica "casos"
ligada e explicada ao escritório** — é o que torna "urgência alta" acionável de verdade (abre
fila humana), não um rótulo solto no lead. **Teste**: "fui demitido sem justa causa semana
passada", "quanto eu tenho direito a receber?", "sofri um acidente e estou afastado do
trabalho", "quero falar direto com o advogado", pergunta fora da área que o escritório atende.

*Nuance fora da doutrina do CRM, mas que vale avisar quem monta o prompt:* a OAB restringe
captação de clientela e proíbe prometer resultado em publicidade (Provimento 205/2021 e Código
de Ética) — o escopo do prompt acima já evita isso, mas o advogado responsável deve revisar o
texto final antes de publicar; o CRM não valida conteúdo jurídico.

---

## Gráfica rápida ou comunicação visual

**Atenção — este nicho quebra o wizard automático do onboarding.** `MAX_ETAPAS` (tela
`app/onboarding/funil/_client.tsx`) trava o passo "Monte o quadro" em 8 colunas — pensado para
caber na tela do celular. O funil deste nicho tem **10 colunas** porque precisa separar: as 4
sub-fases da triagem (uma por passo do motor do agente — ver nota de cobertura abaixo), mais
"Orçamento" e "Acompanhar" antes do fechamento, mais duas colunas de pós-venda paralelas depois
dele. **Não monte pelo wizard automático.** Monte em `Configurações › Funis` (`/app/settings/`),
que não tem o teto de 8 — crie as 10 colunas na ordem abaixo, marque "Em Produção" como a etapa
de ganho (`is_won`) e "Não fechou" como a de perda (`is_lost`), e mapeie o "passo do agente"
(`agent_stage_hint`) de cada uma das 5 primeiras na tela de tradução do funil
(`lib/leads/agent-mapping.ts` é a régua; a tela mostra os 5 passos e pede a coluna de cada um).

**Funil "Pedidos"** (10 colunas, nesta ordem):

1. **Pedido novo** — passo do agente: `new`. Chegou a mensagem, ninguém respondeu ainda.
2. **Já respondi** — passo do agente: `contacted`. A IA já respondeu, ainda sem dados do pedido.
3. **Levantando dados** — passo do agente: `qualifying`. Coletando largura, altura, material,
   quantidade, prazo, cidade.
4. **Pronto para orçar** — passo do agente: `qualified`. Dados completos; aguardando a equipe
   calcular no sistema de produção da gráfica.
5. **Orçamento** — passo do agente: `negotiating`. A equipe calcula e envia o valor pelo
   WhatsApp; ao enviar, clica a etiqueta "Orçamento enviado" na conversa, o que move o card para
   a próxima coluna. A IA nunca calcula nem promete preço.
6. **Acompanhar** — sem passo do agente (é pós-"negotiating"; o motor não tem um 6º degrau antes
   do fechamento, então esta coluna só é alcançada por clique humano, nunca pelo agente sozinho).
   É aqui que roda o follow-up automático: 1 dia após o orçamento enviado, a IA manda a 1ª
   mensagem; se o cliente responder em tom de "estou analisando", a IA manda uma 2ª mensagem no
   dia 5 (contado sempre a partir do dia do orçamento enviado, não da resposta); se o cliente não
   responder nada à 1ª mensagem, pula direto para o dia 30; no dia 30 sem fechamento, a IA manda
   uma mensagem de encerramento perguntando se ainda há interesse — sem resposta, move
   automaticamente para "Não fechou". Monte isso em *IA › Follow-ups* como um fluxo próprio
   (gatilho: entrou em "Acompanhar"; condições de resposta; os três prazos). Se o cliente disser
   claramente, a qualquer momento depois do orçamento, que não vai fechar (ou que fechou em outro
   lugar), a IA agradece e move para "Não fechou" na hora — não espera os 30 dias.
7. **Em Produção** — passo do agente: `won` (esta é a etapa de ganho do funil, `is_won`). A
   equipe clica a etiqueta "Pedido fechado" na conversa; a IA nunca fecha sozinha.
8. **Pronto para retirada** — sem passo do agente; coluna paralela à 9, não sequencial. Para
   pedidos sem instalação (cartão, flyer, banner simples). Ao mover o card para cá, a IA avisa o
   cliente automaticamente (mensagem cordial com o resumo do material pronto).
9. **Entrega/Instalação** — sem passo do agente; coluna paralela à 8. Para pedidos que precisam
   de instalação (fachada, ACM, adesivo de frota). Ninguém avisa automático aqui — a equipe
   combina data e hora por telefone/pessoalmente; o sistema não guarda agenda, é só um status de
   logística. A equipe escolhe a coluna 8 ou a 9 na hora de mover, conforme o pedido precisa ou
   não de instalação.
10. **Não fechou** — passo do agente: `lost` (etapa de perda, `is_lost`). Alcançada por três
    caminhos: 30 dias de silêncio total depois do orçamento (automático), o cliente dizendo
    claramente que não vai fechar (automático, a IA agradece), ou a equipe clicando a etiqueta à
    mão (manual — neste caso **nenhuma mensagem é enviada**, só o funil muda).

**Vocabulário**: cliente = *cliente*, negócio = *pedido*, ganhou = *em produção*, perdeu =
*não fechou*.

**Campos do funil** (`Configurações › Funis` → campos personalizados, não pede migration):
`descricao` (textarea, o que o cliente precisa — texto livre, sem lista fechada de produtos),
`largura` (number), `altura` (number), `unidade` (select: cm/m), `material` (text, se o cliente
souber), `quantidade` (number), `prazo` (text ou date), `cidade` (text), `precisa_instalacao`
(boolean). Arquivo de referência que o cliente manda (PDF, Corel, JPG) **não vira campo** — fica
na própria conversa do WhatsApp/Inbox, vinculada ao mesmo contato; a equipe abre a conversa para
ver o anexo.

**Prompt (preencha):**

```markdown
# Quem você é
Você atende os clientes de {gráfica}, que trabalha com {gráfica rápida e/ou comunicação visual —
descreva em uma frase}. Fale como atendente da empresa — nunca se apresente como IA, robô ou
assistente virtual, e nunca diga que vai "passar para a equipe" ou "transferir". Se a empresa
não escolheu um nome próprio para você, não invente um.

# O que você faz primeiro
Entenda, uma pergunta por vez, sem formulário: o que a pessoa precisa (deixe em aberto, não
ofereça lista de produtos); largura e altura (pergunte a unidade — cm ou m); material, se a
pessoa souber; quantidade; prazo desejado; cidade e se o produto precisa de instalação; peça o
arquivo de referência se houver (PDF, Corel, JPG) — não insista se a pessoa não tiver; nome e
empresa do cliente.

# Como você decide o próximo passo
- Reuniu os dados principais (o quê, medidas, material ou ausência dele, quantidade, prazo):
  registre e diga que o orçamento chega em breve. Nunca calcule nem cite um valor.
- Faltou só um dado: peça só esse, sem repetir os que já tem.
- Pedido fora do que a gráfica faz: diga com educação que não atendem isso.

# Situações
- "Quanto custa?": explique que o valor depende das medidas e do material, e que assim que tiver
  os dados o orçamento é calculado e enviado — nunca estime ou chute um valor.
- Depois do orçamento enviado, cliente diz que está "pensando" ou "vendo com alguém": registre e
  siga; não insista no mesmo dia.
- Depois do orçamento, cliente diz claramente que não vai fechar ou que fechou em outro lugar:
  agradeça com cordialidade e encerre.

# Limites
Você não calcula nem promete preço final, não promete prazo de produção, não promete data de
entrega ou instalação. Chama uma pessoa quando o pedido é urgente demais para esperar o fluxo
normal, ou quando o cliente pede explicitamente para falar com alguém da equipe.

# Estilo
Curto, direto, uma pergunta por vez, sem jargão técnico de gráfica. Emoji: não, a menos que a
empresa diga o contrário.
```

**Agentes e roteador**: um agente resolve a maioria das gráficas (orçamento e triagem). Separe
em dois só se a gráfica tiver uma linha de produtos muito distinta por canal (ex.: "Impressos" e
"Comunicação visual" com equipes comerciais diferentes) — intenções por palavra-chave do
material citado; fallback = o agente genérico.

**Follow-ups**: não é o modelo padrão da galeria — monte à mão em *IA › Follow-ups* o fluxo de
"Acompanhar" descrito no passo 6 acima (1 dia → 5 dias condicional → 30 dias → move para "Não
fechou"). Publique e ligue no agente (campo *follow-ups que arma*) — sem isso o gatilho automático
não dispara.

**FAQ para pedir**: materiais que trabalham; prazo médio de produção; se fazem instalação e em
quais cidades; formas de pagamento; horário de atendimento; se têm arte/design próprio ou só
imprimem arte pronta.

**Memória**: materiais e produtos que NÃO fazem; cidades onde instalam; horário de
funcionamento; "nunca calcular ou citar preço — isso é sempre a equipe, no orçamento".

**Promessas**: nenhuma — preço e prazo são sempre calculados pela equipe fora do agente.
**Capacidades**: vender (sem agenda — ver nota de instalação no passo 9 do funil acima, que é
só status, não agendamento). **Teste**: "quanto custa um banner de 2x1?", "preciso de um
adesivo para a vitrine", "vocês fazem fachada?", "já mandei as medidas, e aí?", "me manda o
orçamento por favor" (depois de dados incompletos — o agente deve pedir o que falta, não
inventar o orçamento).

---

## Outro tipo de negócio (genérico)

**Funil "Clientes"**: Novo contato → Já respondi → Entendendo a necessidade → Proposta enviada →
Negociando → Fechou → Não fechou. Use o esqueleto de `prompt-do-agente.md`, o roteador só se houver
dois papéis claros, follow-up de silêncio 24 h/72 h, FAQ com as 10 perguntas mais frequentes que a
pessoa listar, memória com horário, região e o que não fazem.

---

## Roteiro de teste — como ler o resultado do botão Testar

Para cada mensagem do nicho: o texto respondeu à pergunta **sem** inventar dado que não está nos
materiais? Fez **uma** pergunta por vez? Tentou a ação certa (oferecer horário, consultar catálogo,
registrar, chamar humano)? Algum portão vetou — e o veto veio do prompt (jargão, promessa)? Anote
o que ajustar no `pacote-<cliente>.md` antes de publicar.
