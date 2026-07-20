import { env } from "@/lib/env";
import { getConnectedConfig, saveConfig } from "@/lib/config";
import { refreshLongToken } from "@/lib/ig";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  return req.headers.get("authorization") === `Bearer ${env.cronSecret}`;
}

/**
 * Renova o token longo (~60 dias). Chamado pelo pg_cron uma vez por semana.
 * Renovar cedo e com frequência evita o token expirar.
 */
async function handle(req: Request) {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });

  const config = await getConnectedConfig();
  if (!config) return Response.json({ refreshed: false, reason: "sem_conexao" });

  try {
    const r = await refreshLongToken(config.access_token);
    const expiresAt = new Date(Date.now() + r.expires_in * 1000).toISOString();
    await saveConfig({
      access_token: r.access_token,
      token_expires_at: expiresAt,
    });
    return Response.json({ refreshed: true, expires_at: expiresAt });
  } catch (e) {
    console.error("refresh token falhou:", e);
    return Response.json(
      { refreshed: false, reason: "erro", detail: String(e) },
      { status: 500 },
    );
  }
}

export const POST = handle;
export const GET = handle;
