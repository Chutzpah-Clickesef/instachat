"use client";

import { useEffect, useRef, useState } from "react";
import { logoutAction, disconnectInstagramAction } from "../actions";

type Props = {
  connected: boolean;
  username?: string | null;
  avatarUrl?: string | null;
  canLogout: boolean;
};

const item =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[#262626] transition-colors hover:bg-neutral-100";

export default function AccountMenu({
  connected,
  username,
  avatarUrl,
  canLogout,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2 text-sm transition-colors hover:bg-neutral-100"
      >
        <Avatar connected={connected} avatarUrl={avatarUrl} />
        <span className="font-semibold text-[#262626]">
          {connected ? `@${username}` : "Conta"}
        </span>
        <Chevron open={open} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-60 origin-top-right rounded-xl border border-[#dbdbdb] bg-white p-1.5 shadow-[0_8px_28px_-8px_rgba(0,0,0,0.2)]"
        >
          {connected ? (
            <>
              <div className="px-3 pb-2 pt-1.5 text-xs text-[#8e8e8e]">
                Conectado como <span className="font-semibold">@{username}</span>
              </div>
              <a
                href={`https://instagram.com/${username}`}
                target="_blank"
                rel="noreferrer"
                className={item}
                role="menuitem"
              >
                <IconExternal />
                Ver no Instagram
              </a>
              <form action={disconnectInstagramAction}>
                <button type="submit" className={item} role="menuitem">
                  <IconUnlink />
                  Desconectar Instagram
                </button>
              </form>
            </>
          ) : (
            <a href="/api/oauth/start" className={item} role="menuitem">
              <IconLink />
              Conectar Instagram
            </a>
          )}

          {canLogout ? (
            <>
              <div className="my-1 border-t border-neutral-100" />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className={`${item} text-[#ed4956] hover:bg-red-50`}
                  role="menuitem"
                >
                  <IconExit />
                  Sair do painel
                </button>
              </form>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Avatar({
  connected,
  avatarUrl,
}: {
  connected: boolean;
  avatarUrl?: string | null;
}) {
  if (connected && avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatarUrl}
        alt=""
        className="h-7 w-7 rounded-full object-cover ring-1 ring-[#dbdbdb]"
      />
    );
  }
  if (connected) {
    return <span className="ig-gradient h-7 w-7 rounded-full" />;
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <clipPath id="am-avatar">
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="12" fill="#efefef" />
      <g clipPath="url(#am-avatar)" fill="#b6b6b6">
        <circle cx="12" cy="9.2" r="3.5" />
        <circle cx="12" cy="20.5" r="6.4" />
      </g>
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={`text-[#8e8e8e] transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const icon = "shrink-0 text-[#737373]";

function IconExternal() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={icon} aria-hidden="true">
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUnlink() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={icon} aria-hidden="true">
      <path d="M9 15l6-6M8 7l1-1a4 4 0 0 1 6 6M16 17l-1 1a4 4 0 0 1-6-6M4 4l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={icon} aria-hidden="true">
      <path d="M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconExit() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#ed4956]" aria-hidden="true">
      <path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
