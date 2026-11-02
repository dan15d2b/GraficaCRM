/**
 * Compatibilidade shim — fetch do servidor local
 *
 * A partir de 2026, o CRM usa SQLite embutido localmente.
 * Este arquivo mantém compatibilidade com imports antigos.
 */

export const fetchFromSupabase = async (url: string, options: RequestInit = {}) => {
  // Para uso local, redireciona para o endpoint local
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
  return fetch(fullUrl, options);
};