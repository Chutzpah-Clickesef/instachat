import "server-only";
import { db } from "./supabase";
import type { AppConfig, ConnectedConfig } from "./types";

/** Lê a linha única de configuração (id = 1). */
export async function getConfig(): Promise<AppConfig | null> {
  const { data, error } = await db
    .from("config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Retorna a config só se o Instagram estiver conectado (token + id). */
export async function getConnectedConfig(): Promise<ConnectedConfig | null> {
  const c = await getConfig();
  if (!c?.access_token || !c.ig_user_id) return null;
  return c as ConnectedConfig;
}

/** Grava/atualiza os dados da conexão após o login. */
export async function saveConfig(patch: Partial<AppConfig>): Promise<void> {
  const { error } = await db
    .from("config")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw error;
}
