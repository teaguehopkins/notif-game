import { batch, signal } from '@preact/signals';
import { story } from '../content';
import { FINALE_CREDITS, FINALE_ZEN } from '../content/finale';
import { NAV, findNode, isPathVisible } from '../content/nav';
import { Engine } from '../engine/engine';
import { ZenDirector } from '../engine/zen';
import { zenPack, zenTemplates } from '../content/zen';
import type { EngineEvent, Instance } from '../engine/types';
import { musicLayersFor, setMusicEnabled, setMusicLayers, setMusicMode } from '../audio/music';
import { setMuted, setVolume, setZen, sfx, type SpawnKind } from '../audio/sfx';
import {
  clearRun,
  load,
  loadRun,
  saveRun,
  update,
  type RunSave,
  type SaveData,
} from '../persist/save';
import { COLORS, fx } from './fx';

export type Screen = 'title' | 'story' | 'zen' | 'results';

export interface Toast {
  key: number;
  icon: string;
  title: string;
  label: string;
}

/** How long without a clear before the hint points at a dot. */
export const HINT_AFTER_MS = 20_000;
const TOAST_MS = 3200;
/** How long the Inbox Zero moment holds the stage before the finale popup takes over. */
export const ZERO_MOMENT_MS = 2600;

/** Spawn sounds, loudest first: one plays per batch of spawns. */
const SPAWN_PRIORITY: SpawnKind[] = ['legendary', 'gary', 'popup', 'item', 'achievement'];

function spawnKind(inst: Instance): SpawnKind {
  if (inst.def.rarity === 'legendary') return 'legendary';
  if (/gary/i.test(inst.title)) return 'gary';
  return inst.def.kind;
}

/** Rewards that fly into a counter when claimed, and what they look like on the way. */
const FLIGHTS: Record<string, { target: string; shape: 'coin' | 'gem' | 'star'; color: string }> = {
  gold: { target: '[data-currency=gold]', shape: 'coin', color: COLORS.gold },
  gems: { target: '[data-currency=gems]', shape: 'gem', color: COLORS.gems },
  dust: { target: '[data-currency=dust]', shape: 'star', color: COLORS.dust },
  tokens: { target: '[data-currency=tokens]', shape: 'coin', color: COLORS.tokens },
  xp: { target: '.profile-chip__avatar', shape: 'star', color: COLORS.xp },
};

/**
 * Owns the engine and all UI state. Components read signals; reading `version` subscribes a
 * component to every engine change.
 */
class Game {
  engine = new Engine(story);
  screen = signal<Screen>('title');
  /** Top-level menu id, or '' for the home screen. */
  route = signal('');
  /** Selected sub-tab id within the current menu. */
  tab = signal('');
  version = signal(0);
  /** Engine clock, refreshed a few times a second for the HUD. */
  clock = signal(0);
  toasts = signal<Toast[]>([]);
  /** Item whose detail modal is open. */
  openItem = signal<string | null>(null);
  /** Location path of the dot the hint is pointing at. */
  hint = signal<string | null>(null);
  matchmaking = signal<'off' | 'searching' | 'failed'>('off');
  /** Engine time when Inbox Zero happened. */
  zeroAtMs = signal(0);
  save = signal<SaveData>(load());
  /** The story run left unfinished last time, if any. The title screen offers to continue it. */
  savedRun = signal<RunSave | null>(loadRun());
  muted = signal(false);
  music = signal(true);
  volume = signal(0.8);
  avatar = signal('🧙');
  /** The LEVEL UP banner, keyed so each level-up replays it. */
  levelBanner = signal<{ key: number; level: number } | null>(null);
  /** True for the few seconds of the Inbox Zero moment. */
  zeroMoment = signal(false);
  /** Cleared instances by id, so menus can keep showing what you've seen. */
  seen = new Map<string, Instance>();

  private director: ZenDirector | null = null;
  private unsubscribe: (() => void) | null = null;
  private lastFrame = 0;
  private lastClearAt = 0;
  private toastKey = 0;
  private wasHidden = false;
  private raf = 0;
  private lastLevel = 1;

  constructor() {
    this.save.value = update((d) => {
      d.launches++;
    });
    this.muted.value = this.save.value.muted;
    this.music.value = this.save.value.music;
    this.volume.value = this.save.value.volume;
    setMuted(this.muted.value);
    setVolume(this.volume.value);
    setMusicEnabled(this.music.value);
    // A run saved before a content change may not restore; don't offer to continue it.
    const run = this.savedRun.value;
    if (run && !Engine.restore(story, run.engine)) {
      clearRun();
      this.savedRun.value = null;
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.wasHidden = true;
          // Phones can discard a background tab without warning, so save the clock now.
          this.persistRun();
        } else {
          this.lastFrame = performance.now();
          if (this.wasHidden && this.screen.value === 'story') this.engine.emit('tabReturn');
          this.wasHidden = false;
        }
      });
      addEventListener('pagehide', () => this.persistRun());
    }
  }

  startStory(): void {
    clearRun();
    this.savedRun.value = null;
    const engine = new Engine(story);
    engine.stats.launches = this.save.value.launches;
    this.director = null;
    this.reset(engine);
    setZen(false);
    setMusicLayers(1);
    setMusicMode('launcher');
    this.screen.value = 'story';
    engine.start();
    if (this.save.value.launches > 1) engine.emit('returnVisit');
  }

  /** Picks the saved run back up where it was, clock paused while you were away. */
  resumeStory(): void {
    const run = this.savedRun.value;
    const engine = run && Engine.restore(story, run.engine);
    if (!run || !engine) {
      this.startStory();
      return;
    }
    this.director = null;
    this.reset(engine);
    for (const s of run.seen) {
      const def = engine.byId.get(s.id);
      if (def)
        this.seen.set(s.id, {
          def,
          title: s.title,
          body: s.body,
          spawnedAt: 0,
          seq: 0,
          snoozes: 0,
        });
    }
    this.avatar.value = run.avatar;
    this.zeroAtMs.value = run.zeroAtMs;
    this.clock.value = engine.now;
    this.lastClearAt = engine.now;
    this.lastLevel = engine.stats.level ?? 1;
    setZen(false);
    if (engine.phase === 'main') {
      setMusicLayers(musicLayersFor(engine.stats.cleared ?? 0, engine.hasFired('event_begins')));
      setMusicMode('launcher');
    } else {
      setMusicMode(engine.isActive(FINALE_CREDITS) ? 'credits' : 'zero');
    }
    this.screen.value = 'story';
    // You left and came back: that's an achievement.
    engine.emit('tabReturn');
    this.persistRun();
  }

  /** Saves the story run in progress. Zen has nothing to resume beyond its lifetime counter. */
  private persistRun(): void {
    if (this.screen.value !== 'story' || this.engine.phase === 'done') return;
    const run: RunSave = {
      v: 1,
      engine: this.engine.snapshot(),
      seen: [...this.seen.values()].map((i) => ({ id: i.def.id, title: i.title, body: i.body })),
      avatar: this.avatar.value,
      zeroAtMs: this.zeroAtMs.value,
    };
    saveRun(run);
    this.savedRun.value = run;
  }

  startZen(): void {
    const engine = new Engine(zenPack, 'zen');
    this.director = new ZenDirector(engine, zenTemplates, Date.now() >>> 0);
    this.reset(engine);
    setZen(true);
    setMusicMode('zen');
    this.screen.value = 'zen';
    engine.start();
  }

  private reset(engine: Engine): void {
    this.unsubscribe?.();
    this.engine = engine;
    this.unsubscribe = engine.subscribe((events) => this.onEngineEvents(events));
    batch(() => {
      this.route.value = '';
      this.tab.value = '';
      this.toasts.value = [];
      this.openItem.value = null;
      this.hint.value = null;
      this.matchmaking.value = 'off';
      this.zeroAtMs.value = 0;
      this.clock.value = 0;
      this.levelBanner.value = null;
      this.zeroMoment.value = false;
      this.version.value++;
    });
    this.lastClearAt = 0;
    this.lastLevel = 1;
    this.seen = new Map();
    this.startLoop();
  }

  private startLoop(): void {
    cancelAnimationFrame(this.raf);
    this.lastFrame = performance.now();
    const frame = (t: number) => {
      // Cap each step so a stalled tab doesn't fast-forward the clock.
      const dt = Math.min(t - this.lastFrame, 100);
      this.lastFrame = t;
      if (!document.hidden && (this.screen.value === 'story' || this.screen.value === 'zen')) {
        this.engine.advance(dt);
        this.director?.tick();
        if (Math.floor(this.engine.now / 250) !== Math.floor(this.clock.value / 250)) {
          this.clock.value = this.engine.now;
          this.updateHint();
        }
      }
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  private onEngineEvents(events: EngineEvent[]): void {
    // Assigned inside batch(); the cast keeps TS from narrowing it to null afterwards.
    let spawn = null as SpawnKind | null;
    let cleared = 0;
    let flights = 0;
    batch(() => {
      for (const e of events) {
        if (e.type === 'spawn') {
          const kind = spawnKind(e.inst);
          if (!spawn || SPAWN_PRIORITY.indexOf(kind) < SPAWN_PRIORITY.indexOf(spawn)) spawn = kind;
          if (e.inst.def.kind === 'achievement') this.toast(e.inst, 'Achievement Unlocked!');
          if (e.inst.def.id === FINALE_CREDITS) setMusicMode('credits');
        } else if (e.type === 'clear') {
          cleared++;
          this.seen.set(e.inst.def.id, e.inst);
          if (this.openItem.value === e.inst.def.id) this.openItem.value = null;
          // Mark All clears dozens at once; a few flights are plenty.
          if (flights < 3 && this.flyRewards(e.inst.def.rewards)) flights++;
        } else if (e.type === 'phase') {
          if (e.phase === 'finale') {
            this.zeroAtMs.value = this.engine.now;
            this.inboxZero();
          }
          if (e.phase === 'done') this.finishRun();
        }
      }
      if (cleared) {
        this.lastClearAt = this.engine.now;
        this.hint.value = null;
        this.save.value = update((d) => {
          d.lifetimeCleared += cleared;
          if (this.screen.value === 'zen') d.zenLifetime += cleared;
        });
      }
      this.checkLevelUp();
      this.version.value++;
    });
    this.persistRun();
    if (cleared) {
      sfx.clear();
      if (typeof window !== 'undefined') fx.pop();
      fx.buzz(8);
    }
    if (spawn) {
      sfx.spawn(spawn, this.engine.activeCount);
      if (spawn === 'popup') fx.buzz([12, 30, 12]);
    }
    if (this.screen.value === 'story' && this.engine.phase === 'main') {
      setMusicLayers(
        musicLayersFor(this.engine.stats.cleared ?? 0, this.engine.hasFired('event_begins')),
      );
    }
  }

  /** Claimed rewards fly from where you clicked into their counters. */
  private flyRewards(rewards: Record<string, number> | undefined): boolean {
    if (!rewards || typeof window === 'undefined') return false;
    let flew = false;
    for (const [key, amount] of Object.entries(rewards)) {
      const f = FLIGHTS[key];
      if (!f || amount <= 0) continue;
      fx.fly(fx.origin(), f.target, {
        count: Math.min(3 + Math.floor(amount / 15), 12),
        shape: f.shape,
        color: f.color,
      });
      flew = true;
    }
    return flew;
  }

  private checkLevelUp(): void {
    const level = this.engine.stats.level ?? 1;
    if (level > this.lastLevel && this.screen.value === 'story') {
      const key = Date.now();
      this.levelBanner.value = { key, level };
      sfx.levelUp();
      setTimeout(() => {
        if (this.levelBanner.value?.key === key) this.levelBanner.value = null;
      }, 1900);
    }
    this.lastLevel = level;
  }

  /** Silence, the dots drain away, then the last achievement lands with a thump. */
  private inboxZero(): void {
    this.zeroMoment.value = true;
    setMusicMode('zero');
    sfx.inboxZero();
    if (typeof window === 'undefined') return;
    fx.drain(60);
    setTimeout(() => {
      fx.confetti({ x: innerWidth / 2, y: innerHeight * 0.65 }, 140, false);
      fx.shake(document.querySelector('.modal--finale'), 'big');
      fx.buzz([30, 60, 90]);
    }, 1100);
    setTimeout(() => (this.zeroMoment.value = false), ZERO_MOMENT_MS);
  }

  private finishRun(): void {
    clearRun();
    this.savedRun.value = null;
    const time = this.zeroAtMs.value;
    const cleared = this.engine.stats.cleared ?? 0;
    this.save.value = update((d) => {
      d.runsCompleted++;
      d.zenUnlocked = true;
      if (d.bestTimeMs === null || time < d.bestTimeMs) d.bestTimeMs = time;
      if (d.bestCleared === null || cleared > d.bestCleared) d.bestCleared = cleared;
    });
    this.screen.value = 'results';
  }

  private toast(inst: Instance, label: string): void {
    const key = ++this.toastKey;
    this.toasts.value = [
      ...this.toasts.value.slice(-2),
      { key, icon: inst.def.icon ?? '🏆', title: inst.title, label },
    ];
    sfx.achievement();
    setTimeout(() => {
      this.toasts.value = this.toasts.value.filter((t) => t.key !== key);
    }, TOAST_MS);
  }

  private updateHint(): void {
    if (this.screen.value !== 'story' || this.hint.value) return;
    if (this.engine.now - this.lastClearAt < HINT_AFTER_MS) return;
    const target = this.engine.clearable().find((i) => i.def.at && i.def.kind !== 'popup');
    if (!target?.def.at || this.engine.popups().length > 0) return;
    this.hint.value = target.def.at;
    this.engine.emit('hintShown');
  }

  // ---- player actions ----

  navigate(top: string): void {
    if (top === '') {
      this.route.value = '';
      return;
    }
    const node = findNode(top);
    if (!node) return;
    if (this.engine.countUnder(top) > 0) this.engine.emit('clickedDot');
    const children = (node.children ?? []).filter((c) => this.visible(`${top}/${c.id}`));
    const withDot = children.find((c) => this.engine.countUnder(`${top}/${c.id}`) > 0);
    batch(() => {
      this.route.value = top;
      this.tab.value = (withDot ?? children[0])?.id ?? '';
    });
    this.engine.emit(`visit:${top}`);
  }

  selectTab(id: string): void {
    this.tab.value = id;
  }

  /** The location path the current screen shows items for. */
  currentPath(): string {
    const route = this.route.value;
    if (!route) return '';
    const node = findNode(route);
    return node?.children ? `${route}/${this.tab.value}` : route;
  }

  visible(path: string): boolean {
    return isPathVisible(path, (id) => this.engine.hasFired(id));
  }

  visibleMenus() {
    return NAV.filter((n) => this.visible(n.id));
  }

  clear(id: string, outcome?: string): boolean {
    return this.engine.clear(id, outcome);
  }

  snooze(id: string): boolean {
    const ok = this.engine.snooze(id);
    if (ok) sfx.snooze();
    return ok;
  }

  markAllRead(): void {
    const at = typeof window === 'undefined' ? null : fx.origin();
    this.engine.markAllRead();
    sfx.fanfare();
    if (at) fx.confetti(at, 60, true);
  }

  emit(name: string): void {
    this.engine.emit(name);
  }

  /** Engine time since the last clear. */
  idleMs(): number {
    return this.engine.now - this.lastClearAt;
  }

  setVolume(value: number): void {
    this.volume.value = value;
    setVolume(value);
    this.save.value = update((d) => {
      d.volume = value;
    });
    this.engine.emit('adjustedVolume');
  }

  toggleMusic(): void {
    const on = !this.music.value;
    this.music.value = on;
    setMusicEnabled(on);
    this.save.value = update((d) => {
      d.music = on;
    });
  }

  toggleMute(): void {
    const muted = !this.muted.value;
    this.muted.value = muted;
    setMuted(muted);
    this.save.value = update((d) => {
      d.muted = muted;
    });
    if (muted) this.engine.emit('mute');
  }

  setAvatar(avatar: string): void {
    this.avatar.value = avatar;
    this.engine.emit('setAvatar');
  }

  canMarkAll(): boolean {
    return (
      this.engine.wasCleared('markall_unlocked') &&
      !this.engine.hasEvent('usedMarkAll') &&
      this.engine.phase === 'main'
    );
  }

  pressPlay(): void {
    if (this.engine.isActive(FINALE_ZEN)) {
      this.clear(FINALE_ZEN);
      return;
    }
    this.matchmaking.value = 'searching';
    setTimeout(() => {
      if (this.matchmaking.value !== 'searching') return;
      const popupsBefore = this.engine.popups().length;
      this.engine.emit('clickedPlay');
      // The first time, a popup explains. After that, matchmaking just fails.
      this.matchmaking.value = this.engine.popups().length > popupsBefore ? 'off' : 'failed';
    }, 2200);
  }

  toTitle(): void {
    cancelAnimationFrame(this.raf);
    setMusicMode('off');
    this.screen.value = 'title';
  }
}

export const game = new Game();

/** Call at the top of a component to re-render it on every engine change. */
export function useEngine(): Engine {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- reading the signal subscribes
  game.version.value;
  return game.engine;
}
