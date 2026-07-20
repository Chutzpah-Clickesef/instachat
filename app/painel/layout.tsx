import Link from "next/link";
import { getConfig } from "@/lib/config";
import { logoutAction } from "./actions";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getConfig();
  const connected = !!config?.access_token && !!config?.ig_user_id;

  return (
    <div className="min-h-full bg-white text-neutral-900">
      {/* assinatura Instagram no topo */}
      <div className="ig-gradient h-1 w-full" />

      <header className="sticky top-0 z-10 border-b border-neutral-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
          <Link
            href="/painel"
            className="ig-text font-display text-xl font-extrabold tracking-tight"
          >
            InstaChat
          </Link>

          {connected ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-3 shadow-sm">
                {config?.profile_picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.profile_picture_url}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover ring-2 ring-ig-blue/30"
                  />
                ) : (
                  <span className="ig-gradient h-6 w-6 rounded-full" />
                )}
                <span className="font-semibold">@{config?.username}</span>
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-neutral-400 transition-colors hover:text-neutral-700"
                >
                  Sair
                </button>
              </form>
            </div>
          ) : (
            <span className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-neutral-300" />
              não conectado
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
