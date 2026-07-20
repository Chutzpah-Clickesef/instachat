import type { Automation, MatchType } from "./types";

/** Tira acento, deixa minúsculo e colapsa espaços — pra comparar de boa. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A mensagem/comentário casa com a automação?
 * - any: qualquer texto serve (ignora palavras-chave)
 * - exact: o texto inteiro é igual a uma das palavras-chave
 * - contains: o texto contém alguma das palavras-chave
 */
export function textMatches(
  text: string,
  keywords: string[],
  matchType: MatchType,
): boolean {
  const t = normalize(text);
  if (matchType === "any") return t.length > 0;

  const words = keywords.map(normalize).filter(Boolean);
  if (words.length === 0) return false;

  if (matchType === "exact") return words.some((w) => w === t);
  // contains
  return words.some((w) => t.includes(w));
}

type Trigger = "comment" | "story" | "dm";

/**
 * Acha a primeira automação ativa que casa com o evento.
 * @param mediaId  id do post (só relevante em comentários; automações com
 *                 media_id preenchido só valem para aquele post).
 */
export function findMatchingAutomation(
  automations: Automation[],
  trigger: Trigger,
  text: string,
  mediaId?: string | null,
): Automation | null {
  for (const a of automations) {
    if (!a.active) continue;
    if (trigger === "comment" && !a.trigger_comment) continue;
    if (trigger === "story" && !a.trigger_story) continue;
    if (trigger === "dm" && !a.trigger_dm) continue;

    // Post específico: se a automação fixa um media_id, ele precisa bater.
    if (trigger === "comment" && a.media_id && a.media_id !== mediaId) continue;

    if (textMatches(text, a.keywords, a.match_type)) return a;
  }
  return null;
}
