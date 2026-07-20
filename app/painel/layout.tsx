import Link from "next/link";
import { cookies } from "next/headers";
import { getConfig } from "@/lib/config";
import { PANEL_COOKIE, panelToken } from "@/lib/panel-auth";
import { logoutAction } from "./actions";
import Logo from "./_components/Logo";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getConfig();
  const connected = !!config?.access_token && !!config?.ig_user_id;

  const password = process.env.PANEL_PASSWORD;
  const cookieStore = await cookies();
  const cookie = cookieStore.get(PANEL_COOKIE)?.value;
  const authed = password ? cookie === (await panelToken(password)) : true;
  const showSair = authed && !!password;

  return (
    <div className="min-h-full bg-neutral-50 text-[#262626]">
      <div className="ig-gradient h-[3px] w-full" />

      <header className="sticky top-0 z-10 border-b border-[#dbdbdb] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/painel" aria-label="InstaChat — início">
            <Logo />
          </Link>

          {authed ? (
            <div className="flex items-center gap-1 sm:gap-3">
              {connected ? (
                <span className="flex items-center gap-2 text-sm">
                  {config?.profile_picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={config.profile_picture_url}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover ring-1 ring-[#dbdbdb]"
                    />
                  ) : (
                    <span className="ig-gradient h-7 w-7 rounded-full" />
                  )}
                  <span className="font-semibold">@{config?.username}</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 text-[13px] font-medium text-[#737373]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400/60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  Sem conta conectada
                </span>
              )}

              {showSair ? (
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#737373] transition-colors hover:bg-neutral-100 hover:text-[#262626]"
                  >
                    Sair
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
