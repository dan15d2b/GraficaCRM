/**
 * Compatibilidade shim — operações em lote locais
 *
 * A partir de 2026, o CRM usa SQLite embutido localmente.
 * Este arquivo mantém compatibilidade com imports antigos.
 */

export const executeBatch = async <T>(operations: T[]): Promise<T[]> => operations;