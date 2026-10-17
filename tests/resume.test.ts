// @vitest-environment jsdom
import { afterEach, describe, expect, test } from 'vitest';
import { story } from '../src/content';
import { Engine, outcomesOf } from '../src/engine/engine';
import { createRng } from '../src/engine/rng';
import { RUN_KEY, clearRun, loadRun, saveRun } from '../src/persist/save';

afterEach(() => localStorage.clear());

/** One random player action, the same way for any engine given the same rng. */
function step(engine: Engine, rand: () => number): void {
  engine.advance(500 + rand() * 1500);
  const options = engine.clearable();
  if (options.length === 0) return;
  const inst = options[Math.floor(rand() * options.length)]!;
  if (inst.snoozes < 2 && rand() < 0.1 && engine.snooze(inst.def.id)) return;
  const outcomes = outcomesOf(inst.def);
  engine.clear(inst.def.id, outcomes[Math.floor(rand() * outcomes.length)]);
}

describe('saving a run in progress', () => {
  test('a restored engine plays out exactly like the original', () => {
    for (const seed of [1, 7, 42]) {
      const original = new Engine(story);
      original.start();
      const r1 = createRng(seed);
      for (let i = 0; i < 60; i++) step(original, r1);

      const restored = Engine.restore(story, JSON.parse(JSON.stringify(original.snapshot())))!;
      expect(restored, `seed ${seed}`).not.toBeNull();
      expect(restored.snapshot()).toEqual(original.snapshot());

      // Same actions from here on: both finish the same way.
      const a = createRng(seed + 1000);
      const b = createRng(seed + 1000);
      for (let i = 0; i < 2000 && original.phase !== 'done'; i++) {
        step(original, a);
        step(restored, b);
      }
      expect(original.phase).toBe('done');
      expect(restored.snapshot()).toEqual(original.snapshot());
    }
  });

  test('a snapshot from different content is refused', () => {
    const engine = new Engine(story);
    engine.start();
    const snap = engine.snapshot();
    snap.active[0]!.id = 'no_such_notification';
    expect(Engine.restore(story, snap)).toBeNull();
  });

  test('run saves round-trip, and junk reads as no save', () => {
    const engine = new Engine(story);
    engine.start();
    const run = { v: 1 as const, engine: engine.snapshot(), seen: [], avatar: '🧙', zeroAtMs: 0 };
    saveRun(run);
    expect(loadRun()).toEqual(run);
    clearRun();
    expect(loadRun()).toBeNull();
    localStorage.setItem(RUN_KEY, '{oops');
    expect(loadRun()).toBeNull();
  });
});
