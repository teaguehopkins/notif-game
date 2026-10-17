import { describe, expect, test } from 'vitest';
import { simulate } from '../src/engine/simulate';
import { mini } from './fixtures/mini';

describe('simulation bot on the fixture pack', () => {
  test('every random-order run terminates with exactly one Inbox Zero', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const r = simulate(mini, { seed, markAllChance: 0.5 });
      expect(r.violations, `seed ${seed}`).toEqual([]);
      expect(r.finished).toBe(true);
      expect(r.inboxZeroCount).toBe(1);
    }
  });

  test('reports a violation when a run cannot finish', () => {
    const stuck = {
      defs: [
        { id: 'a', kind: 'popup' as const, title: 'a', trigger: { on: 'start' as const } },
        {
          id: 'b',
          kind: 'popup' as const,
          title: 'b',
          trigger: { on: 'cleared' as const, id: 'a' },
        },
      ],
    };
    const r = simulate(stuck, { seed: 1, maxSteps: 1 });
    expect(r.finished).toBe(false);
    expect(r.violations.length).toBeGreaterThan(0);
  });
});
