import type { Engine } from './engine';
import { createRng } from './rng';
import type { NotifDef } from './types';

/** Builds one notification. `n` is a running counter for unique ids and numbers. */
export type ZenTemplate = (rng: () => number, n: number) => Omit<NotifDef, 'id' | 'trigger'>;

export const ZEN_MIN_ACTIVE = 8;
export const ZEN_MAX_ACTIVE = 20;

/**
 * Keeps zen mode topped up: spawns quickly when you're nearly clear, slowly when it's busy,
 * and never past ZEN_MAX_ACTIVE.
 */
export class ZenDirector {
  private rng: () => number;
  private nextAt = 0;
  private n = 0;

  constructor(
    private engine: Engine,
    private templates: ZenTemplate[],
    seed: number,
  ) {
    this.rng = createRng(seed);
  }

  /** Call after each engine.advance(). */
  tick(): void {
    const active = this.engine.activeCount;
    if (this.engine.now < this.nextAt || active >= ZEN_MAX_ACTIVE) return;
    const template = this.templates[Math.floor(this.rng() * this.templates.length)]!;
    const n = ++this.n;
    this.engine.inject({
      ...template(this.rng, n),
      id: `zen_${n}`,
      trigger: { on: 'manual' },
      phase: 'zen',
    });
    const interval = active < ZEN_MIN_ACTIVE ? 700 : 1800 + active * 150;
    this.nextAt = this.engine.now + interval * (0.6 + this.rng() * 0.8);
  }
}
