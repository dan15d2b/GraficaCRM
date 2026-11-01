import { invoke } from "@tauri-apps/api/core";

export type SetupStatus = {
  configured: boolean;
  data_dir: string;
  config_dir: string;
};

export type SessionUser = {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  role: string;
};

export function setupStatus() {
  return invoke<SetupStatus>("setup_status");
}

export function setupComplete(input: Record<string, string>) {
  return invoke<{ organization_id: string; user_id: string }>("setup_complete", { input });
}

export function loginLocal(email: string, password: string) {
  return invoke<SessionUser>("login_local", { input: { email, password } });
}

export function sqliteInit(dataDir: string) {
  return invoke<{ success: boolean; path: string }>("sqlite_init", { dataDir });
}

export function sqliteQuery<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return invoke<T[]>("sqlite_query", { sql, params });
}

export function sqliteExecute(sql: string, params: unknown[] = []) {
  return invoke<{ changes: number }>("sqlite_execute", { sql, params });
}
