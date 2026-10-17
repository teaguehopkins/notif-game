import { game, useEngine } from '../game';

const LEAVES = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 1.3) % 9,
  dur: 7 + ((i * 7) % 6),
  leaf: i % 3 ? '🍂' : '🍁',
}));

/**
 * Decorative layers over the launcher: the red vignette that creeps in as dots pile up, autumn
 * leaves during the festival, the LEVEL UP banner, and the Inbox Zero moment. None of it takes
 * pointer events, and screen readers skip it (the notifications themselves say the same things).
 */
export function Ambience() {
  const e = useEngine();
  const zen = game.screen.value === 'zen';
  const pressure = zen ? 0 : Math.min(Math.max((e.activeCount - 8) / 32, 0), 1);
  const festival = !zen && e.phase === 'main' && e.hasFired('event_begins');
  const banner = game.levelBanner.value;
  return (
    <div class="ambience" aria-hidden="true">
      <div class="vignette" style={{ opacity: pressure * 0.9 }} />
      {festival && (
        <div class="leaves">
          {LEAVES.map((l, i) => (
            <span
              key={i}
              class="leaf"
              style={{
                left: `${l.left}%`,
                // Negative delays: the leaves are already falling when the festival starts.
                animationDelay: `-${l.delay}s`,
                animationDuration: `${l.dur}s`,
              }}
            >
              {l.leaf}
            </span>
          ))}
        </div>
      )}
      {banner && (
        <div class="levelup" key={banner.key}>
          <span class="levelup__text">LEVEL UP!</span>
          <span class="levelup__n">{banner.level}</span>
        </div>
      )}
      {game.zeroMoment.value && (
        <div class="zero-moment">
          <span class="zero-moment__dot">
            <span class="zero-moment__zero">0</span>
            <span class="zero-moment__inf">∞</span>
          </span>
          <span class="zero-moment__text">Inbox Zero</span>
        </div>
      )}
    </div>
  );
}
