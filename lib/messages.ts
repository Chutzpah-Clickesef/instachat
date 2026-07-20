import type { OutgoingMessage } from "./ig";
import type { Automation } from "./types";

/**
 * Prefixo do payload do botão de resposta rápida. Quando a pessoa toca no
 * botão, a Meta devolve esse payload no webhook — é assim que sabemos qual
 * automação disparou e que a janela de 24h abriu.
 */
export const QUICK_REPLY_PREFIX = "AUTO:";

export function quickReplyPayload(automationId: string): string {
  return `${QUICK_REPLY_PREFIX}${automationId}`;
}

export function parseQuickReplyPayload(payload: string): string | null {
  if (!payload.startsWith(QUICK_REPLY_PREFIX)) return null;
  return payload.slice(QUICK_REPLY_PREFIX.length) || null;
}

/** Sorteia uma das variações de resposta pública. */
export function pickPublicReply(automation: Automation): string | null {
  const list = automation.public_replies.filter(Boolean);
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * DM de boas-vindas. Se houver rótulo de botão de resposta rápida, mandamos
 * texto + botão (o toque abre a janela de 24h e libera os follow-ups). Senão,
 * só o texto.
 */
export function buildWelcomeMessage(automation: Automation): OutgoingMessage {
  const text = automation.welcome_message?.trim() || "Oi! 👋";
  if (automation.quick_reply_label?.trim()) {
    return {
      text,
      quick_replies: [
        {
          content_type: "text",
          title: automation.quick_reply_label.trim().slice(0, 20),
          payload: quickReplyPayload(automation.id),
        },
      ],
    };
  }
  return { text };
}

/** A DM com o link — template de botão se tiver url, senão texto puro. */
export function buildLinkMessage(automation: Automation): OutgoingMessage | null {
  const text = automation.link_message?.trim();
  if (!text) return null;
  if (automation.link_url?.trim()) {
    return {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text,
          buttons: [
            {
              type: "web_url",
              url: automation.link_url.trim(),
              title: (automation.link_button_label?.trim() || "Abrir link").slice(
                0,
                20,
              ),
            },
          ],
        },
      },
    };
  }
  return { text };
}

export type FollowupStep = {
  position: number;
  delay_seconds: number;
  label: string;
  message: OutgoingMessage;
};

/**
 * Deriva a sequência de follow-ups da automação: a DM com o link (imediata,
 * assim que a pessoa toca no botão) e, opcionalmente, o lembrete por tempo.
 * É isso que gravamos na tabela `followups`.
 */
export function buildFollowupSteps(automation: Automation): FollowupStep[] {
  const steps: FollowupStep[] = [];

  const link = buildLinkMessage(automation);
  if (link) {
    steps.push({ position: 0, delay_seconds: 0, label: "link", message: link });
  }

  const reminderText = automation.reminder_message?.trim();
  if (reminderText) {
    steps.push({
      position: steps.length,
      delay_seconds: Math.max(0, automation.reminder_delay_seconds || 0),
      label: "lembrete",
      message: { text: reminderText },
    });
  }

  return steps;
}
