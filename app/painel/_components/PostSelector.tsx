"use client";

import { useState } from "react";

type Media = {
  id: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  caption?: string;
  permalink: string;
};

export default function PostSelector({
  defaultValue,
}: {
  defaultValue: string | null;
}) {
  const [selected, setSelected] = useState<string | null>(defaultValue);
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/media");
      const json = await res.json();
      if (json.error === "nao_conectado") {
        setError("Conecte o Instagram primeiro para escolher um post.");
      } else if (json.error) {
        setError("Não consegui carregar os posts agora.");
      } else {
        setItems(json.data ?? []);
      }
    } catch {
      setError("Não consegui carregar os posts agora.");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  return (
    <div>
      {/* valor enviado no formulário */}
      <input type="hidden" name="media_id" value={selected ?? ""} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className={`rounded-full border px-3 py-1 text-xs ${
            selected === null
              ? "border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-950/40"
              : "border-neutral-300 dark:border-neutral-700"
          }`}
        >
          Qualquer post
        </button>
        {!loaded ? (
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {loading ? "Carregando…" : "Escolher um post específico"}
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

      {items.length > 0 ? (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {items.map((m) => {
            const img = m.thumbnail_url || m.media_url;
            const isSel = selected === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m.id)}
                title={m.caption ?? ""}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                  isSel ? "border-pink-500" : "border-transparent"
                }`}
              >
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-200 text-[10px] dark:bg-neutral-800">
                    {m.media_type}
                  </div>
                )}
                {isSel ? (
                  <span className="absolute right-1 top-1 rounded-full bg-pink-600 px-1 text-[10px] text-white">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {selected ? (
        <p className="mt-2 text-xs text-neutral-500">
          Post selecionado: <code>{selected}</code>
        </p>
      ) : (
        <p className="mt-2 text-xs text-neutral-500">
          Vale para comentários em qualquer post.
        </p>
      )}
    </div>
  );
}
