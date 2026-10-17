import { describe, expect, test } from 'vitest';
import { OPTIONAL_EVENTS, story } from '../src/content';
import { isPathVisible, leafPaths } from '../src/content/nav';
import { Engine, outcomesOf } from '../src/engine/engine';
import { simulate } from '../src/engine/simulate';
import type { NotifDef } from '../src/engine/types';

const byId = new Map(story.defs.map((d) => [d.id, d]));
const leaves = new Set(leafPaths());

function referencedIds(def: NotifDef): string[] {
  const t = def.trigger;
  if (t.on === 'cleared') return [t.id];
  if (t.on === 'allCleared' || t.on === 'anyCleared') return t.ids;
  return [];
}

describe('story content', () => {
  test('ids are unique', () => {
    expect(() => new Engine(story)).not.toThrow();
  });

  test.each(story.defs.map((d) => [d.id, d] as const))('%s is well-formed', (_id, def) => {
    if (def.kind === 'popup') {
      expect(def.at, 'popups have no location').toBeUndefined();
    } else {
      expect(leaves.has(def.at ?? ''), `location ${def.at} is a leaf`).toBe(true);
    }
    for (const ref of referencedIds(def)) {
      expect(byId.has(ref), `trigger references ${ref}`).toBe(true);
    }
    const t = def.trigger;
    if (t.on === 'cleared' && t.outcome !== undefined) {
      const target = byId.get(t.id)!;
      for (const o of [t.outcome].flat()) {
        expect(outcomesOf(target), `${t.id} can produce outcome "${o}"`).toContain(o);
      }
    }
    if (def.interaction === 'choice') expect(def.outcomes?.length).toBeGreaterThan(1);
    if (def.phase === 'finale') {
      for (const ref of referencedIds(def)) expect(byId.get(ref)?.phase).toBe('finale');
    }
  });

  test('500 random-order runs all reach Inbox Zero once, within the target clear range', () => {
    const fired = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) {
      const r = simulate(story, {
        seed,
        optionalEvents: OPTIONAL_EVENTS,
        isVisible: (at, e) => isPathVisible(at, (id) => e.hasFired(id)),
      });
      for (const id of r.fired) fired.add(id);
      expect(r.violations, `seed ${seed}`).toEqual([]);
      expect(r.clears, `seed ${seed} clears`).toBeGreaterThanOrEqual(150);
      expect(r.clears, `seed ${seed} clears`).toBeLessThanOrEqual(250);
    }
    // Every def shows up in at least one run.
    const neverFired = story.defs.filter((d) => !fired.has(d.id));
    expect(neverFired.map((d) => d.id)).toEqual([]);
  });
});
