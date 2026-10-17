import type { NotifDef, Trigger } from '../engine/types';

type Extra = Partial<Omit<NotifDef, 'id' | 'kind' | 'title' | 'trigger'>>;

/** Every achievement grants a little XP, which is what eventually levels you up. */
export const ACHIEVEMENT_XP = 15;

export const popup = (
  id: string,
  title: string,
  trigger: Trigger,
  extra: Extra = {},
): NotifDef => ({
  id,
  kind: 'popup',
  title,
  trigger,
  ...extra,
});

export const item = (
  id: string,
  at: string,
  title: string,
  trigger: Trigger,
  extra: Extra = {},
): NotifDef => ({ id, kind: 'item', at, title, trigger, interaction: 'view', ...extra });

export const ach = (
  id: string,
  category: 'general' | 'meta' | 'progress' | 'social' | 'secret',
  title: string,
  body: string,
  trigger: Trigger,
  extra: Extra = {},
): NotifDef => ({
  id,
  kind: 'achievement',
  at: `achievements/${category}`,
  title,
  body,
  trigger,
  icon: '🏆',
  interaction: 'view',
  rewards: { xp: ACHIEVEMENT_XP },
  ...extra,
});

export const start = (): Trigger => ({ on: 'start' });
export const after = (id: string, outcome?: string | string[]): Trigger =>
  outcome === undefined ? { on: 'cleared', id } : { on: 'cleared', id, outcome };
export const afterAll = (...ids: string[]): Trigger => ({ on: 'allCleared', ids });
export const afterAny = (...ids: string[]): Trigger => ({ on: 'anyCleared', ids });
export const stat = (name: string, gte: number): Trigger => ({ on: 'stat', stat: name, gte });
export const on = (name: string): Trigger => ({ on: 'event', name });

/** A "New Currency Unlocked!" popup that fires the first time you get any. */
export const currency = (stat: string, label: string, icon: string): NotifDef =>
  popup(
    `cur_${stat}`,
    `New Currency Unlocked: ${label}!`,
    { on: 'stat', stat, gte: 1 },
    {
      icon,
      body: `${label} can be exchanged for other currencies, which can be exchanged for ${label}.`,
      cta: 'Wow',
    },
  );
