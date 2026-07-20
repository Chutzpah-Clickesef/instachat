"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  createAutomation,
  updateAutomation,
  deleteAutomation,
  setAutomationActive,
  type AutomationInput,
} from "@/lib/automations";
import { drainQueue } from "@/lib/engine";
import { PANEL_COOKIE, panelToken } from "@/lib/panel-auth";
import type { MatchType } from "@/lib/types";

function bool(fd: FormData, name: string): boolean {
  const v = fd.get(name);
  return v === "on" || v === "true" || v === "1";
}

function str(fd: FormData, name: string): string {
  return (fd.get(name) as string | null)?.trim() ?? "";
}

function strOrNull(fd: FormData, name: string): string | null {
  const v = str(fd, name);
  return v.length ? v : null;
}

/** Quebra por linhas e vírgulas, tira vazios e duplicatas. */
function splitKeywords(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
}

/** Cada variação de resposta pública em uma linha. */
function splitLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildInput(fd: FormData): AutomationInput {
  const minutes = parseInt(str(fd, "reminder_delay_minutes") || "0", 10);
  return {
    name: str(fd, "name") || "Automação sem nome",
    active: bool(fd, "active"),
    trigger_comment: bool(fd, "trigger_comment"),
    trigger_story: bool(fd, "trigger_story"),
    trigger_dm: bool(fd, "trigger_dm"),
    keywords: splitKeywords(str(fd, "keywords")),
    match_type: (str(fd, "match_type") || "contains") as MatchType,
    media_id: strOrNull(fd, "media_id"),
    public_replies: splitLines(str(fd, "public_replies")),
    welcome_message: strOrNull(fd, "welcome_message"),
    quick_reply_label: strOrNull(fd, "quick_reply_label"),
    link_message: strOrNull(fd, "link_message"),
    link_button_label: strOrNull(fd, "link_button_label"),
    link_url: strOrNull(fd, "link_url"),
    reminder_message: strOrNull(fd, "reminder_message"),
    reminder_delay_seconds: Number.isFinite(minutes)
      ? Math.max(0, minutes) * 60
      : 0,
  };
}

export async function saveAutomationAction(fd: FormData) {
  const id = str(fd, "id");
  const input = buildInput(fd);
  if (id) await updateAutomation(id, input);
  else await createAutomation(input);
  revalidatePath("/painel");
  redirect("/painel");
}

export async function toggleAutomationAction(fd: FormData) {
  const id = str(fd, "id");
  const active = bool(fd, "active");
  if (id) await setAutomationActive(id, active);
  revalidatePath("/painel");
}

export async function deleteAutomationAction(fd: FormData) {
  const id = str(fd, "id");
  if (id) await deleteAutomation(id);
  revalidatePath("/painel");
  redirect("/painel");
}

export async function forceDrainAction() {
  await drainQueue();
  revalidatePath("/painel");
}

export async function loginAction(fd: FormData) {
  const password = str(fd, "password");
  const next = str(fd, "next") || "/painel";
  const expected = process.env.PANEL_PASSWORD;

  if (!expected || password !== expected) {
    redirect(`/painel/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(PANEL_COOKIE, await panelToken(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: "/",
  });
  redirect(next);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(PANEL_COOKIE);
  redirect("/painel/login");
}
