import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizeUrl } from "@/lib/ig";

export const runtime = "nodejs";

/**
 * Início do login: gera um `state` (anti-CSRF), guarda num cookie httpOnly e
 * manda a pessoa pra tela de autorização do Instagram.
 */
export async function GET() {
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
