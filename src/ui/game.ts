import { batch, signal } from '@preact/signals';
import { story } from '../content';
import { FINALE_ZEN } from '../content/finale';
import { NAV, findNode, isPathVisible } from '../content/nav';
import { Engine } from '../engine/engine';
import { ZenDirector } from '../engine/zen';
import { zenPack, zenTemplates } from '../content/zen';
import type { EngineEvent, Instance } from '../engine/types';
import { setMuted, sfx } from '../audio/sfx';
import { load, update, type SaveData } from '../persist/save';

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
  muted = signal(false);
  avatar = signal('🧙');
  /** Cleared instances by id, so menus can keep showing what you've seen. */
  seen = new Map<string, Instance>();

  private director: ZenDirector | null = null;
  private unsubscribe: (() => void) | null = null;
  private lastFrame = 0;
  private lastClearAt = 0;
  private toastKey = 0;
  private wasHidden = false;
  private raf = 0;

  constructor() {
    this.save.value = update((d) => {
      d.launches++;
    });
    this.muted.value = this.save.value.muted;
    setMuted(this.muted.value);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.wasHidden = true;
        } else {
          this.lastFrame = performance.now();
          if (this.wasHidden && this.screen.value === 'story') this.engine.emit('tabReturn');
          this.wasHidden = false;
        }
      });
    }
  }

  startStory(): void {
    const engine = new Engine(story);
    engine.stats.launches = this.save.value.launches;
    this.director = null;
    this.reset(engine);
    this.screen.value = 'story';
    engine.start();
    if (this.save.value.launches > 1) engine.emit('returnVisit');
  }

  startZen(): void {
    const engine = new Engine(zenPack, 'zen');
    this.director = new ZenDirector(engine, zenTemplates, Date.now() >>> 0);
    this.reset(engine);
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
      this.version.value++;
    });
    this.lastClearAt = 0;
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
    let spawned = 0;
    let cleared = 0;
    batch(() => {
      for (const e of events) {
        if (e.type === 'spawn') {
          spawned++;
          if (e.inst.def.kind === 'achievement') this.toast(e.inst, 'Achievement Unlocked!');
        } else if (e.type === 'clear') {
          cleared++;
          this.seen.set(e.inst.def.id, e.inst);
          if (this.openItem.value === e.inst.def.id) this.openItem.value = null;
        } else if (e.type === 'phase') {
          if (e.phase === 'finale') this.zeroAtMs.value = this.engine.now;
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
      this.version.value++;
    });
    if (cleared) sfx.clear();
    if (spawned) sfx.spawn(this.engine.activeCount);
  }

  private finishRun(): void {
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
    this.engine.markAllRead();
    sfx.fanfare();
  }

  emit(name: string): void {
    this.engine.emit(name);
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
