/**
 * Compatibilidade shim — URL do servidor local
 *
 * A partir de 2026, o CRM usa SQLite embutido localmente.
 * Este arquivo mantém compatibilidade com imports antigos.
 */

export const getUrlDoServidor = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

// Aliases para compatibilidade
export const urlDoSupabaseNoServidor = getUrlDoServidor;