import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PANEL_COOKIE, panelToken } from "@/lib/panel-auth";

// No Next 16 o antigo middleware.ts virou proxy.ts (exporta `proxy`).
// Aqui protegemos o painel e a listagem de posts por senha.

export async function proxy(req: NextRequest) {
  const password = process.env.PANEL_PASSWORD;
  const { pathname } = req.nextUrl;

  const isLogin = pathname === "/painel/login";
  const isProtected =
    (pathname.startsWith("/painel") && !isLogin) ||
    pathname.startsWith("/api/media");

  if (!isProtected) return NextResponse.next();
  // Sem senha configurada => liberado (útil em desenvolvimento local).
  if (!password) return NextResponse.next();

  const cookie = req.cookies.get(PANEL_COOKIE)?.value;
  const expected = await panelToken(password);
  if (cookie && cookie === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/painel/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/painel/:path*", "/api/media/:path*"],
};
