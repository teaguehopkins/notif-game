import type { NotifDef } from '../../engine/types';
import { ach, after, afterAll, item, on, popup, start, stat } from '../helpers';

const TOS = `1. ACCEPTANCE. By scrolling this far you have already accepted these Terms.

2. NOTIFICATIONS. You agree to receive notifications. You agree to receive notifications about notifications. You may opt out of notifications by submitting a request, which will generate a notification.

3. RED DOTS. All red dots remain the property of Legends of Loot Interactive. Red dots are licensed, not sold. Red dots may be revoked, reissued, or moved slightly to the left.

4. ACHIEVEMENTS. Achievements have no monetary value and no other kind of value.

5. FUN. Fun is not guaranteed. Fun may be scheduled for a future update.

6. ARBITRATION. Any disputes will be settled by a Daily Quest.

7. CHANGES. We may change these Terms at any time. When we do, we will let you know with a notification.

8. SEVERABILITY. If any part of these Terms is found to be unenforceable, it will be replaced with a red dot.

9. ENTIRE AGREEMENT. These Terms, the Privacy Policy, the Cookie Policy, the Notification Policy, and the Policy Policy constitute the entire agreement.

10. THANK YOU. Thank you for reading the Terms of Service. Nobody does this. We're touched.`;

const PRIVACY = `We've updated our Privacy Policy to better explain how we use the data we collected under the previous Privacy Policy.

WHAT WE COLLECT: Which red dots you click. How long you hesitate before clicking them. Which red dots you don't click, and why (we'll guess).

HOW WE USE IT: To send you better notifications. Notifications that know you. Notifications that care.

WHO WE SHARE IT WITH: Our Notification Partners™, a group of 1,412 companies, each of which also has a Privacy Policy that was recently updated.

YOUR RIGHTS: You have the right to request a copy of your data. It will arrive as a notification.`;

const PATCH = `PATCH NOTES v4.20.1

GENERAL
• Fixed a bug where players could clear all notifications.
• Red dots are now 12% redder.
• Notification badges now appear 40ms faster.

ACHIEVEMENTS
• Added 31 new achievements for unlocking achievements.
• "First Achievement" can now be earned for the first time.

GAMEPLAY
• Gameplay is temporarily disabled while we focus on notifications.

KNOWN ISSUES
• Some players have reported seeing the gameplay. We are investigating.`;

export const act0: NotifDef[] = [
  popup('boot_welcome', 'Welcome to Legends of Loot!', start(), {
    icon: '⚔️',
    body: "We're so glad you're here. Before you play, there are just a few quick things.",
    cta: "Let's go!",
  }),
  popup('boot_tos', 'Terms of Service Updated', start(), {
    icon: '📜',
    interaction: 'scroll',
    body: TOS,
    cta: 'Accept',
  }),
  popup('boot_patch', 'Patch Notes v4.20.1', start(), {
    icon: '🛠️',
    interaction: 'scroll',
    outcomes: ['read', 'skip'],
    body: PATCH,
    cta: 'Got it',
  }),
  popup('boot_login', 'Daily Login Reward: Day 1!', start(), {
    icon: '📅',
    interaction: 'chest',
    body: "You logged in! Here's 10 gold for doing the bare minimum.",
    rewards: { gold: 10 },
    cta: 'Claim',
  }),
  popup('boot_privacy', 'Privacy Policy Updated', after('boot_tos'), {
    icon: '🔏',
    interaction: 'scroll',
    body: PRIVACY,
    cta: 'Accept',
  }),
  popup('boot_cookies', 'We Use Cookies 🍪', after('boot_privacy'), {
    icon: '🍪',
    interaction: 'choice',
    outcomes: ['Accept All', 'Manage Preferences'],
    body: 'We use cookies to improve your experience. Your experience is cookies.',
  }),
  popup(
    'boot_cookies_manage',
    'Manage Cookie Preferences',
    after('boot_cookies', 'Manage Preferences'),
    {
      icon: '🍪',
      body: 'Essential cookies: ON (required)\nAnalytics cookies: ON (required)\nMarketing cookies: ON (required)\nGary cookies: ON (required)',
      cta: 'Confirm My Choices',
    },
  ),
  popup('boot_maint', 'Scheduled Maintenance', after('boot_login'), {
    icon: '🚧',
    body: 'Servers will be down for maintenance on March 3, 2019 from 02:00–04:00 UTC. We apologize for any inconvenience this may have caused.',
    cta: 'OK',
  }),

  // "What's New" carousel: each slide is its own popup with its own dot.
  ...[
    [
      'New: Notifications!',
      'Stay up to date with everything that happens, as it happens, constantly.',
    ],
    [
      'New: Notification Badges',
      'See at a glance which menus contain something you have not looked at yet.',
    ],
    ['New: Achievements', 'Earn achievements for doing things, including earning achievements.'],
    ['New: Battle Pass', 'A pass. For battles. Which are coming soon.'],
    ["New: What's New", "This screen, which tells you what's new."],
  ].map(([title, body], i, all) =>
    popup(
      `boot_new${i + 1}`,
      `What's New (${i + 1}/${all.length}): ${title}`,
      i === 0 ? after('boot_maint') : after(`boot_new${i}`),
      {
        icon: '✨',
        body,
        cta: i === all.length - 1 ? 'Done' : 'Next',
      },
    ),
  ),

  popup(
    'tut_tip',
    'Tip: Red dots mean something new!',
    afterAll('boot_new5', 'boot_cookies', 'boot_welcome', 'boot_patch'),
    {
      icon: '🔴',
      body: 'Click on menus with a red dot to see what is new. Clear them all to... well, you will see.',
      cta: 'Got it',
    },
  ),

  item('login_day2', 'login', 'Day 2 Reward: Come back tomorrow!', after('boot_login'), {
    icon: '🔒',
    body: '25 gold. Available in 23:59:59.',
  }),
  item('login_day7', 'login', 'Day 7 Bonus: Come back in 6 days!', after('boot_login'), {
    icon: '🔒',
    body: 'A Mystery Chest. The mystery is what is in it.',
  }),
  item('login_day28', 'login', 'Day 28: LEGENDARY REWARD', after('boot_login'), {
    icon: '🔒',
    body: 'Log in 27 more days in a row to unlock: a Legendary Notification.',
  }),

  ach(
    'ach_opened',
    'general',
    'Opened the Game',
    'You opened the game for the first time.',
    start(),
  ),
  ach(
    'ach_first',
    'meta',
    'First Achievement',
    'You got your first achievement.',
    stat('achievements', 1),
  ),
  ach(
    'ach_cleared1',
    'meta',
    'Cleared a Notification',
    'You cleared a notification.',
    stat('cleared', 1),
  ),
  ach(
    'ach_speedreader',
    'general',
    'Speed Reader',
    'You skipped the patch notes. They were good, too.',
    after('boot_patch', 'skip'),
  ),
  ach(
    'ach_readnotes',
    'general',
    'Actually Read the Patch Notes',
    'You scrolled all the way down. Respect.',
    after('boot_patch', 'read'),
  ),
  ach(
    'ach_cookies',
    'general',
    'Cookie Monster',
    'You accepted all cookies.',
    after('boot_cookies', 'Accept All'),
  ),
  ach(
    'ach_dot',
    'meta',
    'Clicked a Red Dot',
    'You clicked on a red dot. There are more.',
    on('clickedDot'),
  ),
  ach(
    'ach_looked',
    'meta',
    'Looked at Your Achievements',
    'You opened the Achievements page. This unlocked an achievement.',
    on('visit:achievements'),
  ),
];
