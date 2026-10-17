import { pick } from '../engine/rng';
import type { ContentPack, NotifDef, Rarity } from '../engine/types';
import type { ZenTemplate } from '../engine/zen';

const ADJ = [
  'Mildly',
  'Ancient',
  'Shiny',
  'Haunted',
  'Premium',
  'Limited',
  'Seasonal',
  'Golden',
  'Legendary',
  'Slightly Used',
];
const NOUN = [
  'Gobbo',
  'Dot',
  'Badge',
  'Bell',
  'Chest',
  'Goblin',
  'Scroll',
  'Pumpkin',
  'Notification',
  'Ping',
];
const GARYS = ['xX_Gary_Xx', 'Gary2', 'GaryTheBrave', 'NotGary', 'gary_irl', 'Gar¥', 'TheRealGary'];
const MAIL = [
  'We miss you!',
  'Re: Re: Your account',
  'A gift for you',
  'Your weekly summary',
  'Survey: How are we doing?',
  'Important update',
  'Unimportant update',
  'Did you see our last email?',
];
const SHOP = [
  'Bell Bundle',
  'Dot Pack',
  'Mega Chest',
  'Emote: "Hmm."',
  'Starter Bundle (Again)',
  'Coupon for Coupons',
];
const PATCH = [
  'Red dots are now 1% redder.',
  'Fixed a bug where notifications could be cleared.',
  'Added notifications.',
  'Gary has been rebalanced.',
];

const name = (rng: () => number) => `${pick(rng, ADJ)} ${pick(rng, NOUN)}`;
const CARD_ICONS = ['👺', '🐉', '🧌', '🦉', '🗿', '🧚', '🐸', '🦀', '🍄', '👻'];
// Weighted by repetition: mostly commons, like a real pack.
const CARD_RARITIES: Rarity[] = [
  'common',
  'common',
  'common',
  'common',
  'rare',
  'rare',
  'epic',
  'legendary',
];

export const zenTemplates: ZenTemplate[] = [
  (rng) => ({
    kind: 'item',
    at: 'collection/cards',
    title: `NEW: ${name(rng)}`,
    icon: pick(rng, CARD_ICONS),
    interaction: 'view',
    rarity: pick(rng, CARD_RARITIES),
  }),
  () => ({
    kind: 'item',
    at: 'mail',
    title: 'LEGENDARY NOTIFICATION',
    body: 'Astonishingly rare. Contains nothing.',
    icon: '🌟',
    rarity: 'legendary',
    interaction: 'dismiss',
    cta: 'Incredible',
  }),
  (rng) => ({
    kind: 'item',
    at: 'collection/cardBacks',
    title: `NEW Card Back: ${pick(rng, ADJ)}`,
    icon: '🎴',
    interaction: 'view',
  }),
  (rng) => ({
    kind: 'item',
    at: 'collection/emotes',
    title: `NEW Emote: "${pick(rng, ['Hmm.', 'Wow.', 'Oops.', 'Again?', 'Nice.'])}"`,
    icon: '💬',
    interaction: 'view',
  }),
  (rng) => ({ kind: 'item', at: 'mail', title: pick(rng, MAIL), icon: '✉️', interaction: 'view' }),
  (rng) => ({
    kind: 'item',
    at: 'friends/requests',
    title: `${pick(rng, GARYS)} Wants to Be Your Friend`,
    icon: '🧔',
    interaction: 'choice',
    outcomes: ['Accept', 'Decline'],
  }),
  (rng) => ({
    kind: 'item',
    at: 'friends/online',
    title: `${pick(rng, GARYS)} Is Now ${pick(rng, ['Online', 'Offline', 'Away', 'Thinking About You'])}`,
    icon: '🟢',
    interaction: 'view',
  }),
  (rng) => ({
    kind: 'item',
    at: 'quests/daily',
    title: `New Quest: Clear ${5 + Math.floor(rng() * 20)} Notifications`,
    icon: '📜',
    interaction: 'view',
  }),
  (rng) => ({
    kind: 'item',
    at: 'shop/featured',
    title: `NEW! ${pick(rng, SHOP)}`,
    icon: '💰',
    interaction: 'view',
  }),
  (rng, n) => ({
    kind: 'item',
    at: 'news',
    title: `Patch Notes v4.${20 + n}.${Math.floor(rng() * 9)}`,
    body: pick(rng, PATCH),
    icon: '📰',
    interaction: 'view',
  }),
  (rng) => ({
    kind: 'item',
    at: 'pass/free',
    title: `Tier ${2 + Math.floor(rng() * 98)} Reward Available!`,
    icon: '🥉',
    interaction: 'dismiss',
    cta: 'Claim',
    rewards: { gold: 5 },
  }),
  (_rng, n) => ({
    kind: 'popup',
    title: `Daily Login Reward: Day ${n}!`,
    icon: '📅',
    interaction: 'chest',
    rewards: { gold: 10 },
    cta: 'Claim',
  }),
  () => ({
    kind: 'popup',
    title: 'Enjoying Zen Mode?',
    icon: '⭐',
    interaction: 'choice',
    outcomes: ['1★', '2★', '3★', '4★', '5★'],
    body: 'Rate us!',
  }),
  () => ({
    kind: 'popup',
    title: 'Take a Break?',
    icon: '🧘',
    interaction: 'snooze',
    body: 'You have been clearing notifications for a while. Would you like a notification reminding you to take a break?',
    cta: 'Yes',
  }),
];

const MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

/** Zen milestone achievements. Notifications too, naturally. */
export const zenPack: ContentPack = {
  defs: MILESTONES.map((gte): NotifDef => ({
    id: `zen_ach_${gte}`,
    kind: 'achievement',
    phase: 'zen',
    at: 'achievements/progress',
    icon: '🧘',
    title: `Zen Master ${gte}`,
    body: `You cleared ${gte} notifications in zen mode. They kept coming.`,
    interaction: 'view',
    trigger: { on: 'stat', stat: 'cleared', gte },
  })),
};
