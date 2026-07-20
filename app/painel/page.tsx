import Link from "next/link";
import { getConfig } from "@/lib/config";
import { listAutomations } from "@/lib/automations";
import { db } from "@/lib/supabase";
import { formatSaoPaulo } from "@/lib/time";
import {
  toggleAutomationAction,
  forceDrainAction,
} from "./actions";

async function queueStats() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [{ count: pending }, { count: sentHour }, { count: failed }] =
    await Promise.all([
      db
        .from("queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      db
        .from("queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("updated_at", oneHourAgo),
      db
        .from("queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed"),
    ]);
  return { pending: pending ?? 0, sentHour: sentHour ?? 0, failed: failed ?? 0 };
}

const MATCH_LABEL: Record<string, string> = {
  contains: "contém",
  exact: "exato",
  any: "qualquer",
};

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const config = await getConfig();
  const connected = !!config?.access_token && !!config?.ig_user_id;
  const automations = await listAutomations();
  const stats = await queueStats();

  return (
    <div className="space-y-6">
      {sp.connected ? (
        <Banner tone="ok">
          Instagram conectado como <b>@{config?.username}</b>. Tudo pronto! 🎉
        </Banner>
      ) : null}
      {sp.error ? (
        <Banner tone="err">
          Falha ao conectar ({sp.error}). Tente de novo em “Conectar Instagram”.
        </Banner>
      ) : null}

      {!connected ? (
        <div className="rounded-2xl border border-pink-200 bg-pink-50 p-6 dark:border-pink-900 dark:bg-pink-950/40">
          <h2 className="text-lg font-semibold">Conecte seu Instagram</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            Para as automações funcionarem, conecte a conta profissional que
            você quer automatizar.
          </p>
          <a
            href="/api/oauth/start"
            className="mt-4 inline-block rounded-full bg-pink-600 px-5 py-2 text-sm font-medium text-white hover:bg-pink-700"
          >
            Conectar Instagram
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Na fila" value={stats.pending} />
          <Stat label="Enviadas (1h)" value={`${stats.sentHour}/200`} />
          <Stat label="Falhas" value={stats.failed} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Automações</h1>
        <div className="flex items-center gap-2">
          {connected ? (
            <form action={forceDrainAction}>
              <button
                type="submit"
                className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                Forçar envio
              </button>
            </form>
          ) : null}
          <Link
            href="/painel/nova"
            className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            + Nova automação
          </Link>
        </div>
      </div>

      {automations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700">
          Nenhuma automação ainda. Crie a primeira em “+ Nova automação”.
        </p>
      ) : (
        <ul className="space-y-3">
          {automations.map((a) => {
            const triggers = [
              a.trigger_comment && "comentário",
              a.trigger_story && "story",
              a.trigger_dm && "DM",
            ].filter(Boolean);
            return (
              <li
                key={a.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          a.active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                        }`}
                      >
                        {a.active ? "ativa" : "pausada"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      Gatilhos: {triggers.join(", ") || "—"} · Palavras (
                      {MATCH_LABEL[a.match_type]}):{" "}
                      {a.keywords.length ? a.keywords.join(", ") : "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Atualizada em {formatSaoPaulo(a.updated_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <form action={toggleAutomationAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={a.active ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="rounded-full border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      >
                        {a.active ? "Pausar" : "Ativar"}
                      </button>
                    </form>
                    <Link
                      href={`/painel/editar/${a.id}`}
                      className="rounded-full border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "ok" | "err";
  children: React.ReactNode;
}) {
  const cls =
    tone === "ok"
      ? "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300"
      : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300";
  return <div className={`rounded-xl px-4 py-3 text-sm ${cls}`}>{children}</div>;
}
