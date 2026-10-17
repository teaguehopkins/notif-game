/** How a notification is presented. */
export type NotifKind =
  /** Interrupts whatever you're doing; popups clear one at a time, oldest first. */
  | 'popup'
  /** Lives on a launcher screen (`at`) with a dot or NEW pill. */
  | 'item'
  /** An item under achievements/* that also announces itself with a toast. */
  | 'achievement';

/** How the player clears it. The engine doesn't care; the UI does. */
export type Interaction =
  | 'view'
  | 'dismiss'
  | 'scroll'
  | 'chest'
  | 'pack'
  | 'snooze'
  | 'tinyX'
  | 'dodgeX'
  | 'hold'
  | 'confirm'
  | 'choice';

export type Phase = 'main' | 'finale' | 'done' | 'zen';

export type Trigger =
  | { on: 'start' }
  /** Fires when `id` is cleared, optionally only for a specific outcome. */
  | { on: 'cleared'; id: string; outcome?: string }
  | { on: 'allCleared'; ids: string[] }
  | { on: 'anyCleared'; ids: string[] }
  | { on: 'stat'; stat: string; gte: number }
  | { on: 'event'; name: string }
  /** Never fires on its own; only via Engine.inject (zen mode). */
  | { on: 'manual' };

export interface NotifDef {
  id: string;
  kind: NotifKind;
  /** Nav path (leaf) for items and achievements, e.g. 'collection/cardBacks'. */
  at?: string;
  title: string;
  /** May contain {stat} placeholders, filled from stats at spawn time. */
  body?: string;
  icon?: string;
  interaction?: Interaction;
  /** Button labels, for `choice` interactions. The chosen one becomes the clear outcome. */
  outcomes?: string[];
  /** Primary button label. */
  cta?: string;
  trigger: Trigger;
  /** Spawn this long after the trigger is satisfied. */
  delayMs?: number;
  /** Added to stats when cleared. `xp` also drives `level`. */
  rewards?: Record<string, number>;
  /** Phase this can spawn in. Defaults to 'main'. */
  phase?: Phase;
}

export interface Instance {
  def: NotifDef;
  title: string;
  body: string;
  spawnedAt: number;
  /** Monotonic spawn order; popups clear in this order. */
  seq: number;
  snoozes: number;
}

export type EngineEvent =
  | { type: 'spawn'; inst: Instance }
  | { type: 'clear'; inst: Instance; outcome?: string }
  | { type: 'snooze'; inst: Instance }
  | { type: 'phase'; phase: Phase }
  | { type: 'event'; name: string };

export interface ContentPack {
  defs: NotifDef[];
}
