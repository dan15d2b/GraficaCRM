# App mock descontinuado

Os arquivos Next.js, APIs de login mock, `Dockerfile` e `docker-compose.yml` **desta pasta**
eram um protótipo. Eles **não** são o produto.

| Peça antiga | Por que não serve | Substituição |
|---|---|---|
| `app/api/auth/login` com senha no código | inseguro; sem sessão real | Auth do Deskcomm (Supabase) |
| Dashboard com números hardcodados | não lê o banco | `/app` do Deskcomm |
| `docker-compose.yml` (sem `public/`, sem `servers/`) | não sobe | `docker-compose.local.yml` / kit da raiz |
| Schema SQL próprio sem policies corretas | RLS quebrado | `supabase/baseline.sql` do Deskcomm |

**Não apagamos o código de uma vez** para você poder consultar ideias de tela (kanban de produção,
papéis produção/financeiro). A implementação correta dessas jornadas no Deskcomm é:

- Funil + etiquetas + follow-ups → [`pacote-grafica.md`](./pacote-grafica.md)
- Marca CRMGráfica → `APP_NAME` / `APP_ACCENT_HEX` (script `scripts/aplicar-marca.sh`)
- Produção pós-venda → colunas "Em Produção", "Pronto para retirada", "Entrega/Instalação"

Para rodar o sistema, volte ao [`README.md`](./README.md).
