import { expect, test } from 'vitest';
import { zenPack, zenTemplates } from '../src/content/zen';
import { leafPaths } from '../src/content/nav';
import { Engine, outcomesOf } from '../src/engine/engine';
import { createRng, pick } from '../src/engine/rng';
import { ZEN_MAX_ACTIVE, ZenDirector } from '../src/engine/zen';

test('zen stays within its band for 5 minutes, at any clearing speed', () => {
  for (const msPerClear of [300, 2000, 8000]) {
    const engine = new Engine(zenPack, 'zen');
    const director = new ZenDirector(engine, zenTemplates, 7);
    const rng = createRng(1);
    engine.start();
    let peak = 0;
    let sinceClear = 0;
    while (engine.now < 5 * 60_000) {
      engine.advance(100);
      director.tick();
      sinceClear += 100;
      peak = Math.max(peak, engine.activeCount);
      if (sinceClear >= msPerClear && engine.clearable().length) {
        const inst = pick(rng, engine.clearable());
        const outcomes = outcomesOf(inst.def);
        engine.clear(inst.def.id, outcomes.length ? pick(rng, outcomes) : undefined);
        sinceClear = 0;
      }
    }
    // Milestone achievements can push it a little over the director's cap.
    expect(peak, `${msPerClear}ms/clear`).toBeLessThanOrEqual(ZEN_MAX_ACTIVE + 2);
    expect(engine.phase).toBe('zen');
    if (msPerClear === 300) expect(engine.stats.cleared).toBeGreaterThan(200);
  }
});

test('zen templates use valid locations', () => {
  const leaves = new Set(leafPaths());
  const rng = createRng(3);
  zenTemplates.forEach((t, i) => {
    const def = t(rng, i);
    if (def.kind !== 'popup') expect(leaves.has(def.at ?? '')).toBe(true);
  });
});
