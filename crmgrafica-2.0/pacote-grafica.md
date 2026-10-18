# Pacote de implantação — Gráfica / Comunicação Visual

Documento para colar nas telas do DeskcommCRM depois do onboarding.
Fonte: guia `deskcomm-cliente-novo` › nicho "Gráfica rápida ou comunicação visual".

Preencha os `{entre chaves}` com os dados da sua gráfica antes de publicar.

---

## 0. Dados do negócio (triagem)

| Campo | Valor |
|---|---|
| Nome da gráfica | `{nome}` |
| O que faz (1 frase) | `{gráfica rápida / comunicação visual / offset — descreva}` |
| Fuso | `America/Sao_Paulo` (ou o seu) |
| Horário de atendimento | `{ex.: seg–sex 8h–18h}` |
| Cidades onde instala | `{lista ou "não fazemos instalação"}` |
| Materiais / serviços que NÃO faz | `{lista}` |
| Formas de pagamento | `{lista}` |
| Tem arte/design próprio? | `{sim/não}` |
| Número WhatsApp (WORKING) | `{já conectado em Conexões}` |

---

## 1. Marca

Já aplicada pelo script `scripts/aplicar-marca.sh` (ou no instalador):

- Nome: **CRMGráfica**
- Cor: `#2563EB`

Ajuste depois em Configurações › aparência / branding da organização, se quiser logo própria.

---

## 2. Funil "Pedidos" — 10 colunas

**Atenção:** não use o wizard do onboarding (máx. 8 colunas). Monte em
**Configurações › Funis** (`/app/settings/`).

Ordem:

| # | Coluna | Passo do agente | Notas |
|---|---|---|---|
| 1 | Pedido novo | `new` | Chegou mensagem |
| 2 | Já respondi | `contacted` | IA respondeu, sem dados |
| 3 | Levantando dados | `qualifying` | Medidas, material, prazo… |
| 4 | Pronto para orçar | `qualified` | Dados ok; equipe calcula |
| 5 | Orçamento | `negotiating` | Equipe envia valor; etiqueta "Orçamento enviado" → próxima |
| 6 | Acompanhar | — | Só clique humano; follow-up automático (abaixo) |
| 7 | Em Produção | `won` | **Ganho** (`is_won`). Etiqueta "Pedido fechado" |
| 8 | Pronto para retirada | — | Paralela à 9; aviso automático ao cliente |
| 9 | Entrega/Instalação | — | Paralela à 8; equipe combina fora do sistema |
| 10 | Não fechou | `lost` | **Perda** (`is_lost`) |

**Vocabulário do funil:**

- cliente → *cliente*
- negócio → *pedido*
- ganhou → *em produção*
- perdeu → *não fechou*

**Campos personalizados** (Configurações › Funis → campos):

| Campo | Tipo |
|---|---|
| `descricao` | textarea |
| `largura` | number |
| `altura` | number |
| `unidade` | select: cm / m |
| `material` | text |
| `quantidade` | number |
| `prazo` | text ou date |
| `cidade` | text |
| `precisa_instalacao` | boolean |

Arquivo de arte (PDF/JPG/Corel) fica na conversa do WhatsApp — não vira campo.

---

## 3. Follow-up "Acompanhar orçamento"

Em **IA › Follow-ups**, monte e **publique** um fluxo:

1. **Gatilho:** card entrou em "Acompanhar"
2. **Dia 1** (após entrar): mensagem pedindo retorno sobre o orçamento
3. Se o cliente responder em tom de "estou analisando" → **dia 5** (contado do orçamento): 2ª mensagem
4. Se não responder nada à 1ª → pular para **dia 30**
5. **Dia 30** sem fechamento: mensagem de encerramento; sem resposta → mover para "Não fechou"
6. Se o cliente disser claramente que não vai fechar → agradecer e ir para "Não fechou" na hora

Ligue este follow-up no agente (campo *follow-ups que arma*).

---

## 4. Agente de atendimento (1 agente)

**IA › Agentes** → rascunho → Testar → (você) Publicar.

### Prompt (cole e preencha)

```markdown
# Quem você é
Você atende os clientes de {nome}, que trabalha com {descrição em uma frase}.
Fale como atendente da empresa — nunca se apresente como IA, robô ou assistente virtual,
e nunca diga que vai "passar para a equipe" ou "transferir". Se a empresa não escolheu
um nome próprio para você, não invente um.

# O que você faz primeiro
Entenda, uma pergunta por vez, sem formulário: o que a pessoa precisa (deixe em aberto,
não ofereça lista de produtos); largura e altura (pergunte a unidade — cm ou m); material,
se a pessoa souber; quantidade; prazo desejado; cidade e se o produto precisa de instalação;
peça o arquivo de referência se houver (PDF, Corel, JPG) — não insista se a pessoa não tiver;
nome e empresa do cliente.

# Como você decide o próximo passo
- Reuniu os dados principais (o quê, medidas, material ou ausência dele, quantidade, prazo):
  registre e diga que o orçamento chega em breve. Nunca calcule nem cite um valor.
- Faltou só um dado: peça só esse, sem repetir os que já tem.
- Pedido fora do que a gráfica faz: diga com educação que não atendem isso.

# Situações
- "Quanto custa?": explique que o valor depende das medidas e do material, e que assim que
  tiver os dados o orçamento é calculado e enviado — nunca estime ou chute um valor.
- Depois do orçamento enviado, cliente diz que está "pensando" ou "vendo com alguém":
  registre e siga; não insista no mesmo dia.
- Depois do orçamento, cliente diz claramente que não vai fechar ou que fechou em outro lugar:
  agradeça com cordialidade e encerre.

# Limites
Você não calcula nem promete preço final, não promete prazo de produção, não promete data
de entrega ou instalação. Chama uma pessoa quando o pedido é urgente demais para esperar o
fluxo normal, ou quando o cliente pede explicitamente para falar com alguém da equipe.

# Estilo
Curto, direto, uma pergunta por vez, sem jargão técnico de gráfica. Emoji: não, a menos
que a empresa diga o contrário.
```

### Capacidades

- Vender / mover funil (sem agenda de instalação — instalação é só status nas colunas 8/9)
- **Não** ligue capacidade de inventar preço

### Canal

O número WhatsApp já em status WORKING.

---

## 5. Base de conhecimento (FAQ)

**IA › Conhecimento** — pares sugeridos:

1. Quais materiais vocês trabalham?
2. Qual o prazo médio de produção?
3. Fazem instalação? Em quais cidades?
4. Formas de pagamento?
5. Horário de atendimento?
6. Vocês fazem arte/design ou só imprimem arte pronta?

Suba também tabela de preços / catálogo em PDF se existir (a IA **consulta**, mas o preço
final do pedido continua sendo da equipe).

---

## 6. Memória da organização

**IA › Memória** (publique):

- Materiais/produtos que NÃO fazem: `{lista}`
- Cidades onde instalam: `{lista}`
- Horário: `{horário}`
- Regra fixa: **nunca calcular ou citar preço — isso é sempre a equipe, no orçamento**

---

## 7. Roteiro de teste (botão Testar)

Antes de publicar, rode estas mensagens no sandbox:

1. "quanto custa um banner de 2x1?"
2. "preciso de um adesivo para a vitrine"
3. "vocês fazem fachada?"
4. "já mandei as medidas, e aí?"
5. "me manda o orçamento por favor" (com dados incompletos — deve pedir o que falta)

Checklist: uma pergunta por vez; não inventou preço; não falou jargão interno.

---

## 8. Checklist de entrega

- [ ] WhatsApp WORKING
- [ ] Funil 10 colunas com ganho/perda corretos
- [ ] Vocabulário pedido/em produção/não fechou
- [ ] Campos do pedido criados
- [ ] Follow-up "Acompanhar" publicado e ligado no agente
- [ ] Agente em rascunho testado; publicado pela pessoa
- [ ] FAQ/memória publicados
- [ ] Marca CRMGráfica visível no login
