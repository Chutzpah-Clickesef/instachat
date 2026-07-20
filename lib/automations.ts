import "server-only";
import { db } from "./supabase";
import { syncFollowups } from "./queue";
import type { Automation, MatchType } from "./types";

/** Campos editáveis de uma automação (o que o formulário manda). */
export type AutomationInput = {
  name: string;
  active: boolean;
  trigger_comment: boolean;
  trigger_story: boolean;
  trigger_dm: boolean;
  keywords: string[];
  match_type: MatchType;
  media_id: string | null;
  public_replies: string[];
  welcome_message: string | null;
  quick_reply_label: string | null;
  link_message: string | null;
  link_button_label: string | null;
  link_url: string | null;
  reminder_message: string | null;
  reminder_delay_seconds: number;
};

export async function listAutomations(): Promise<Automation[]> {
  const { data, error } = await db
    .from("automations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Automation[];
}

export async function getAutomation(id: string): Promise<Automation | null> {
  const { data, error } = await db
    .from("automations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Automation | null;
}

export async function createAutomation(
  input: AutomationInput,
): Promise<Automation> {
  const { data, error } = await db
    .from("automations")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  const automation = data as Automation;
  await syncFollowups(automation);
  return automation;
}

export async function updateAutomation(
  id: string,
  input: AutomationInput,
): Promise<Automation> {
  const { data, error } = await db
    .from("automations")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  const automation = data as Automation;
  await syncFollowups(automation);
  return automation;
}

export async function deleteAutomation(id: string): Promise<void> {
  const { error } = await db.from("automations").delete().eq("id", id);
  if (error) throw error;
}

export async function setAutomationActive(
  id: string,
  active: boolean,
): Promise<void> {
  const { error } = await db
    .from("automations")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
