import { MOEDA_PADRAO } from "@/lib/money";
import { dbQuery } from "@/lib/db/local";

/**
 * A moeda que a organização declarou — a fonte de `catalog_products.moeda`.
 *
 * Versão atualizada: usa o banco local (SQLite / LibSQL) via `lib/db/local.ts`
 * em substituição ao SupabaseClient.
 */
export async function moedaDaOrganizacao(
  _dbOrClient: unknown,
  orgId: string,
): Promise<string> {
  try {
    const result = await dbQuery(
      "SELECT currency FROM organizations WHERE id = ? LIMIT 1",
      [orgId],
    );

    const row = result.rows[0] as { currency?: string | null } | undefined;
    if (row?.currency) return row.currency;
  } catch (error) {
    const motivo = error instanceof Error ? error.message : String(error);
    console.error("[moeda-da-org] erro ao ler moeda da organizacao:", { orgId, motivo });
  }

  return MOEDA_PADRAO;
}
