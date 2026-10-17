import type { NotifDef } from '../../engine/types';
import { ach, after, afterAll, afterAny, currency, item, on, popup, stat } from '../helpers';

const PROFILE_STEPS = [
  ['Complete Your Profile (20%)', 'Add an avatar to get to 40%!'],
  ['Complete Your Profile (40%)', 'Add a bio to get to 60%! (Bios are disabled.)'],
  ['Complete Your Profile (60%)', 'Link your Gary account to get to 80%!'],
  ['Complete Your Profile (80%)', 'Confirm that your profile is complete to get to 100%!'],
];

const FESTIVAL_CARDS: [string, string][] = [
  ['Pumpkin Knight', '4 mana 4/4. Rots after the event.'],
  ['Haunted Hay Bale', '2 mana 0/5. Spooky. Taunt.'],
  ['Cider Elemental', '3 mana 3/3. Seasonal.'],
  ['Gourd of Notifications', '5 mana. Fill your hand with notifications.'],
  ['The Harvest Moon', '8 mana 8/8. Legendary. Only rises during events.'],
];

export const act3: NotifDef[] = [
  // Mark All As Read: the trap.
  popup('markall_unlocked', 'New Feature: Mark All As Read!', stat('level', 10), {
    icon: '🧹',
    body: 'Clear all of your notifications at once with the new Mark All As Read button, up at the top. Surely this will help.',
    cta: 'Amazing',
  }),
  ach(
    'ach_markall',
    'secret',
    'Used Mark All As Read',
    'You marked everything as read without reading it.',
    on('usedMarkAll'),
  ),
  popup('markall_fomo', 'FOMO Alert', on('usedMarkAll'), {
    icon: '😱',
    body: 'You missed {markedAllRead} things! Some of them might have been important. (None of them were.)',
    cta: 'Oh no',
  }),
  item('markall_removed', 'news', 'Mark All As Read Has Been Removed', on('usedMarkAll'), {
    icon: '🧹',
    delayMs: 4000,
    body: 'Based on player feedback, Mark All As Read has been removed. Thank you for your feedback.',
  }),

  // Mail
  item('mail_miss', 'mail', 'We Miss You! Come Back for 100 Gold', stat('cleared', 45), {
    icon: '🥺',
    interaction: 'dismiss',
    body: "It's been 4 minutes. Is everything OK? Here's some gold.",
    rewards: { gold: 100 },
    cta: 'Claim',
  }),
  item('mail_survey', 'mail', 'Your Feedback Matters!', stat('cleared', 50), {
    icon: '📋',
    interaction: 'choice',
    outcomes: ['Take Survey', 'No Thanks'],
    body: 'Help us make notifications better by answering a 45-minute survey.',
  }),
  popup('survey_thanks', 'Thanks for Your Feedback!', after('mail_survey', 'Take Survey'), {
    icon: '📋',
    body: 'Your feedback has been received and filed.',
    cta: 'OK',
  }),
  item('mail_rere', 'mail', 'Re: Re: Re: Fwd: Your Account', after('mail_survey'), {
    icon: '✉️',
    body: 'Please disregard the previous email. And this one.',
  }),
  item('mail_verify', 'mail', 'Verify Your Email Address', after('acct_verify'), {
    icon: '📧',
    body: 'Click here to verify your email. You did. It is verified.',
  }),
  popup('rate_us', 'Enjoying Legends of Loot?', stat('cleared', 60), {
    icon: '⭐',
    interaction: 'choice',
    outcomes: ['1★', '2★', '3★', '4★', '5★'],
    body: 'Rate us!',
  }),
  popup('rate_sorry', "We're Sorry to Hear That", after('rate_us', ['1★', '2★', '3★', '4★']), {
    icon: '😢',
    body: 'Please tell us more about what you did not enjoy, in a notification.',
    cta: 'Submit',
  }),
  popup('rate_store', 'Thanks! Leave a Review on the Store?', after('rate_us', '5★'), {
    icon: '🌟',
    interaction: 'snooze',
    body: 'It only takes a minute, plus the time to find your password.',
    cta: 'Sure',
  }),

  // Gary
  item(
    'gary_request',
    'friends/requests',
    'xX_Gary_Xx Wants to Be Your Friend',
    stat('cleared', 55),
    {
      icon: '🧔',
      interaction: 'choice',
      outcomes: ['Accept', 'Decline'],
      body: 'Mutual friends: 0. Mutual notifications: 214.',
    },
  ),
  popup('gary_gift', 'Gary Sent You a Gift!', after('gary_request', 'Accept'), {
    icon: '🎁',
    interaction: 'chest',
    body: 'It is 5 gold. Gary thought of you.',
    rewards: { gold: 5 },
    cta: 'Open',
  }),
  item('gary_giftback', 'friends/online', 'Send Gary a Gift Back?', after('gary_gift'), {
    icon: '🎁',
    interaction: 'choice',
    outcomes: ['Send Gift', 'Not Now'],
    body: 'Gary is waiting. Gary is always waiting.',
  }),
  item('gary_sad', 'friends/requests', 'Gary Is Sad.', after('gary_request', 'Decline'), {
    icon: '😞',
    body: 'xX_Gary_Xx has been notified that you declined.',
  }),
  ach(
    'ach_friend',
    'social',
    'Made a Friend',
    'You accepted a friend request from a stranger named Gary.',
    after('gary_request', 'Accept'),
  ),
  ach(
    'ach_lonewolf',
    'social',
    'Lone Wolf',
    'You declined Gary.',
    after('gary_request', 'Decline'),
  ),
  item(
    'gary_online',
    'friends/online',
    'xX_Gary_Xx Is Now Online',
    afterAny('gary_giftback', 'gary_sad'),
    {
      icon: '🟢',
      delayMs: 4000,
    },
  ),
  item('gary_offline', 'friends/online', 'xX_Gary_Xx Is Now Offline', after('gary_online'), {
    icon: '⚫',
    delayMs: 6000,
  }),
  item('gary_cousin', 'friends/requests', 'People You May Know: Gary2', after('gary_online'), {
    icon: '🧔',
    body: "Gary's cousin. Also named Gary.",
  }),
  item(
    'guild_invite',
    'friends/guild',
    '<CLEAR ALL GANG> Invited You to Join!',
    stat('cleared', 90),
    {
      icon: '🛡️',
      interaction: 'choice',
      outcomes: ['Join', 'Decline'],
      body: 'A guild for people who clear all notifications. 3 members, 1 of whom is Gary.',
    },
  ),
  item('guild_motd', 'friends/guild', 'Guild Message of the Day', after('guild_invite', 'Join'), {
    icon: '📣',
    body: '"clear ur dots" (Gary)',
  }),
  ach(
    'ach_guild',
    'social',
    'Guild Member',
    'You joined a guild. The guild has notifications.',
    after('guild_invite', 'Join'),
  ),

  // Harvest Festival: a whole new tab with its own currency, pass, quests and shop.
  popup('event_begins', 'The Harvest Festival Has Begun!', stat('cleared', 80), {
    icon: '🎃',
    body: 'A new event tab has appeared! It has its own currency, its own pass, its own quests, and its own shop. Enjoy!',
    cta: 'Yay',
  }),
  item('event_countdown', 'event/eventQuests', 'Event Ends In 2:59:59!', after('event_begins'), {
    icon: '⏰',
    body: 'Hurry! (The timer is decorative.)',
  }),
  ...[
    ['Festival Quest: Visit the Festival', 'You did it. You are here.'],
    ['Festival Quest: Look at a Pumpkin', 'There is a pumpkin on the next screen. Probably.'],
    ['Festival Quest: Claim This Quest', 'This quest is complete when you claim it.'],
  ].map(([title, body], i) =>
    item(`event_quest${i + 1}`, 'event/eventQuests', title as string, after('event_begins'), {
      icon: '🌾',
      interaction: 'dismiss',
      body,
      rewards: { tokens: 10, xp: 30 },
      cta: 'Claim',
    }),
  ),
  currency('tokens', 'Harvest Tokens', '🌽'),
  popup('event_pumpkin', 'A Giant Pumpkin Appeared!', after('event_quest2'), {
    icon: '🎃',
    interaction: 'hold',
    body: 'Hold the button to harvest it. Harvesting takes time. Like a real harvest.',
    rewards: { tokens: 20, xp: 50 },
    cta: 'Hold to Harvest',
  }),
  ...['Hay Bale', 'Apple Cider', 'Scarecrow Emote', 'Pumpkin Card Back'].map((reward, i) =>
    item(
      `event_pass${i + 1}`,
      'event/eventPass',
      `Festival Pass Tier ${i + 1}: ${reward}`,
      stat('tokens', 10 + i * 10),
      {
        icon: '🍂',
        interaction: 'dismiss',
        rewards: { xp: 30 },
        cta: 'Claim',
      },
    ),
  ),
  ach(
    'ach_festival',
    'general',
    'Festival Goer',
    'You claimed every Festival Pass tier. The festival continues forever.',
    afterAll('event_pass1', 'event_pass2', 'event_pass3', 'event_pass4'),
  ),
  ...['Pumpkin Card Back', 'Gourd Avatar', 'Hay Emote'].map((thing, i) =>
    item(`event_shop${i + 1}`, 'event/eventShop', `NEW! ${thing}`, after('event_quest1'), {
      icon: '🥧',
      body: `${(i + 1) * 500} Harvest Tokens.`,
    }),
  ),
  popup('event_reminder', "Don't Forget the Harvest Festival!", after('event_pumpkin'), {
    icon: '🎃',
    interaction: 'dodgeX',
    body: 'Just a friendly reminder that the event you are currently looking at is happening right now.',
  }),

  item('event_pack', 'event/eventShop', 'Free Festival Pack!', stat('tokens', 30), {
    icon: '🎃',
    interaction: 'pack',
    body: 'Contains 5 seasonal cards that will be rotated out of the game in 3 weeks.',
    rewards: { xp: 50 },
    cta: 'Open Pack',
  }),
  ...FESTIVAL_CARDS.map(([title, body], i) =>
    item(`fcard_${i + 1}`, 'collection/cards', `NEW: ${title}`, after('event_pack'), {
      icon: '🎃',
      body,
    }),
  ),
  ach(
    'ach_coll2',
    'progress',
    'Collection 2% Complete',
    'Twice as complete as before.',
    afterAll('fcard_1', 'fcard_2', 'fcard_3', 'fcard_4', 'fcard_5'),
  ),
  ach(
    'ach_pumpkin',
    'general',
    'Pumpkin Harvester',
    'You held a button for 1.5 seconds.',
    after('event_pumpkin'),
  ),
  item('news_recap', 'news', 'Event Recap: Harvest Festival (Ongoing)', after('event_begins'), {
    icon: '📰',
    body: 'Here is everything that has happened so far in the event you are currently in.',
  }),

  // Settings and account
  item(
    'settings_prefs',
    'settings/notifications',
    'New Setting: Notification Preferences!',
    stat('cleared', 20),
    {
      icon: '🔔',
      body: 'Control which notifications you receive. (Coming soon.)',
    },
  ),
  item(
    'settings_audio',
    'settings/audio',
    'Audio Settings Are Now 40% More Audio',
    after('settings_prefs'),
    { icon: '🔊' },
  ),
  item('acct_verify', 'settings/account', 'Verify Your Email', stat('cleared', 65), {
    icon: '📧',
    interaction: 'confirm',
    body: 'We sent you an email. Check your mail. (The in-game mail.)',
  }),
  item('acct_2fa', 'settings/account', 'Enable Two-Factor Notifications?', after('acct_verify'), {
    icon: '🔐',
    interaction: 'snooze',
    body: 'Get two notifications for every notification, for your security.',
    cta: 'Enable',
  }),
  ...PROFILE_STEPS.map(([title, body], i) =>
    item(
      `profile_${i + 1}`,
      'profile',
      title as string,
      i === 0 ? stat('cleared', 35) : after(`profile_${i}`),
      {
        icon: '🪪',
        interaction: 'dismiss',
        body,
        cta: 'Continue',
      },
    ),
  ),
  ach(
    'ach_profile',
    'general',
    'Completionist',
    'Your profile is 100% complete. Your profile is not visible to anyone.',
    after('profile_4'),
  ),

  // News
  item('news_patch', 'news', 'Patch Notes v4.20.2', stat('cleared', 75), {
    icon: '📰',
    body: 'Notifications can now notify you about other notifications.',
  }),
  item('news_dev', 'news', 'Developer Update: We Hear You', after('news_patch'), {
    icon: '🎙️',
    interaction: 'confirm',
    body: 'We hear you about the notifications. We have made a notification about it.',
  }),
  item('news_spotlight', 'news', 'Community Spotlight: Gary', after('gary_request'), {
    icon: '🌟',
    body: 'This week we are shining a light on Gary.',
  }),

  // Ad gag #2
  popup('ad_double', 'Double Your Rewards!', stat('cleared', 70), {
    icon: '📺',
    interaction: 'tinyX',
    body: 'Watch one short ad to double the reward you got from your last notification!',
  }),
];
