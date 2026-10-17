import { useEffect, useState } from 'preact/hooks';
import { formatTime } from '../../share/share';
import { game } from '../game';

const PREFS = [
  'Notify me about notifications',
  'Notify me about achievements',
  'Notify me when a friend is online',
  'Notify me when a friend is offline',
  'Notify me when I change notification preferences',
  'Show red dots',
];

const AVATARS = ['🧙', '🧝', '🧛', '🧟', '🦹', '🤴', '🐸'];

/** Non-notification furniture for some screens, so menus feel like real menus. */
export function SpecialPanel({ path }: { path: string }) {
  switch (path) {
    case 'settings/audio':
      return (
        <div class="panel">
          <label class="toggle">
            <input type="checkbox" checked={!game.muted.value} onChange={() => game.toggleMute()} />
            <span>Sound effects</span>
          </label>
        </div>
      );
    case 'settings/notifications':
      return <Prefs />;
    case 'profile':
      return (
        <div class="panel">
          <p class="panel__label">Choose your avatar</p>
          <div class="avatar-picker" role="radiogroup" aria-label="Avatar">
            {AVATARS.map((a) => (
              <button
                key={a}
                role="radio"
                aria-checked={game.avatar.value === a}
                class={game.avatar.value === a ? 'avatar avatar--on' : 'avatar'}
                onClick={() => game.setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      );
    case 'login':
      return (
        <div class="panel calendar" aria-label="Daily login calendar">
          {Array.from({ length: 28 }, (_, i) => (
            <span key={i} class={i === 0 ? 'cal-day cal-day--claimed' : 'cal-day'}>
              <span class="cal-day__n">{i + 1}</span>
              <span aria-hidden="true">
                {i === 0 ? '✓' : i === 27 ? '👑' : (i + 1) % 7 === 0 ? '🎁' : '🔒'}
              </span>
            </span>
          ))}
        </div>
      );
    default:
      if (path.startsWith('event/')) return <EventBanner />;
      if (path.startsWith('achievements/')) {
        return (
          <div class="panel panel--ach">
            🏆 {game.engine.stats.achievements ?? 0} achievements unlocked · Achievement points:{' '}
            {(game.engine.stats.achievements ?? 0) * 10}
          </div>
        );
      }
      return null;
  }
}

function Prefs() {
  const [wiggle, setWiggle] = useState<number | null>(null);
  return (
    <div class="panel">
      {PREFS.map((p, i) => (
        <label class={`toggle toggle--locked${wiggle === i ? ' shake' : ''}`} key={p}>
          <input
            type="checkbox"
            checked
            onClick={(e) => {
              e.preventDefault();
              setWiggle(i);
              game.emit('touchedPrefs');
            }}
          />
          <span>{p}</span>
          <span class="toggle__soon">Coming soon</span>
        </label>
      ))}
    </div>
  );
}

function EventBanner() {
  const [left, setLeft] = useState(3 * 3600_000 - 1000);
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => Math.max(l - 1000, 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(left / 3600_000);
  return (
    <div class="panel panel--event">
      🎃 Harvest Festival ends in {h}:{formatTime(left % 3600_000).padStart(5, '0')}
    </div>
  );
}
