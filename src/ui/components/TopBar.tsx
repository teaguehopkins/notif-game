import { XP_PER_LEVEL } from '../../engine/engine';
import { formatTime } from '../../share/share';
import { game, useEngine } from '../game';
import { Badge } from './Badge';

const CURRENCIES = [
  { key: 'gold', icon: '🪙', label: 'Gold' },
  { key: 'gems', icon: '💎', label: 'Gems' },
  { key: 'dust', icon: '✨', label: 'Dust' },
  { key: 'tokens', icon: '🌽', label: 'Harvest Tokens' },
];

export function TopBar() {
  useEngine();
  const clock = game.clock.value;
  const e = game.engine;
  const s = e.stats;
  const zen = game.screen.value === 'zen';
  const level = s.level ?? 1;
  const xpPct = (((s.xp ?? 0) % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
  const time = game.zeroAtMs.value || clock;

  return (
    <header class="topbar">
      <button class="profile-chip" onClick={() => game.navigate('profile')}>
        <span class="profile-chip__avatar" aria-hidden="true">
          {game.avatar.value}
        </span>
        <span class="profile-chip__level">
          <span class="sr-only">Profile, level </span>
          <span aria-hidden="true">Lv </span>
          {level}
        </span>
        <span class="xp-bar" aria-hidden="true">
          <span class="xp-bar__fill" style={{ width: `${xpPct}%` }} />
        </span>
        <Badge count={e.countUnder('profile')} />
      </button>

      <div class="currencies" role="group" aria-label="Currencies">
        {CURRENCIES.filter((c) => c.key === 'gold' || (s[c.key] ?? 0) > 0).map((c) => (
          <span class="currency" key={c.key} title={c.label}>
            <span aria-hidden="true">{c.icon}</span> {s[c.key] ?? 0}
            <span class="sr-only"> {c.label}</span>
          </span>
        ))}
      </div>

      <div class="hud" role="group" aria-label="Run stats">
        {zen ? (
          <span class="hud__stat" title="Lifetime zen clears" data-stat="zen">
            <span aria-hidden="true">🧘</span> {game.save.value.zenLifetime}
            <span class="sr-only"> cleared in zen, lifetime</span>
          </span>
        ) : (
          <span class="hud__stat hud__time" title="Run time" data-stat="time">
            <span aria-hidden="true">⏱</span>
            <span class="sr-only">Time </span> {formatTime(time)}
          </span>
        )}
        <span class="hud__stat" title="Cleared" data-stat="cleared">
          <span aria-hidden="true">✓</span> {s.cleared ?? 0}
          <span class="sr-only"> cleared</span>
        </span>
        <span class="hud__stat hud__active" title="Active notifications" data-stat="active">
          <span class="hud__dot" aria-hidden="true" /> {e.activeCount}
          <span class="sr-only"> active</span>
        </span>
      </div>

      <div class="topbar__actions">
        {game.canMarkAll() && (
          <button
            class="btn btn--small btn--gold markall"
            onClick={() => game.markAllRead()}
            disabled={e.popups().length > 0}
          >
            🧹 Mark All As Read
          </button>
        )}
        <button
          class="icon-btn"
          onClick={() => game.toggleMute()}
          aria-pressed={game.muted.value}
          aria-label={game.muted.value ? 'Unmute sound' : 'Mute sound'}
        >
          {game.muted.value ? '🔇' : '🔊'}
        </button>
      </div>
    </header>
  );
}
