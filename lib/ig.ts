import "server-only";
import { env } from "./env";

/**
 * Cliente da API "Instagram com Login do Instagram".
 *
 * Base de dados/mensagens: https://graph.instagram.com/v25.0
 * OAuth (autorização e troca do code): instagram.com / api.instagram.com
 *
 * Não precisa de página do Facebook. O client_id do OAuth é o
 * "ID do app do Instagram" (env.instagramAppId).
 */

export const API_VERSION = "v25.0";
export const GRAPH_BASE = `https://graph.instagram.com/${API_VERSION}`;

// Escopos que o app pede no login.
const SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
].join(",");

// -------------------------------------------------------------------------
// Tipos das mensagens que sabemos enviar
// -------------------------------------------------------------------------

/** Só texto. */
export type TextMessage = { text: string };

/** Texto + botão de resposta rápida (a pessoa toca e isso abre a janela 24h). */
export type QuickReplyMessage = {
  text: string;
  quick_replies: { content_type: "text"; title: string; payload: string }[];
};

/** Template de botão com um link (web_url). */
export type ButtonMessage = {
  attachment: {
    type: "template";
    payload: {
      template_type: "button";
      text: string;
      buttons: { type: "web_url"; url: string; title: string }[];
    };
  };
};

export type OutgoingMessage = TextMessage | QuickReplyMessage | ButtonMessage;

/** Destinatário: por comment_id (resposta privada) ou por id (DM na conversa). */
export type Recipient = { comment_id: string } | { id: string };

// -------------------------------------------------------------------------
// Helpers internos de HTTP
// -------------------------------------------------------------------------

export class InstagramApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "InstagramApiError";
  }
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new InstagramApiError(
      `Instagram API ${res.status}: ${text}`,
      res.status,
      json,
    );
  }
  return json as T;
}

// -------------------------------------------------------------------------
// OAuth / tokens
// -------------------------------------------------------------------------

/** Monta a URL para onde mandamos a pessoa autorizar o app. */
export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.instagramAppId,
    redirect_uri: `${env.appUrl}/api/oauth/callback`,
    response_type: "code",
    scope: SCOPES,
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

/** Troca o "code" do callback por um token curto (~1h) + o user_id. */
export async function exchangeCodeForShortToken(
  code: string,
): Promise<{ access_token: string; user_id: string }> {
  const form = new URLSearchParams({
    client_id: env.instagramAppId,
    client_secret: env.instagramAppSecret,
    grant_type: "authorization_code",
    redirect_uri: `${env.appUrl}/api/oauth/callback`,
    code,
  });
  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  return parse(res);
}

/** Troca o token curto por um token longo de ~60 dias. */
export async function exchangeShortForLongToken(
  shortToken: string,
): Promise<{ access_token: string; token_type: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: env.instagramAppSecret,
    access_token: shortToken,
  });
  const res = await fetch(`${GRAPH_BASE}/access_token?${params.toString()}`);
  return parse(res);
}

/** Renova o token longo (rodamos semanalmente pelo pg_cron). */
export async function refreshLongToken(
  longToken: string,
): Promise<{ access_token: string; token_type: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: longToken,
  });
  const res = await fetch(
    `${GRAPH_BASE}/refresh_access_token?${params.toString()}`,
  );
  return parse(res);
}

// -------------------------------------------------------------------------
// Perfil / assinatura / mídia
// -------------------------------------------------------------------------

export type IgProfile = {
  user_id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
};

/** Dados do perfil conectado. */
export async function getMe(token: string): Promise<IgProfile> {
  const params = new URLSearchParams({
    fields: "user_id,username,name,profile_picture_url",
    access_token: token,
  });
  const res = await fetch(`${GRAPH_BASE}/me?${params.toString()}`);
  return parse(res);
}

/** Assina os webhooks (comments, messages) para a conta. Fazemos no callback. */
export async function subscribeApp(
  igId: string,
  token: string,
): Promise<{ success: boolean }> {
  const form = new URLSearchParams({
    subscribed_fields: "comments,messages",
    access_token: token,
  });
  const res = await fetch(`${GRAPH_BASE}/${igId}/subscribed_apps`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  return parse(res);
}

export type IgMedia = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  caption?: string;
  permalink: string;
};

/** Lista os posts/reels da conta (para o seletor visual no painel). */
export async function getMedia(
  igId: string,
  token: string,
): Promise<{ data: IgMedia[]; paging?: unknown }> {
  const params = new URLSearchParams({
    fields: "id,media_type,media_url,thumbnail_url,caption,permalink",
    access_token: token,
  });
  const res = await fetch(`${GRAPH_BASE}/${igId}/media?${params.toString()}`);
  return parse(res);
}

// -------------------------------------------------------------------------
// Envio de mensagens e respostas de comentário
// -------------------------------------------------------------------------

/**
 * Envia uma mensagem.
 * - recipient { comment_id }: RESPOSTA PRIVADA — fura a janela de 24h (1x por
 *   comentário, em até 7 dias).
 * - recipient { id }: DM normal — só dentro de uma conversa já aberta.
 */
export async function sendMessage(
  igId: string,
  token: string,
  recipient: Recipient,
  message: OutgoingMessage,
): Promise<{ recipient_id?: string; message_id?: string }> {
  const res = await fetch(`${GRAPH_BASE}/${igId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient,
      message,
      access_token: token,
    }),
  });
  return parse(res);
}

/** Resposta PÚBLICA em um comentário (aparece no post). */
export async function replyToComment(
  commentId: string,
  token: string,
  message: string,
): Promise<{ id: string }> {
  const form = new URLSearchParams({ message, access_token: token });
  const res = await fetch(`${GRAPH_BASE}/${commentId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  return parse(res);
}
