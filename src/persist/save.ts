/** Versioned localStorage save. Every access is guarded: the game must work without storage. */
export interface SaveData {
  v: 1;
  launches: number;
  lifetimeCleared: number;
  runsCompleted: number;
  bestTimeMs: number | null;
  bestCleared: number | null;
  zenUnlocked: boolean;
  zenLifetime: number;
  muted: boolean;
}

export const SAVE_KEY = 'clear-all/save';

export function defaults(): SaveData {
  return {
    v: 1,
    launches: 0,
    lifetimeCleared: 0,
    runsCompleted: 0,
    bestTimeMs: null,
    bestCleared: null,
    zenUnlocked: false,
    zenLifetime: 0,
    muted: false,
  };
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function load(): SaveData {
  try {
    const raw = storage()?.getItem(SAVE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    // Unknown versions start fresh rather than misreading fields.
    if (parsed.v !== 1) return defaults();
    return { ...defaults(), ...parsed };
  } catch {
    return defaults();
  }
}

export function save(data: SaveData): void {
  try {
    storage()?.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked: progress just won't persist.
  }
}

export function update(fn: (data: SaveData) => void): SaveData {
  const data = load();
  fn(data);
  save(data);
  return data;
}
