/** Small inline SVG currency icons, so they read as game currency rather than emoji. */
export function CurrencyIcon({ kind }: { kind: string }) {
  return (
    <svg class="cur-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      {ICONS[kind] ?? ICONS.gold}
    </svg>
  );
}

const ICONS: Record<string, preact.JSX.Element> = {
  gold: (
    <>
      <circle cx="10" cy="10" r="9" fill="#9a6a1f" />
      <circle cx="10" cy="10" r="7.4" fill="#f0c35a" />
      <circle cx="10" cy="10" r="5.6" fill="none" stroke="#b9832f" stroke-width="1.2" />
      <path d="M7 12.5V7.5h1.5v3.6H13v1.4z" fill="#8a5a17" />
      <circle cx="7" cy="6.5" r="1.4" fill="#fff4cf" opacity=".8" />
    </>
  ),
  gems: (
    <>
      <path d="M10 1.5 17.5 7 10 18.5 2.5 7z" fill="#2b8fd6" />
      <path d="M10 1.5 13.5 7H6.5z" fill="#8fe0ff" />
      <path d="M2.5 7h4L10 18.5zM17.5 7h-4L10 18.5z" fill="#1b6aa8" />
      <path d="M6.5 7h7L10 18.5z" fill="#4fb6f0" />
    </>
  ),
  dust: (
    <>
      <path d="M10 1 12 8 19 10 12 12 10 19 8 12 1 10 8 8z" fill="#a46bff" />
      <path d="M10 5 11 9 15 10 11 11 10 15 9 11 5 10 9 9z" fill="#e6d4ff" />
    </>
  ),
  tokens: (
    <>
      <path d="M10 1.2 17.6 5.6v8.8L10 18.8 2.4 14.4V5.6z" fill="#b85a14" />
      <path d="M10 3 16 6.5v7L10 17l-6-3.5v-7z" fill="#ff9a3c" />
      <ellipse cx="10" cy="10.5" rx="2.2" ry="4" fill="#ffd34d" />
      <path
        d="M10 14.5c-2-1-3.5-3-3.5-5.5M10 14.5c2-1 3.5-3 3.5-5.5"
        stroke="#4a8a2a"
        stroke-width="1.3"
        fill="none"
      />
    </>
  ),
  xp: (
    <>
      <path
        d="M10 1.5 12.6 7l6 .6-4.5 4 1.3 5.9L10 14.5l-5.4 3 1.3-5.9-4.5-4 6-.6z"
        fill="#f0c35a"
        stroke="#9a6a1f"
        stroke-width="1"
      />
    </>
  ),
  passxp: (
    <>
      <path d="M6 1h8v6l-4 3-4-3z" fill="#5b2bff" />
      <circle cx="10" cy="13" r="5.5" fill="#c08bff" stroke="#5b2bff" stroke-width="1.2" />
      <path
        d="M10 10.2 10.9 12.2l2.1.2-1.6 1.4.5 2.1-1.9-1.1-1.9 1.1.5-2.1-1.6-1.4 2.1-.2z"
        fill="#fff"
      />
    </>
  ),
};

export const CURRENCY_LABELS: Record<string, string> = {
  gold: 'Gold',
  gems: 'Gems',
  dust: 'Dust',
  xp: 'XP',
  passxp: 'Pass XP',
  tokens: 'Harvest Tokens',
};
