import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizeUrl } from "@/lib/ig";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Início do login: gera um `state` (anti-CSRF), guarda num cookie httpOnly e
 * manda a pessoa pra tela de autorização do Instagram.
 */
export async function GET() {
  // App da Meta ainda não configurado (self-host sem INSTAGRAM_APP_ID).
  // Em vez de estourar 500, volta ao painel com um aviso claro.
  if (!process.env.INSTAGRAM_APP_ID || !process.env.INSTAGRAM_APP_SECRET) {
    return NextResponse.redirect(
      new URL("/painel?error=meta_nao_configurada", env.appUrl),
    );
  }

  const state = globalThis.crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 min
    path: "/",
  });

  return NextResponse.redirect(buildAuthorizeUrl(state));
}
