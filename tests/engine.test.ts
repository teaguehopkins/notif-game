import { describe, expect, test } from 'vitest';
import { Engine, MAX_SNOOZES, SNOOZE_MS } from '../src/engine/engine';
import type { EngineEvent } from '../src/engine/types';
import { mini } from './fixtures/mini';

function started() {
  const e = new Engine(mini);
  e.start();
  return e;
}

/** Clears whatever is clearable (oldest first) until nothing is left or the phase is done. */
function drain(e: Engine, outcome: (id: string) => string | undefined = () => undefined) {
  for (let i = 0; i < 500 && e.phase !== 'done'; i++) {
    const next = e.clearable()[0];
    if (!next) {
      e.advance(1000);
      continue;
    }
    const def = next.def;
    expect(e.clear(def.id, def.outcomes ? (outcome(def.id) ?? def.outcomes[0]) : undefined)).toBe(
      true,
    );
  }
}

describe('Engine', () => {
  test('start spawns start-triggered defs and cascades meta achievements', () => {
    const e = started();
    expect(e.isActive('welcome')).toBe(true);
    expect(e.isActive('tos')).toBe(true);
    expect(e.isActive('opened')).toBe(true);
    // Unlocking "opened" is the first achievement, which unlocks "First Achievement".
    expect(e.isActive('first')).toBe(true);
    expect(e.stats.achievements).toBe(2);
  });

  test('popups must be cleared oldest first, and block items', () => {
    const e = started();
    expect(e.clearable().map((i) => i.def.id)).toEqual(['welcome']);
    expect(e.clear('tos')).toBe(false);
    expect(e.clear('opened')).toBe(false);
    expect(e.clear('welcome')).toBe(true);
    expect(e.clearable().map((i) => i.def.id)).toEqual(['tos']);
  });

  test('clearing grants rewards, derives level, and fires cleared triggers', () => {
    const e = started();
    e.clear('welcome');
    e.clear('tos');
    expect(e.clear('chest')).toBe(true);
    expect(e.stats.gold).toBe(100);
    expect(e.stats.level).toBe(3);
    expect(e.isActive('card1')).toBe(true);
    expect(e.isActive('card2')).toBe(true);
    expect(e.get('levelUp')?.title).toBe('Level 3!');
  });

  test('outcome-specific triggers branch', () => {
    for (const [choice, spawned, notSpawned] of [
      ['accept', 'garyGift', 'garySad'],
      ['decline', 'garySad', 'garyGift'],
    ] as const) {
      const e = started();
      e.clear('welcome');
      e.clear('tos');
      // Clear popups that may have queued up in front of Gary.
      while (e.popups().length) e.clear(e.popups()[0]!.def.id);
      e.clear('gary', choice);
      expect(e.hasFired(spawned)).toBe(true);
      expect(e.hasFired(notSpawned)).toBe(false);
    }
  });

  test('delayed spawns wait for the clock', () => {
    const e = started();
    e.clear('welcome');
    e.clear('tos');
    while (e.popups().length) e.clear(e.popups()[0]!.def.id);
    e.clear('gary', 'decline');
    e.clear('garySad');
    expect(e.isActive('garyOnline')).toBe(false);
    expect(e.pendingCount).toBe(1);
    e.advance(4999);
    expect(e.isActive('garyOnline')).toBe(false);
    e.advance(1);
    expect(e.isActive('garyOnline')).toBe(true);
  });

  test('snooze hides then returns, at most MAX_SNOOZES times', () => {
    const e = started();
    drainUntil(e, 'rate');
    for (let i = 0; i < MAX_SNOOZES; i++) {
      expect(e.snooze('rate')).toBe(true);
      expect(e.isActive('rate')).toBe(false);
      e.advance(SNOOZE_MS);
      // Other popups may be ahead of it now; clear them.
      while (e.clearable()[0]?.def.id !== 'rate') e.clear(e.clearable()[0]!.def.id);
      expect(e.isActive('rate')).toBe(true);
    }
    expect(e.snooze('rate')).toBe(false);
  });

  test('{active} counts the notification itself', () => {
    const e = started();
    drainUntil(e, 'unread');
    const count = e.activeCount;
    expect(e.get('unread')?.title).toBe(`You have ${count} unread notifications`);
  });

  test('badge counts bubble up from leaves and ignore popups', () => {
    const e = started();
    expect(e.countUnder('achievements/meta')).toBe(1);
    expect(e.countUnder('achievements')).toBe(2);
    expect(e.countUnder('')).toBe(2);
    expect(e.countUnder('achieve')).toBe(0);
  });

  test('Inbox Zero fires once, only at true zero, then the finale runs and the run ends', () => {
    const e = new Engine(mini);
    const phases: string[] = [];
    let activeAtZero = -1;
    let pendingAtZero = -1;
    e.subscribe((events: EngineEvent[]) => {
      for (const ev of events) {
        if (ev.type === 'phase') phases.push(ev.phase);
        if (ev.type === 'event' && ev.name === 'inboxZero') {
          // Finale popups spawn in the same batch, so subtract them.
          activeAtZero = e.getActive().filter((i) => i.def.phase !== 'finale').length;
          pendingAtZero = e.pendingCount;
        }
      }
    });
    e.start();
    drain(e);
    expect(phases).toEqual(['finale', 'done']);
    expect(activeAtZero).toBe(0);
    expect(pendingAtZero).toBe(0);
    expect(e.hasFired('never')).toBe(false);
    expect(e.wasCleared('zero2')).toBe(true);
  });

  test('stat triggers are suppressed after Inbox Zero', () => {
    const pack = {
      defs: [
        { id: 'a', kind: 'popup' as const, title: 'a', trigger: { on: 'start' as const } },
        {
          id: 'late',
          kind: 'popup' as const,
          title: 'late',
          trigger: { on: 'stat' as const, stat: 'cleared', gte: 2 },
        },
        {
          id: 'z',
          kind: 'popup' as const,
          phase: 'finale' as const,
          title: 'z',
          trigger: { on: 'event' as const, name: 'inboxZero' },
        },
      ],
    };
    const e = new Engine(pack);
    e.start();
    e.clear('a');
    expect(e.phase).toBe('finale');
    e.clear('z'); // cleared is now 2, but 'late' must not fire
    expect(e.hasFired('late')).toBe(false);
    expect(e.phase).toBe('done');
  });

  test('markAllRead clears every item, counts each, and records the event', () => {
    const e = started();
    expect(e.markAllRead()).toBe(0); // popups block it
    e.clear('welcome');
    e.clear('tos');
    while (e.popups().length) e.clear(e.popups()[0]!.def.id);
    const items = e.activeCount;
    const before = e.stats.cleared!;
    expect(e.markAllRead()).toBe(items);
    expect(e.stats.cleared).toBe(before + items);
    expect(e.stats.markedAllRead).toBe(items);
    expect(e.hasEvent('usedMarkAll')).toBe(true);
  });

  test('rejects duplicate ids', () => {
    const def = { id: 'x', kind: 'popup' as const, title: 'x', trigger: { on: 'start' as const } };
    expect(() => new Engine({ defs: [def, def] })).toThrow(/duplicate/);
  });

  test('zen mode never reaches Inbox Zero and accepts injected defs', () => {
    const e = new Engine({ defs: [] }, 'zen');
    e.start();
    expect(e.phase).toBe('zen');
    e.inject({ id: 'z1', kind: 'item', at: 'mail', title: 'z1', trigger: { on: 'manual' } });
    expect(e.isActive('z1')).toBe(true);
    e.clear('z1');
    expect(e.phase).toBe('zen');
  });
});

/** Clears oldest-first until `id` is active. */
function drainUntil(e: Engine, id: string) {
  for (let i = 0; i < 200 && !e.isActive(id); i++) {
    const next = e.clearable()[0];
    if (!next) e.advance(1000);
    else e.clear(next.def.id, next.def.outcomes?.[0]);
  }
  expect(e.isActive(id)).toBe(true);
}
