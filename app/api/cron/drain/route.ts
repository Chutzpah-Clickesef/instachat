import { env } from "@/lib/env";
import { drainQueue } from "@/lib/engine";

export const runtime = "nodejs";
export const maxDuration = 30;

function authorized(req: Request): boolean {
  return req.headers.get("authorization") === `Bearer ${env.cronSecret}`;
}

/**
 * Drena a fila. Chamado pelo pg_cron do Supabase a cada minuto (via pg_net).
 * Protegido pelo CRON_SECRET.
 */
async function handle(req: Request) {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });
  const result = await drainQueue();
  return Response.json(result);
}

export const POST = handle;
export const GET = handle;
