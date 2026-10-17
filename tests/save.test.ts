// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SAVE_KEY, defaults, load, save, update } from '../src/persist/save';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('save', () => {
  test('round-trips through localStorage', () => {
    update((d) => {
      d.lifetimeCleared = 42;
      d.zenUnlocked = true;
    });
    expect(load()).toMatchObject({ v: 1, lifetimeCleared: 42, zenUnlocked: true });
  });

  test('missing fields are filled from defaults', () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, launches: 3 }));
    expect(load()).toEqual({ ...defaults(), launches: 3 });
  });

  test('corrupt or unknown-version saves start fresh', () => {
    localStorage.setItem(SAVE_KEY, '{not json');
    expect(load()).toEqual(defaults());
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 99, launches: 3 }));
    expect(load()).toEqual(defaults());
  });

  test('works when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(load()).toEqual(defaults());
    expect(() => save(defaults())).not.toThrow();
    expect(update((d) => (d.launches = 5)).launches).toBe(5);
  });
});
