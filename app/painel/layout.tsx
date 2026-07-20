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
    <div className="min-h-full bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/painel" className="text-lg font-bold tracking-tight">
            Insta<span className="text-pink-600">Chat</span>
          </Link>

          {connected ? (
            <div className="flex items-center gap-3 text-sm">
              {config?.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.profile_picture_url}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : null}
              <span className="font-medium">@{config?.username}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  Sair
                </button>
              </form>
            </div>
          ) : (
            <a
              href="/api/oauth/start"
              className="rounded-full bg-pink-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-700"
            >
              Conectar Instagram
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
