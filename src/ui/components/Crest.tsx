/** The Legends of Loot crest: a shield, a chest, crossed keys, and (of course) a red dot. */
export function Crest({ size = 96 }: { size?: number }) {
  return (
    <svg
      class="crest"
      width={size}
      height={size * 1.1}
      viewBox="0 0 100 110"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M50 4 92 16v32c0 28-18 46-42 58C26 94 8 76 8 48V16z"
        fill="#3d2615"
        stroke="#f0c35a"
        stroke-width="5"
      />
      <path
        d="M50 13 84 22v26c0 22-14 37-34 47C30 85 16 70 16 48V22z"
        fill="#5a3820"
        stroke="#7a5218"
        stroke-width="2"
      />
      <path d="M26 36 74 70M74 36 26 70" stroke="#b9832f" stroke-width="5" stroke-linecap="round" />
      <circle cx="24" cy="34" r="6" fill="none" stroke="#f0c35a" stroke-width="4" />
      <circle cx="76" cy="34" r="6" fill="none" stroke="#f0c35a" stroke-width="4" />
      <rect
        x="32"
        y="50"
        width="36"
        height="24"
        rx="3"
        fill="#7a4a22"
        stroke="#f0c35a"
        stroke-width="3"
      />
      <path d="M32 50c0-10 36-10 36 0z" fill="#8a5a2a" stroke="#f0c35a" stroke-width="3" />
      <rect x="46" y="55" width="8" height="10" rx="2" fill="#f0c35a" />
      <circle cx="84" cy="14" r="11" fill="#e5322d" stroke="#ffd6d4" stroke-width="3" />
      <circle cx="80.5" cy="10.5" r="3.5" fill="#ff8a84" />
    </svg>
  );
}
