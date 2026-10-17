import type { ContentPack, EngineEvent, Instance, NotifDef, Phase, Trigger } from './types';

export const MAX_SNOOZES = 2;
export const SNOOZE_MS = 8000;
export const XP_PER_LEVEL = 100;

export type Mode = 'story' | 'zen';

/** Outcomes the UI can clear a def with: its listed choices, or ones implied by its interaction. */
export function outcomesOf(def: NotifDef): string[] {
  if (def.interaction === 'tinyX') return ['ad', 'x'];
  return def.outcomes ?? [];
}

interface Pending {
  def: NotifDef;
  at: number;
  /** Set when a snoozed instance is coming back. */
  inst?: Instance;
}

type Listener = (events: EngineEvent[]) => void;

/**
 * The notification cascade. Pure TS, no DOM: the UI and the simulation bot drive it the same way.
 *
 * Story-mode invariants:
 * - every def fires at most once, so a run always terminates;
 * - Inbox Zero happens only when nothing is active, nothing is pending, and evaluating
 *   triggers spawns nothing new;
 * - after Inbox Zero only `phase: 'finale'` defs can fire.
 */
export class Engine {
  readonly defs: readonly NotifDef[];
  readonly byId: ReadonlyMap<string, NotifDef>;
  phase: Phase;
  /** Virtual clock in ms. The UI advances it in real time (paused while the tab is hidden). */
  now = 0;
  /** Bumped on every change, so the UI can cheaply tell when to re-render. */
  version = 0;
  stats: Record<string, number> = { cleared: 0, achievements: 0, xp: 0, level: 1 };

  private active = new Map<string, Instance>();
  private fired = new Set<string>();
  private clearedOutcomes = new Map<string, string | undefined>();
  private events = new Set<string>();
  private pending: Pending[] = [];
  private seq = 0;
  private listeners = new Set<Listener>();
  private outbox: EngineEvent[] = [];
  private depth = 0;

  constructor(pack: ContentPack, mode: Mode = 'story') {
    this.defs = pack.defs;
    const byId = new Map<string, NotifDef>();
    for (const def of pack.defs) {
      if (byId.has(def.id)) throw new Error(`duplicate notification id: ${def.id}`);
      byId.set(def.id, def);
    }
    this.byId = byId;
    this.phase = mode === 'zen' ? 'zen' : 'main';
  }

  // ---- queries ----

  /** Active instances in spawn order. */
  getActive(): Instance[] {
    return [...this.active.values()].sort((a, b) => a.seq - b.seq);
  }

  get activeCount(): number {
    return this.active.size;
  }

  get pendingCount(): number {
    return this.pending.length;
  }

  popups(): Instance[] {
    return this.getActive().filter((i) => i.def.kind === 'popup');
  }

  /** What the player can act on right now: the oldest popup if any, otherwise every item. */
  clearable(): Instance[] {
    const active = this.getActive();
    const firstPopup = active.find((i) => i.def.kind === 'popup');
    return firstPopup ? [firstPopup] : active;
  }

  isActive(id: string): boolean {
    return this.active.has(id);
  }

  get(id: string): Instance | undefined {
    return this.active.get(id);
  }

  firedIds(): string[] {
    return [...this.fired];
  }

  hasFired(id: string): boolean {
    return this.fired.has(id);
  }

  wasCleared(id: string): boolean {
    return this.clearedOutcomes.has(id);
  }

  hasEvent(name: string): boolean {
    return this.events.has(name);
  }

  /** Badge count for a nav path: active non-popup notifications at or below it. '' is everything. */
  countUnder(path: string): number {
    let n = 0;
    for (const inst of this.active.values()) {
      const at = inst.def.at;
      if (inst.def.kind === 'popup' || at === undefined) continue;
      if (path === '' || at === path || at.startsWith(path + '/')) n++;
    }
    return n;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // ---- actions ----

  start(): void {
    this.op(() => this.emitInternal('start'));
  }

  /** Clear an active notification. Returns false if it isn't clearable right now. */
  clear(id: string, outcome?: string): boolean {
    if (!this.clearable().some((i) => i.def.id === id)) return false;
    this.op(() => this.clearInternal(id, outcome));
    return true;
  }

  /** "Remind me later": hide it and bring it back after SNOOZE_MS. */
  snooze(id: string): boolean {
    const inst = this.active.get(id);
    if (!inst || inst.snoozes >= MAX_SNOOZES) return false;
    if (!this.clearable().includes(inst)) return false;
    this.op(() => {
      this.active.delete(id);
      inst.snoozes++;
      this.pending.push({ def: inst.def, at: this.now + SNOOZE_MS, inst });
      this.push({ type: 'snooze', inst });
    });
    return true;
  }

  /** Clears every active item at once (not popups). Returns how many it cleared. */
  markAllRead(): number {
    if (this.popups().length > 0) return 0;
    const items = this.getActive();
    this.op(() => {
      for (const inst of items) this.clearInternal(inst.def.id, 'markAll');
      this.stats.markedAllRead = items.length;
      this.emitInternal('usedMarkAll');
    });
    return items.length;
  }

  /** Record a named event (UI happenings like 'mute', 'visitedAchievements'). */
  emit(name: string): void {
    this.op(() => this.emitInternal(name));
  }

  advance(ms: number): void {
    if (ms <= 0) return;
    this.now += ms;
    if (this.pending.length === 0) return;
    this.op(() => {
      const due = this.pending.filter((p) => p.at <= this.now).sort((a, b) => a.at - b.at);
      if (due.length === 0) return;
      this.pending = this.pending.filter((p) => p.at > this.now);
      for (const p of due) {
        if (p.inst) {
          p.inst.seq = ++this.seq;
          this.active.set(p.def.id, p.inst);
          this.push({ type: 'spawn', inst: p.inst });
        } else {
          this.spawn(p.def);
        }
      }
    });
  }

  /** Spawn a def that isn't part of the content pack's trigger graph (zen mode). */
  inject(def: NotifDef): void {
    this.op(() => {
      this.fired.add(def.id);
      this.spawn(def);
    });
  }

  // ---- internals ----

  /** Runs a mutation, then re-evaluates triggers and notifies listeners once at the outermost level. */
  private op(fn: () => void): void {
    this.depth++;
    try {
      fn();
      if (this.depth === 1) this.evaluate();
    } finally {
      this.depth--;
    }
    if (this.depth === 0 && this.outbox.length > 0) {
      this.version++;
      const events = this.outbox;
      this.outbox = [];
      for (const l of this.listeners) l(events);
    }
  }

  private clearInternal(id: string, outcome: string | undefined): void {
    const inst = this.active.get(id);
    if (!inst) return;
    this.active.delete(id);
    this.clearedOutcomes.set(id, outcome);
    this.stats.cleared = (this.stats.cleared ?? 0) + 1;
    for (const [stat, amount] of Object.entries(inst.def.rewards ?? {})) {
      this.stats[stat] = (this.stats[stat] ?? 0) + amount;
    }
    this.stats.level = 1 + Math.floor((this.stats.xp ?? 0) / XP_PER_LEVEL);
    this.push({ type: 'clear', inst, outcome });
  }

  private emitInternal(name: string): void {
    if (this.events.has(name)) return;
    this.events.add(name);
    this.push({ type: 'event', name });
  }

  private spawn(def: NotifDef): void {
    const inst: Instance = {
      def,
      title: this.fill(def.title),
      body: this.fill(def.body ?? ''),
      spawnedAt: this.now,
      seq: ++this.seq,
      snoozes: 0,
    };
    this.active.set(def.id, inst);
    if (def.kind === 'achievement') this.stats.achievements = (this.stats.achievements ?? 0) + 1;
    this.push({ type: 'spawn', inst });
  }

  /** Replaces {stat} placeholders. {active} is the active count including this notification. */
  private fill(text: string): string {
    return text.replace(/\{(\w+)\}/g, (match, key: string) => {
      if (key === 'active') return String(this.active.size + 1);
      const v = this.stats[key];
      return v === undefined ? match : String(v);
    });
  }

  private evaluate(): void {
    let changed = true;
    while (changed) {
      changed = false;
      for (const def of this.defs) {
        if (this.fired.has(def.id)) continue;
        if ((def.phase ?? 'main') !== this.phase) continue;
        if (!this.satisfied(def.trigger)) continue;
        this.fired.add(def.id);
        if (def.delayMs) {
          this.pending.push({ def, at: this.now + def.delayMs });
        } else {
          this.spawn(def);
          changed = true;
        }
      }
      if (!changed && this.active.size === 0 && this.pending.length === 0) {
        if (this.phase === 'main' && this.events.has('start')) {
          this.setPhase('finale');
          this.emitInternal('inboxZero');
          changed = true;
        } else if (this.phase === 'finale') {
          this.setPhase('done');
        }
      }
    }
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.push({ type: 'phase', phase });
  }

  private satisfied(t: Trigger): boolean {
    switch (t.on) {
      case 'start':
        return this.events.has('start');
      case 'cleared':
        if (!this.clearedOutcomes.has(t.id)) return false;
        if (t.outcome === undefined) return true;
        return [t.outcome].flat().includes(this.clearedOutcomes.get(t.id) ?? '');
      case 'allCleared':
        return t.ids.every((id) => this.clearedOutcomes.has(id));
      case 'anyCleared':
        return t.ids.some((id) => this.clearedOutcomes.has(id));
      case 'stat':
        return (this.stats[t.stat] ?? 0) >= t.gte;
      case 'event':
        return this.events.has(t.name);
      case 'manual':
        return false;
    }
  }

  private push(e: EngineEvent): void {
    this.outbox.push(e);
  }
}
