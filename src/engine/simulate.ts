import { Engine, MAX_SNOOZES, outcomesOf } from './engine';
import { createRng, pick } from './rng';
import type { ContentPack, Instance } from './types';

export interface SimOptions {
  seed: number;
  maxSteps?: number;
  /** Probability of using Mark All As Read once it unlocks (level 10). */
  markAllChance?: number;
  /** Returns false if a nav location is not currently reachable in the UI. */
  isVisible?: (at: string, engine: Engine) => boolean;
  /** Optional UI events the bot fires at random, as a player might. */
  optionalEvents?: string[];
}

export interface SimResult {
  seed: number;
  finished: boolean;
  clears: number;
  /** Clears made before Inbox Zero. */
  mainClears: number;
  peakActive: number;
  /** Virtual time at Inbox Zero, ms. */
  zeroAtMs: number;
  inboxZeroCount: number;
  usedMarkAll: boolean;
  /** Every def id that spawned (or was scheduled) during the run. */
  fired: string[];
  violations: string[];
}

/** The nav event the UI fires when the player opens a top-level screen. */
export function visitEvent(at: string): string {
  return `visit:${at.split('/')[0]}`;
}

/**
 * A bot that plays a story run in random order, behaving like the UI allows: popups oldest-first,
 * items in any order, random choice outcomes, occasional snoozes. Reports invariant violations.
 */
export function simulate(pack: ContentPack, opts: SimOptions): SimResult {
  const rng = createRng(opts.seed);
  const engine = new Engine(pack, 'story');
  const maxSteps = opts.maxSteps ?? 5000;
  const markAllChance = opts.markAllChance ?? 0.3;
  const wantsMarkAll = rng() < markAllChance;
  const violations: string[] = [];
  let peakActive = 0;
  let inboxZeroCount = 0;
  let mainClears = 0;
  let zeroAtMs = 0;

  engine.subscribe((events) => {
    for (const e of events) {
      if (e.type === 'phase' && e.phase === 'finale') {
        inboxZeroCount++;
        zeroAtMs = engine.now;
        mainClears = engine.stats.cleared ?? 0;
      }
      if (e.type === 'spawn' && engine.phase !== 'main' && e.inst.def.phase !== 'finale') {
        violations.push(`non-finale "${e.inst.def.id}" spawned in phase ${engine.phase}`);
      }
    }
  });
  engine.start();

  let steps = 0;
  for (; steps < maxSteps && engine.phase !== 'done'; steps++) {
    // Humans take a couple of seconds per clear.
    engine.advance(500 + Math.floor(rng() * 2500));
    peakActive = Math.max(peakActive, engine.activeCount);

    if (opts.optionalEvents?.length && rng() < 0.02) engine.emit(pick(rng, opts.optionalEvents));

    const clearable = engine.clearable();
    if (clearable.length === 0) continue; // waiting on pending spawns

    if (opts.isVisible) {
      for (const inst of clearable) {
        if (inst.def.at && !opts.isVisible(inst.def.at, engine)) {
          violations.push(`"${inst.def.id}" is active at hidden location ${inst.def.at}`);
        }
      }
    }

    if (
      wantsMarkAll &&
      (engine.stats.level ?? 1) >= 10 &&
      !engine.hasEvent('usedMarkAll') &&
      engine.popups().length === 0
    ) {
      engine.markAllRead();
      continue;
    }

    const inst: Instance = pick(rng, clearable);
    if (inst.def.at) engine.emit(visitEvent(inst.def.at));
    if (inst.def.interaction === 'snooze' && inst.snoozes < MAX_SNOOZES && rng() < 0.5) {
      engine.snooze(inst.def.id);
      continue;
    }
    const outcomes = outcomesOf(inst.def);
    const outcome = outcomes.length ? pick(rng, outcomes) : undefined;
    if (!engine.clear(inst.def.id, outcome)) {
      // Visiting may have put a popup in front; that's fine, try again next step.
      if (engine.clearable().includes(inst)) violations.push(`could not clear "${inst.def.id}"`);
    }
  }

  const finished = engine.phase === 'done';
  if (!finished) violations.push(`did not finish in ${maxSteps} steps (phase ${engine.phase})`);
  if (inboxZeroCount !== 1) violations.push(`Inbox Zero fired ${inboxZeroCount} times`);

  return {
    seed: opts.seed,
    finished,
    clears: engine.stats.cleared ?? 0,
    mainClears,
    peakActive,
    zeroAtMs,
    inboxZeroCount,
    usedMarkAll: engine.hasEvent('usedMarkAll'),
    fired: engine.firedIds(),
    violations,
  };
}
