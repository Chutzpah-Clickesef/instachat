import "server-only";
import { db } from "./supabase";
import type { OutgoingMessage, Recipient } from "./ig";
import type { Automation, QueueKind } from "./types";
import { buildFollowupSteps } from "./messages";

/** Todas as automações ativas (ordem de criação = ordem de prioridade). */
export async function getActiveAutomations(): Promise<Automation[]> {
  const { data, error } = await db
    .from("automations")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Automation[];
}

/** Cria/atualiza o contato. first_contact_at só na criação. */
export async function upsertContact(
  igUserId: string,
  patch: {
    username?: string | null;
    last_inbound_at?: string | null;
    last_automation_id?: string | null;
  } = {},
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await db.from("contacts").upsert(
    {
      ig_user_id: igUserId,
      first_contact_at: now, // ignorado se já existir (é do insert)
      updated_at: now,
      ...clean(patch),
    },
    { onConflict: "ig_user_id", ignoreDuplicates: false },
  );
  if (error) throw error;
}

function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k as keyof T] = v as T[keyof T];
  }
  return out;
}

type EnqueueInput = {
  kind: QueueKind;
  recipient: Recipient;
  message: OutgoingMessage | { text: string };
  automationId?: string | null;
  contactIgId?: string | null;
  commentId?: string | null;
  requiresOpenWindow?: boolean;
  runAt?: string;
  dedupeKey?: string | null;
};

/**
 * Insere um item na fila. Se bater num índice de dedupe (resposta privada
 * repetida por comentário, ou dedupe_key repetida), a inserção é ignorada em
 * silêncio — é isso que impede envio em dobro na origem.
 * @returns true se inseriu, false se foi deduplicado.
 */
export async function enqueue(input: EnqueueInput): Promise<boolean> {
  const { error } = await db.from("queue").insert({
    kind: input.kind,
    recipient: input.recipient,
    message: input.message,
    automation_id: input.automationId ?? null,
    contact_ig_id: input.contactIgId ?? null,
    comment_id: input.commentId ?? null,
    requires_open_window: input.requiresOpenWindow ?? false,
    run_at: input.runAt ?? new Date().toISOString(),
    dedupe_key: input.dedupeKey ?? null,
  });
  if (error) {
    if (error.code === "23505") return false; // unique_violation = dedupe
    throw error;
  }
  return true;
}

/**
 * Regenera a tabela `followups` para uma automação (chamado ao salvar).
 * A sequência é derivada da automação: link (imediato) + lembrete (por tempo).
 */
export async function syncFollowups(automation: Automation): Promise<void> {
  const steps = buildFollowupSteps(automation);
  await db.from("followups").delete().eq("automation_id", automation.id);
  if (steps.length === 0) return;
  const { error } = await db.from("followups").insert(
    steps.map((s) => ({
      automation_id: automation.id,
      position: s.position,
      delay_seconds: s.delay_seconds,
      label: s.label,
      message: s.message,
    })),
  );
  if (error) throw error;
}

/**
 * Enfileira os follow-ups (link + lembrete) para um contato, lendo a sequência
 * derivada da tabela `followups`. Cada item exige a janela de 24h aberta e
 * respeita o atraso configurado.
 * @param mid  id da mensagem que disparou (usado como base de dedupe).
 */
export async function enqueueFollowups(
  automationId: string,
  contactIgId: string,
  mid: string,
): Promise<void> {
  const { data: steps, error } = await db
    .from("followups")
    .select("*")
    .eq("automation_id", automationId)
    .order("position", { ascending: true });
  if (error) throw error;

  const now = Date.now();
  for (const step of steps ?? []) {
    await enqueue({
      kind: "followup",
      recipient: { id: contactIgId },
      message: step.message,
      automationId,
      contactIgId,
      requiresOpenWindow: true,
      runAt: new Date(now + step.delay_seconds * 1000).toISOString(),
      dedupeKey: `fu:${mid}:${step.position}`,
    });
  }
}
