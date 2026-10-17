import type { EngineSnapshot } from '../engine/engine';

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
  /** Master volume, 0 to 1. */
  volume: number;
  music: boolean;
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
    volume: 0.8,
    music: true,
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
    // Unknown versions start fresh rather than misreading fields. Fields added later within v1
    // (volume, music) are filled from defaults.
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

/** A story run in progress, kept under its own key so a bad one can't cost the lifetime save. */
export interface RunSave {
  v: 1;
  engine: EngineSnapshot;
  /** Cleared instances, so menus can keep showing what you've seen. */
  seen: { id: string; title: string; body: string }[];
  avatar: string;
  /** Engine time of Inbox Zero, once it has happened. */
  zeroAtMs: number;
}

export const RUN_KEY = 'clear-all/run';

export function loadRun(): RunSave | null {
  try {
    const raw = storage()?.getItem(RUN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RunSave;
    return parsed.v === 1 && parsed.engine ? parsed : null;
  } catch {
    return null;
  }
}

export function saveRun(run: RunSave): void {
  try {
    storage()?.setItem(RUN_KEY, JSON.stringify(run));
  } catch {
    // Same as save(): the run just won't survive a reload.
  }
}

export function clearRun(): void {
  try {
    storage()?.removeItem(RUN_KEY);
  } catch {
    // Nothing to do.
  }
}
