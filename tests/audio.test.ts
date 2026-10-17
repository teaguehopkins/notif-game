import { describe, expect, test } from 'vitest';
import { musicLayersFor } from '../src/audio/music';
import { COMBO_MS, LADDER, nextCombo } from '../src/audio/sfx';

describe('combo ladder', () => {
  test('fast clears climb a major scale, one rung at a time', () => {
    let rung = 0;
    const notes = [LADDER[rung]];
    for (let i = 0; i < 7; i++) {
      rung = nextCombo(rung, 300);
      notes.push(LADDER[rung]);
    }
    // do re mi fa sol la ti do
    expect(notes).toEqual([0, 2, 4, 5, 7, 9, 11, 12]);
  });

  test('tops out instead of running off the end', () => {
    let rung = 0;
    for (let i = 0; i < 50; i++) rung = nextCombo(rung, 100);
    expect(rung).toBe(LADDER.length - 1);
  });

  test('a pause resets to the bottom', () => {
    expect(nextCombo(6, COMBO_MS)).toBe(0);
    expect(nextCombo(6, COMBO_MS - 1)).toBe(7);
  });
});

describe('music layers', () => {
  test('gain a layer each act, and all five once the festival starts', () => {
    expect(musicLayersFor(0, false)).toBe(1);
    expect(musicLayersFor(20, false)).toBe(2);
    expect(musicLayersFor(50, false)).toBe(3);
    expect(musicLayersFor(120, false)).toBe(4);
    expect(musicLayersFor(85, true)).toBe(5);
  });

  test('never drop as the run goes on', () => {
    let prev = 0;
    for (let c = 0; c <= 200; c++) {
      const n = musicLayersFor(c, false);
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
  });
});
