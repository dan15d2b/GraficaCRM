/**
 * Compatibilidade shim — para uso no browser
 *
 * A partir de 2026, o CRM usa SQLite embutido localmente.
 * Este arquivo mantém compatibilidade com imports antigos.
 */

export const createBrowserClient = () => null;
export const createClient = () => null as unknown as { channel: () => void; getChannels: () => void; removeChannel: () => void; removeAllChannels: () => void };

// Aliases para compatibilidade
export const prepareRealtimeAuthentication = () => {};
export const resetRealtimeAuthentication = () => {};