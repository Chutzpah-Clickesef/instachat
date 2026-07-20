import Link from "next/link";
import { cookies } from "next/headers";
import { getConfig } from "@/lib/config";
import { PANEL_COOKIE, panelToken } from "@/lib/panel-auth";
import Logo from "./_components/Logo";
import AccountMenu from "./_components/AccountMenu";

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
  const canLogout = authed && !!password;

  return (
    <div className="min-h-full bg-neutral-50 text-[#262626]">
      <div className="ig-gradient h-[3px] w-full" />

      <header className="sticky top-0 z-10 border-b border-[#dbdbdb] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/painel" aria-label="InstaChat — início">
            <Logo />
          </Link>

          {authed ? (
            <AccountMenu
              connected={connected}
              username={config?.username}
              avatarUrl={config?.profile_picture_url}
              canLogout={canLogout}
            />
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
