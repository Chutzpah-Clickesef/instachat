import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Cliente do Supabase para uso EXCLUSIVO no servidor.
 *
 * Usa a service_role key, que ignora o RLS. Por isso ele NUNCA pode ser
 * importado em código que roda no navegador. Todas as nossas tabelas têm
 * RLS ligado sem políticas, então este é o único caminho de acesso ao banco.
 *
 * É criado de forma preguiçosa (lazy): só instancia na primeira utilização.
 * Assim, importar este módulo não exige as variáveis de ambiente — o `build`
 * funciona sem segredos (útil no CI e pra quem acabou de clonar o projeto).
 */
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const db = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient();
    const value = c[prop as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(c) : value;
  },
});
