import "server-only";
import { db } from "./supabase";
import { getConnectedConfig } from "./config";
import {
  sendMessage,
  replyToComment,
  InstagramApiError,
  type OutgoingMessage,
  type Recipient,
} from "./ig";
import { isWithin24hWindow } from "./time";

// Limites práticos para não derrubar a conta.
const BATCH_SIZE = 8; // itens por drenagem
const SEND_SPACING_MS = 500; // ~2 por segundo
const HOURLY_CAP = 200; // ~200 DMs automáticas por hora
const MAX_ATTEMPTS = 3; // tentativas antes de marcar 'failed'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type QueueRow = {
  id: string;
  kind: "private_reply" | "public_reply" | "welcome_dm" | "followup";
  recipient: Recipient;
  message: OutgoingMessage & { text?: string };
  comment_id: string | null;
  contact_ig_id: string | null;
  requires_open_window: boolean;
  attempts: number;
};

/**
 * Drena a fila: pega um lote com trava atômica e envia respeitando os limites.
 * Idempotente e seguro pra rodar em paralelo (SKIP LOCKED impede envio duplo).
 */
export async function drainQueue(): Promise<{
  sent: number;
  skipped: number;
  failed: number;
  reason?: string;
}> {
  // Devolve à fila itens presos em 'sending' (worker que morreu no meio).
  await db.rpc("requeue_stale");

  const config = await getConnectedConfig();
  if (!config) return { sent: 0, skipped: 0, failed: 0, reason: "sem_conexao" };

  // Teto por hora: conta o que já saiu na última hora.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: sentLastHour } = await db
    .from("queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("updated_at", oneHourAgo);
  if ((sentLastHour ?? 0) >= HOURLY_CAP) {
    return { sent: 0, skipped: 0, failed: 0, reason: "teto_horario" };
  }

  const { data: batch, error } = await db.rpc("claim_queue", {
    batch_size: BATCH_SIZE,
  });
  if (error) throw error;

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of (batch ?? []) as QueueRow[]) {
    // Itens que dependem da janela de 24h: só enviam se o contato respondeu
    // nas últimas 24h. Caso contrário, marcamos 'skipped'.
    if (item.requires_open_window && item.contact_ig_id) {
      const { data: contact } = await db
        .from("contacts")
        .select("last_inbound_at")
        .eq("ig_user_id", item.contact_ig_id)
        .maybeSingle();
      if (!isWithin24hWindow(contact?.last_inbound_at ?? null)) {
        await mark(item.id, "skipped");
        skipped++;
        continue;
      }
    }

    try {
      if (item.kind === "public_reply") {
        await replyToComment(
          item.comment_id!,
          config.access_token,
          item.message.text ?? "",
        );
      } else {
        await sendMessage(
          config.ig_user_id,
          config.access_token,
          item.recipient,
          item.message,
        );
      }
      await mark(item.id, "sent");
      sent++;
    } catch (e) {
      const attempts = item.attempts + 1;
      const msg = e instanceof Error ? e.message : String(e);
      // Erros 4xx (fora rate limit) dificilmente melhoram com retry.
      const permanent =
        e instanceof InstagramApiError &&
        e.status >= 400 &&
        e.status < 500 &&
        e.status !== 429;
      if (permanent || attempts >= MAX_ATTEMPTS) {
        await mark(item.id, "failed", attempts, msg);
        failed++;
      } else {
        // Volta pra fila pra tentar de novo na próxima drenagem.
        await mark(item.id, "pending", attempts, msg);
      }
    }

    await sleep(SEND_SPACING_MS);
  }

  return { sent, skipped, failed };
}

async function mark(
  id: string,
  status: "sent" | "failed" | "skipped" | "pending",
  attempts?: number,
  lastError?: string,
): Promise<void> {
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "pending") patch.claimed_at = null;
  if (attempts !== undefined) patch.attempts = attempts;
  if (lastError !== undefined) patch.last_error = lastError.slice(0, 500);
  await db.from("queue").update(patch).eq("id", id);
}
