import { after } from "next/server";
import { env } from "@/lib/env";
import { isValidSignature } from "@/lib/crypto";
import { processWebhook } from "@/lib/process";
import { drainQueue } from "@/lib/engine";

// Precisa de Node (crypto/HMAC, setTimeout do worker).
export const runtime = "nodejs";

/**
 * Handshake de verificação. A Meta bate aqui com hub.mode/verify_token/challenge
 * quando cadastramos o webhook. Devolvemos o challenge se o token bater.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.webhookVerifyToken) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

/**
 * Recebe os eventos (comments, messages). Valida a assinatura sobre o corpo
 * CRU, enfileira o que for preciso e dispara a drenagem em background para o
 * envio parecer instantâneo (a trava atômica garante que nada saia em dobro).
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!isValidSignature(raw, signature)) {
    return new Response("invalid signature", { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  // Enfileira agora (rápido, só inserts). Se algo falhar, logamos mas ainda
  // respondemos 200 pra Meta não desativar a assinatura por erros repetidos.
  try {
    await processWebhook(body as Parameters<typeof processWebhook>[0]);
  } catch (e) {
    console.error("processWebhook falhou:", e);
  }

  // Drena depois de responder — envio quase instantâneo sem segurar o 200.
  after(async () => {
    try {
      await drainQueue();
    } catch (e) {
      console.error("drainQueue (após webhook) falhou:", e);
    }
  });

  return new Response("EVENT_RECEIVED", { status: 200 });
}
