import type { NotifDef, Rarity } from '../../engine/types';
import { ach, after, afterAll, currency, item, popup, stat } from '../helpers';

const PACK_CARDS: [string, string, string, Rarity][] = [
  [
    'Gobbo the Mildly Inconvenient',
    '1 mana 1/1. Battlecry: Send your opponent a notification.',
    '👺',
    'common',
  ],
  ['Sir Clicksalot', '3 mana 2/4. Whenever you click something, gain +0/+0.', '🛡️', 'common'],
  ['Dot Elemental', '2 mana 3/2. Cannot be cleared.', '🔴', 'rare'],
  ['Badge Golem', '6 mana 6/6. Has a little red dot on it.', '🗿', 'epic'],
  ['The Notifimancer', '9 mana 1/1. Legendary. Summons 30 notifications.', '🧙', 'legendary'],
];

const LEVELS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

export const act2: NotifDef[] = [
  // Mail delivers a key, the key opens a chest, the chest gives gold, the gold makes the shop light up...
  item('mail_welcome', 'mail', 'Welcome, Commander!', after('tut_tip'), {
    icon: '✉️',
    body: 'Welcome to the Legends of Loot community! Please read this message to mark it as read.',
  }),
  item('mail_gift', 'mail', 'A Gift from the Developers 🎁', after('tut_tip'), {
    icon: '🗝️',
    interaction: 'dismiss',
    body: "Here's a Chest Key, as a thank-you for being you. You'll find the chest in the Shop.",
    cta: 'Collect Attachment',
  }),
  item('shop_chest', 'shop/featured', 'Free Chest! (Key Required)', after('mail_gift'), {
    icon: '🧰',
    interaction: 'chest',
    body: 'You have a key! Open the chest!',
    rewards: { gold: 100, xp: 100 },
    cta: 'Open',
  }),
  currency('gold', 'Gold', '🪙'),
  item('shop_afford', 'shop/featured', 'You can afford something!', stat('gold', 100), {
    icon: '💸',
    body: 'Specifically: a Free Pack. It was free, but now you can afford it.',
  }),
  item('shop_freepack', 'shop/packs', 'Free Pack!', after('shop_afford'), {
    icon: '📦',
    interaction: 'pack',
    body: 'Contains 5 cards. Results may vary.',
    rewards: { xp: 50 },
    cta: 'Open Pack',
  }),
  ...PACK_CARDS.map(([title, body, icon, rarity], i) =>
    item(`card_${i + 1}`, 'collection/cards', `NEW: ${title}`, after('shop_freepack'), {
      icon,
      body,
      rarity,
    }),
  ),
  item(
    'card_dupe',
    'collection/cards',
    'Duplicate: Dot Elemental. You can disenchant this!',
    after('shop_freepack'),
    {
      icon: '🔴',
      interaction: 'choice',
      outcomes: ['Disenchant', 'Keep'],
      body: '2 mana 3/2. A second copy. Disenchanting gives you Dust, a new currency.',
      // It glows legendary in the pack. It is not.
      rarity: 'legendary',
    },
  ),
  popup('dust_reward', 'Disenchanted!', after('card_dupe', 'Disenchant'), {
    icon: '✨',
    body: 'You received 5 Dust. Crafting a card costs 400 Dust.',
    rewards: { dust: 5 },
    cta: 'OK',
  }),
  currency('dust', 'Dust', '✨'),
  ach(
    'ach_coll1',
    'progress',
    'Collection 1% Complete',
    'You own 1% of all cards. Only 99% to go!',
    afterAll('card_1', 'card_2', 'card_3', 'card_4', 'card_5'),
  ),
  item('deck_incomplete', 'collection/decks', 'You have an incomplete deck!', after('ach_coll1'), {
    icon: '🗃️',
    interaction: 'choice',
    outcomes: ['Auto-Complete', 'Later'],
    body: 'Your deck has 5 cards. Decks need 30 cards.',
  }),
  popup('deck_done', 'Deck Complete!', after('deck_incomplete', 'Auto-Complete'), {
    icon: '🗃️',
    body: 'Your deck is now 26 copies of Gobbo the Mildly Inconvenient and 4 other cards.',
    cta: 'Perfect',
  }),

  item('cardback_ember', 'collection/cardBacks', 'NEW Card Back: Ember', after('shop_chest'), {
    icon: '🔥',
    body: 'It glows. Faintly.',
  }),
  item('cardback_classic', 'collection/cardBacks', 'NEW Card Back: Classic', after('shop_chest'), {
    icon: '🎴',
    body: 'You already had this one. Now it is new.',
  }),
  item(
    'avatar_tired',
    'collection/avatars',
    'NEW Avatar: Exhausted Adventurer',
    after('shop_chest'),
    { icon: '😮‍💨', body: 'Relatable.' },
  ),
  item(
    'emote_wp',
    'collection/emotes',
    'NEW Emote: "Well played... notifications."',
    after('shop_freepack'),
    { icon: '💬' },
  ),
  item('emote_oops', 'collection/emotes', 'NEW Emote: "Oops."', after('shop_freepack'), {
    icon: '💬',
  }),

  popup('shop_offer', 'LIMITED TIME: 92% OFF!', after('shop_freepack'), {
    icon: '🤑',
    interaction: 'tinyX',
    delayMs: 3000,
    body: 'The Mega Ultra Bundle is now just $103.99 (was $1,299.99). Watch a short ad to get it 2% cheaper!',
  }),
  popup('ad_thanks', 'Thanks for Watching!', after('shop_offer', 'ad'), {
    icon: '📺',
    body: "Here's 1 gold for your time. Your time is worth 1 gold.",
    rewards: { gold: 1 },
    cta: 'Great',
  }),
  ach(
    'ach_ad',
    'secret',
    'Watched an Ad',
    'You watched an ad for a notification app. Inside a notification.',
    after('shop_offer', 'ad'),
  ),
  item(
    'shop_starter',
    'shop/bundles',
    'Starter Bundle: First 72 Hours Only!',
    stat('cleared', 30),
    {
      icon: '⏳',
      body: 'Expires in 71:58:12. Never again will you be a beginner.',
    },
  ),
  item('shop_bell', 'shop/featured', 'NEW! Golden Notification Bell', after('shop_afford'), {
    icon: '🔔',
    body: 'Makes your notifications golden. 2,000 gems.',
  }),
  item('shop_dot', 'shop/featured', 'NEW! Extra Red Dot (Cosmetic)', after('shop_afford'), {
    icon: '🔴',
    body: 'Purely cosmetic. Does nothing. Very red.',
  }),
  item('shop_mute', 'shop/featured', 'NEW! Mute Button (Premium)', after('shop_afford'), {
    icon: '🔇',
    body: 'Coming soon.',
  }),

  // Quests
  item(
    'quest_daily1',
    'quests/daily',
    'New Daily Quest: Clear 10 Notifications',
    after('tut_tip'),
    {
      icon: '📜',
      body: 'Progress: tracking...',
    },
  ),
  item(
    'quest_daily1_done',
    'quests/daily',
    'Quest Complete: Clear 10 Notifications!',
    afterAll('quest_daily1', 'ach_cleared25'),
    {
      icon: '✅',
      interaction: 'dismiss',
      body: 'Reward: 50 gold and 100 XP.',
      rewards: { gold: 50, xp: 100 },
      cta: 'Claim',
    },
  ),
  item(
    'quest_daily2',
    'quests/daily',
    'New Quest Available: Clear 20 More Notifications',
    after('quest_daily1_done'),
    {
      icon: '📜',
      body: 'Same as last time, but more.',
    },
  ),
  popup('quest_reroll', 'You Can Reroll a Quest!', after('quest_daily2'), {
    icon: '🎲',
    interaction: 'snooze',
    body: 'You get one free quest reroll per day. Reroll "Clear 20 Notifications" into "Clear 20 Notifications"?',
    cta: 'Reroll',
  }),
  item(
    'quest_daily2_done',
    'quests/daily',
    'Quest Complete: Clear 20 More Notifications!',
    afterAll('quest_daily2', 'ach_cleared100'),
    {
      icon: '✅',
      interaction: 'dismiss',
      body: 'Reward: 100 XP and a sense of closure.',
      rewards: { xp: 100 },
      cta: 'Claim',
    },
  ),
  item('quest_weekly', 'quests/weekly', 'Weekly Quest: Log in 7 Days (1/7)', after('tut_tip'), {
    icon: '🗓️',
    body: 'This quest will be completable in 6 days.',
  }),

  // Battle pass
  popup('pass_begins', 'Season 1 Has Begun!', stat('level', 2), {
    icon: '🎖️',
    body: 'Season 1: Rise of the Red Dot. Earn rewards just by playing! (Playing is coming soon.)',
    cta: "Let's go!",
  }),
  ...[
    ['Tier 1: 25 Gold', { gold: 25 }],
    ['Tier 2: 10 Gems', { gems: 10 }],
    ['Tier 3: 100 XP', { xp: 100 }],
    ['Tier 4: 50 Pass XP', { passxp: 50 }],
    ['Tier 5: Season 1 Card Back', { xp: 50 }],
  ].map(([title, rewards], i) =>
    item(`pass_free${i + 1}`, 'pass/free', `${title as string}`, after('pass_begins'), {
      icon: '🥉',
      interaction: 'dismiss',
      rewards: rewards as Record<string, number>,
      cta: 'Claim',
    }),
  ),
  item('cardback_s1', 'collection/cardBacks', 'NEW Card Back: Season 1', after('pass_free5'), {
    icon: '🎴',
    body: 'Commemorating a season that has not ended.',
  }),
  ...['Golden Dot', 'Platinum Dot', 'Diamond Dot'].map((reward, i) =>
    item(
      `pass_prem${i + 1}`,
      'pass/premium',
      `Premium Tier ${i + 1}: ${reward} (Locked)`,
      after('pass_begins'),
      {
        icon: '👑',
        body: 'Upgrade to Premium to unlock! (No thanks)',
      },
    ),
  ),
  item('pass_ends', 'pass/free', 'Season 1 Ends in 89 Days!', after('pass_free5'), {
    icon: '⏳',
    body: 'Hurry! Claim your rewards before it is too late (in 89 days).',
  }),
  currency('gems', 'Gems', '💎'),
  currency('passxp', 'Pass XP', '🎖️'),

  ...LEVELS.map((n) =>
    popup(`level_${n}`, `Level Up! You Are Now Level ${n}`, stat('level', n), {
      icon: '⬆️',
      body:
        n === 10
          ? 'Level 10 unlocks a powerful new feature...'
          : `Only ${10 - n} levels until something happens!`,
      rewards: { gold: 10 },
      cta: 'Nice',
    }),
  ),
];
