/**
 * Utilidades de tempo.
 *
 * O servidor (Vercel) roda em UTC. Guardamos tudo em UTC no banco, mas quando
 * mostramos horário pra você no painel, travamos em America/Sao_Paulo.
 */

export const SP_TIMEZONE = "America/Sao_Paulo";

/** Formata um instante (Date ou ISO string) no fuso de São Paulo. */
export function formatSaoPaulo(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "short",
    timeStyle: "short",
  },
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SP_TIMEZONE,
    ...options,
  }).format(date);
}

/** Momento atual em ISO (UTC) — o jeito canônico de gravar "agora" no banco. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** ISO de daqui a N segundos — usado para agendar follow-ups e lembretes. */
export function isoInSeconds(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

/** A janela de mensagens padrão do Instagram é de 24 horas. */
export const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;

/** True se ainda estamos dentro da janela de 24h desde a última resposta. */
export function isWithin24hWindow(lastInboundIso: string | null): boolean {
  if (!lastInboundIso) return false;
  return Date.now() - new Date(lastInboundIso).getTime() < MESSAGING_WINDOW_MS;
}
