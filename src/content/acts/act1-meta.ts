import type { NotifDef } from '../../engine/types';
import { ach, after, item, on, popup, stat } from '../helpers';

const VISITS: [string, string, string][] = [
  ['collection', 'Collector-ish', 'You opened your Collection.'],
  ['shop', 'Window Shopper', 'You opened the Shop. We noticed.'],
  ['quests', 'Quest Giver Giver', 'You looked at your Quests.'],
  ['pass', 'Pass Holder (Free)', 'You looked at the Battle Pass.'],
  ['mail', "You've Got Mail", 'You opened your Mail.'],
  ['friends', 'Socialite', 'You opened your Friends list.'],
  ['news', 'Well Informed', 'You read the News. Or at least opened it.'],
  ['settings', 'Tinkerer', 'You opened Settings. Nothing in there works.'],
  ['profile', 'Self Reflection', 'You looked at your own Profile.'],
  ['login', 'Calendar Enjoyer', 'You looked at the Daily Login calendar.'],
];

export const act1: NotifDef[] = [
  // Counting achievements. These are the spine of the joke.
  ach(
    'ach_cleared10',
    'progress',
    'Ten Down',
    'You cleared 10 notifications.',
    stat('cleared', 10),
  ),
  ach(
    'ach_cleared25',
    'progress',
    'Notification Novice',
    'You cleared 25 notifications.',
    stat('cleared', 25),
  ),
  ach(
    'ach_cleared50',
    'progress',
    'Fifty Shades of Red',
    'You cleared 50 notifications.',
    stat('cleared', 50),
  ),
  ach(
    'ach_cleared100',
    'progress',
    'Centurion',
    'You cleared 100 notifications.',
    stat('cleared', 100),
  ),
  ach(
    'ach_cleared150',
    'progress',
    'Sesquicentennial',
    'You cleared 150 notifications. Look it up.',
    stat('cleared', 150),
  ),
  ach(
    'ach_halfway',
    'progress',
    'Halfway There?',
    "You're 50% done! (Estimate updated: you're 34% done.)",
    stat('cleared', 85),
  ),
  ach(
    'ach_hunter10',
    'meta',
    'Achievement Hunter',
    'You unlocked 10 achievements.',
    stat('achievements', 10),
  ),
  ach(
    'ach_hunter20',
    'meta',
    'Achievement Achievement Achievement',
    'You unlocked 20 achievements.',
    stat('achievements', 20),
  ),
  ach(
    'ach_hunter30',
    'meta',
    'Overachiever',
    'You unlocked 30 achievements. This is one of them.',
    stat('achievements', 30),
  ),
  ach(
    'ach_level5',
    'progress',
    'Level 5',
    'You reached level 5 without playing a single match.',
    stat('level', 5),
  ),
  ach(
    'ach_rich',
    'progress',
    'Moderately Wealthy',
    'You have 200 gold. You cannot spend it on anything.',
    stat('gold', 200),
  ),

  ach(
    'ach_level10',
    'progress',
    'Double Digits',
    'You reached level 10. Something has been unlocked.',
    stat('level', 10),
  ),
  ach(
    'ach_gems',
    'progress',
    'Gem Hoarder',
    'You have 10 gems. A gem costs 1/100th of a bundle.',
    stat('gems', 10),
  ),
  ach(
    'ach_streak',
    'general',
    'Login Streak: 1 Day!',
    'You have logged in 1 day in a row.',
    after('boot_login'),
  ),

  // Visiting menus.
  ...VISITS.map(([menu, title, body]) =>
    ach(`ach_visit_${menu}`, 'general', title, body, on(`visit:${menu}`)),
  ),

  // The summary notification that counts itself.
  popup('notif_summary', 'Notification Summary', stat('cleared', 40), {
    icon: '🔔',
    body: 'You have {active} unread notifications, including this one.',
    cta: 'Thanks',
  }),
  popup('notif_summary2', 'Notification Summary Summary', after('notif_summary'), {
    icon: '🔔',
    body: 'You have 1 unread notification summary. (Now 0. Great job!)',
    cta: 'Thanks?',
  }),
  ach(
    'ach_summary',
    'meta',
    'Read the Summary',
    'You read a summary of your notifications, and then a summary of that.',
    after('notif_summary2'),
  ),

  // Optional achievements for things players may or may not do.
  ach(
    'ach_welcomeback',
    'secret',
    'Welcome Back!',
    'You left and came back. The notifications waited for you.',
    on('tabReturn'),
  ),
  ach(
    'ach_muted',
    'secret',
    'Muted Us',
    'You turned the sound off. The red dots are silent, but they are still there.',
    on('mute'),
  ),
  ach(
    'ach_hint',
    'secret',
    'Needed a Hint',
    'You stopped for a moment and we pointed at a dot for you.',
    on('hintShown'),
  ),
  ach('ach_play', 'secret', 'Tried to Play the Game', 'You clicked Play. Bold.', on('clickedPlay')),
  popup('play_unavailable', 'Matchmaking Unavailable', on('clickedPlay'), {
    icon: '⛔',
    body: 'Matchmaking is temporarily unavailable while you have unread notifications.',
    cta: 'Understood',
  }),
  popup('prefs_saved', 'Preferences Saved', on('touchedPrefs'), {
    icon: '🔔',
    body: 'Your notification preferences have been saved. You will be notified when they take effect.',
    cta: 'OK',
  }),
  item(
    'prefs_effect',
    'settings/notifications',
    'Your notification preferences have taken effect',
    after('prefs_saved'),
    {
      icon: '✅',
      delayMs: 5000,
      body: 'Nothing has changed.',
    },
  ),
  ach(
    'ach_avatar',
    'secret',
    'New Look',
    'You changed your avatar. Your friends will be notified.',
    on('setAvatar'),
  ),
  ach(
    'ach_volume',
    'secret',
    'Adjusted the Volume',
    'You found the volume slider. It goes to 100. We checked.',
    on('adjustedVolume'),
  ),
];
