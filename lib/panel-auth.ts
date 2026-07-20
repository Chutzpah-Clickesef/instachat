// Proteção simples do painel por senha única (app pessoal, 1 usuário).
// Sem "server-only" de propósito: o proxy.ts (edge) também importa daqui.

export const PANEL_COOKIE = "panel_auth";

/** Deriva o token do cookie a partir da senha (SHA-256, Web Crypto). */
export async function panelToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`instachat:${password}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
