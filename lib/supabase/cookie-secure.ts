/**
 * Compatibilidade shim — cookies seguros locais
 *
 * A partir de 2026, o CRM usa SQLite embutido localmente.
 * Este arquivo mantém compatibilidade com imports antigos.
 */

export const setCookieSecure = () => {};
export const getCookieSecure = () => null;