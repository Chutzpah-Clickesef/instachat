/**
 * Marca do InstaChat: glifo com o gradiente do Instagram (quadrado arredondado
 * com o monograma "IC") e wordmark em preto Instagram (#262626).
 */
export default function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="ig-logo" x1="2" y1="30" x2="30" y2="2">
            <stop offset="0" stopColor="#F58529" />
            <stop offset="0.35" stopColor="#DD2A7B" />
            <stop offset="0.7" stopColor="#8134AF" />
            <stop offset="1" stopColor="#515BD4" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#ig-logo)" />
        <text
          x="16"
          y="16.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize="14.5"
          fontWeight="800"
          letterSpacing="-0.8"
          style={{
            fontFamily: "var(--font-bricolage), var(--font-jakarta), sans-serif",
          }}
        >
          IC
        </text>
      </svg>
      <span className="font-display text-[19px] font-bold leading-none tracking-tight text-[#262626]">
        InstaChat
      </span>
    </span>
  );
}
