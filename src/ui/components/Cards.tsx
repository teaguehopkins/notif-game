import type { Rarity } from '../../engine/types';

/** A stable small hash, so the same card always gets the same colors and cost. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The card's name from its notification title ("NEW: Badge Golem" -> "Badge Golem"). */
export function cardName(title: string): string {
  const dupe = /^Duplicate: ([^.]+)/.exec(title);
  if (dupe) return dupe[1]!;
  return title.replace(/^NEW( [\w ]+)?: /, '');
}

interface FaceProps {
  name: string;
  icon?: string;
  rarity?: Rarity;
  /** Card text, which may name its mana cost ("3 mana 2/4"). */
  text?: string;
  small?: boolean;
  stamp?: string;
}

/** A collectible card: a rarity frame, a mana gem, and procedurally tinted portrait art. */
export function CardFace({ name, icon, rarity = 'common', text, small, stamp }: FaceProps) {
  const h = hash(name);
  const mana = /(\d+) mana/.exec(text ?? '')?.[1] ?? String(h % 10);
  return (
    <span
      class={`card card--${rarity}${small ? ' card--small' : ''}`}
      style={{ '--hue': h % 360, '--hue2': (h >> 9) % 360 }}
      aria-hidden="true"
    >
      <span class="card__art">
        <span class="card__glyph">{icon ?? '🃏'}</span>
      </span>
      <span class="card__mana">{mana}</span>
      {!small && <span class="card__name">{name}</span>}
      <span class="card__gem" />
      {stamp && <span class="card__stamp">{stamp}</span>}
    </span>
  );
}

const BACKS = ['classic', 'ember', 'frost', 'wood', 'red', 'season'] as const;
export type BackVariant = (typeof BACKS)[number];

/** Which pattern a card back gets, from its name. */
export function backVariant(title: string): BackVariant {
  const t = title.toLowerCase();
  if (t.includes('ember')) return 'ember';
  if (t.includes('classic')) return 'classic';
  if (t.includes('season')) return 'season';
  if (t.includes('inbox') || t.includes('notification')) return 'red';
  return BACKS[hash(title) % BACKS.length]!;
}

export function CardBack({
  variant = 'classic',
  small,
}: {
  variant?: BackVariant;
  small?: boolean;
}) {
  return (
    <span
      class={`card-back card-back--${variant}${small ? ' card-back--small' : ''}`}
      aria-hidden="true"
    >
      <span class="card-back__seal" />
    </span>
  );
}
