import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Cliente do Supabase para uso EXCLUSIVO no servidor.
 *
 * Usa a service_role key, que ignora o RLS. Por isso ele NUNCA pode ser
 * importado em código que roda no navegador. Todas as nossas tabelas têm
 * RLS ligado sem políticas, então este é o único caminho de acesso ao banco.
 */
export const db = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
