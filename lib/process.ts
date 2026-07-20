import "server-only";
import { db } from "./supabase";
import { getConnectedConfig } from "./config";
import {
  getActiveAutomations,
  upsertContact,
  enqueue,
  enqueueFollowups,
} from "./queue";
import { findMatchingAutomation } from "./matching";
import {
  buildWelcomeMessage,
  pickPublicReply,
  parseQuickReplyPayload,
} from "./messages";
import type { Automation, ConnectedConfig } from "./types";

// Formas cruas dos eventos da Meta (só os campos que usamos).
type CommentValue = {
  id: string;
  text?: string;
  from?: { id?: string; username?: string };
  media?: { id?: string };
};

type MessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    quick_reply?: { payload?: string };
    reply_to?: { story?: { id?: string } };
  };
};

type WebhookBody = {
  object?: string;
  entry?: {
    id?: string;
    changes?: { field?: string; value?: CommentValue }[];
    messaging?: MessagingEvent[];
  }[];
};

/**
 * Processa um payload de webhook já verificado (assinatura OK). Sempre loga o
 * evento cru em `events`; depois roteia comentários e mensagens.
 */
export async function processWebhook(body: WebhookBody): Promise<void> {
  const config = await getConnectedConfig();

  await db.from("events").insert({
    type: body?.object ?? "unknown",
    ig_user_id: config?.ig_user_id ?? null,
    payload: body as unknown,
  });

  if (!config) return; // sem Instagram conectado, não há o que fazer

  const automations = await getActiveAutomations();

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field === "comments" && change.value) {
        await handleComment(config, automations, change.value);
      }
    }
    for (const event of entry.messaging ?? []) {
      await handleMessaging(config, automations, event);
    }
  }
}

/** Comentário que casa a palavra-chave -> resposta privada (+ pública). */
async function handleComment(
  config: ConnectedConfig,
  automations: Automation[],
  value: CommentValue,
): Promise<void> {
  const commenterId = value.from?.id;
  const commentId = value.id;
  const text = value.text ?? "";
  const mediaId = value.media?.id ?? null;

  // Ignora comentários da própria conta (evita loop com nossas respostas).
  if (!commenterId || !commentId || commenterId === config.ig_user_id) return;

  const automation = findMatchingAutomation(
    automations,
    "comment",
    text,
    mediaId,
  );
  if (!automation) return;

  await upsertContact(commenterId, {
    username: value.from?.username ?? null,
    last_automation_id: automation.id,
  });

  // Resposta PRIVADA (fura a janela de 24h). Dedupe por comment_id no índice.
  await enqueue({
    kind: "private_reply",
    recipient: { comment_id: commentId },
    message: buildWelcomeMessage(automation),
    automationId: automation.id,
    contactIgId: commenterId,
    commentId,
  });

  // Resposta PÚBLICA opcional (sorteia entre variações).
  const publicText = pickPublicReply(automation);
  if (publicText) {
    await enqueue({
      kind: "public_reply",
      recipient: { comment_id: commentId },
      message: { text: publicText },
      automationId: automation.id,
      commentId,
      dedupeKey: `pub:${commentId}`,
    });
  }
}

/** Mensagens: toque no botão, resposta de story ou DM comum. */
async function handleMessaging(
  config: ConnectedConfig,
  automations: Automation[],
  event: MessagingEvent,
): Promise<void> {
  const senderId = event.sender?.id;
  const msg = event.message;
  if (!senderId || !msg) return;
  if (msg.is_echo) return; // eco das nossas próprias mensagens
  if (senderId === config.ig_user_id) return;

  const mid = msg.mid ?? globalThis.crypto.randomUUID();

  // Toda mensagem recebida (não-eco) abre/renova a janela de 24h.
  await upsertContact(senderId, { last_inbound_at: new Date().toISOString() });

  // 1) Tocou no botão de resposta rápida -> libera os follow-ups.
  const qrPayload = msg.quick_reply?.payload;
  if (qrPayload) {
    const automationId = parseQuickReplyPayload(qrPayload);
    if (automationId) {
      await upsertContact(senderId, { last_automation_id: automationId });
      await enqueueFollowups(automationId, senderId, mid);
      return;
    }
  }

  const text = msg.text ?? "";

  // 2) Resposta a um story.
  if (msg.reply_to?.story) {
    const automation = findMatchingAutomation(automations, "story", text);
    if (automation) await sendWelcome(automation, senderId, mid);
    return;
  }

  // 3) DM comum.
  if (text) {
    const automation = findMatchingAutomation(automations, "dm", text);
    if (automation) await sendWelcome(automation, senderId, mid);
  }
}

/** Enfileira a DM de boas-vindas (conversa já aberta, então pode). */
async function sendWelcome(
  automation: Automation,
  senderId: string,
  mid: string,
): Promise<void> {
  await upsertContact(senderId, { last_automation_id: automation.id });
  await enqueue({
    kind: "welcome_dm",
    recipient: { id: senderId },
    message: buildWelcomeMessage(automation),
    automationId: automation.id,
    contactIgId: senderId,
    dedupeKey: `wd:${mid}`,
  });
}
