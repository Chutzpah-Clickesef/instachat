import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import {
  exchangeCodeForShortToken,
  exchangeShortForLongToken,
  getMe,
  subscribeApp,
} from "@/lib/ig";
import { saveConfig } from "@/lib/config";

export const runtime = "nodejs";

function redirectPainel(params: Record<string, string>) {
  const url = new URL("/painel", env.appUrl);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url);
}

/**
 * Callback do OAuth. Confere o state, troca o code por token curto, depois por
 * token longo (~60 dias), lê o perfil, salva tudo na config e assina os
 * webhooks (comments, messages) para a conta.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return redirectPainel({ error: oauthError });
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("ig_oauth_state")?.value;
  if (!code || !state || state !== savedState) {
    return redirectPainel({ error: "state_invalido" });
  }

  try {
    const short = await exchangeCodeForShortToken(code);
    const long = await exchangeShortForLongToken(short.access_token);
    const me = await getMe(long.access_token);

    const expiresAt = new Date(
      Date.now() + long.expires_in * 1000,
    ).toISOString();

    await saveConfig({
      ig_user_id: me.user_id,
      username: me.username,
      name: me.name ?? null,
      profile_picture_url: me.profile_picture_url ?? null,
      access_token: long.access_token,
      token_expires_at: expiresAt,
    });

    // Assina os webhooks da conta (se falhar, seguimos — dá pra reassinar).
    try {
      await subscribeApp(me.user_id, long.access_token);
    } catch (e) {
      console.error("subscribeApp falhou:", e);
    }

    return redirectPainel({ connected: "1" });
  } catch (e) {
    console.error("OAuth callback falhou:", e);
    return redirectPainel({ error: "falha_conexao" });
  }
}
