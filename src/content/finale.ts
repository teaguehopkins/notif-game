import type { NotifDef } from '../engine/types';
import { after, on } from './helpers';

export const FINALE_CREDITS = 'fin_credits';
export const FINALE_ZEN = 'fin_zen';

export const finale: NotifDef[] = [
  {
    id: 'fin_zero',
    kind: 'popup',
    phase: 'finale',
    icon: '🔴',
    title: 'Achievement Unlocked: You Cleared All Notifications',
    body: 'You cleared every notification. Every single one. Except this one.',
    cta: 'Clear',
    trigger: on('inboxZero'),
  },
  {
    id: 'fin_zero2',
    kind: 'popup',
    phase: 'finale',
    icon: '🔴',
    title: "Achievement Unlocked: You Cleared the 'You Cleared All Notifications' Notification",
    body: 'This is the last one. We promise.',
    cta: 'Roll Credits',
    trigger: after('fin_zero'),
  },
  {
    id: FINALE_CREDITS,
    kind: 'item',
    phase: 'finale',
    at: 'credits',
    icon: '🎬',
    title: '1 New Notification',
    body: 'Thanks for watching the credits.',
    interaction: 'view',
    trigger: after('fin_zero2'),
  },
  {
    id: 'fin_watched',
    kind: 'popup',
    phase: 'finale',
    icon: '🎬',
    title: 'Achievement Unlocked: Watched the Credits',
    body: 'You watched the credits. All the way to the red dot at the end.',
    cta: 'OK',
    trigger: after(FINALE_CREDITS),
  },
  {
    id: FINALE_ZEN,
    kind: 'item',
    phase: 'finale',
    at: 'play',
    icon: '🧘',
    title: 'New Mode Unlocked: Zen',
    body: 'Notifications forever. No goal. Just dots.',
    interaction: 'view',
    trigger: after(FINALE_CREDITS),
  },
];
