import { loginAction } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/painel";

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h1 className="text-xl font-semibold">Entrar no painel</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Digite a senha do painel para continuar.
      </p>

      {sp.error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Senha incorreta. Tente de novo.
        </p>
      ) : null}

      <form action={loginAction} className="mt-4 space-y-3">
        <input type="hidden" name="next" value={next} />
        <input
          type="password"
          name="password"
          placeholder="Senha"
          autoFocus
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-pink-500 dark:border-neutral-700 dark:bg-neutral-800"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
