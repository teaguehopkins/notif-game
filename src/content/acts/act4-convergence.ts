import type { NotifDef } from '../../engine/types';
import { ach, after, afterAll, item, popup, stat } from '../helpers';

/** Late stragglers tucked into menus the player has probably stopped checking. */
export const act4: NotifDef[] = [
  item('late_cardback', 'collection/cardBacks', 'NEW Card Back: Inbox Zero', stat('cleared', 130), {
    icon: '📭',
    body: 'An empty mailbox. Aspirational.',
  }),
  item('late_emote', 'collection/emotes', 'NEW Emote: "Are we done?"', stat('cleared', 140), {
    icon: '💬',
  }),
  ach(
    'ach_secret',
    'secret',
    'Found This One',
    'You found the achievement in the Secret tab. It was not much of a secret.',
    stat('cleared', 145),
  ),
  item(
    'late_starter',
    'shop/bundles',
    'Starter Bundle Expired',
    afterAll('shop_starter', 'ach_cleared100'),
    {
      icon: '⌛',
      body: 'You are no longer a beginner. Congratulations?',
    },
  ),
  item('late_weekly', 'quests/weekly', 'Weekly Quest Progress: Still 1/7', stat('cleared', 135), {
    icon: '🗓️',
    body: 'We just wanted to remind you.',
  }),
  popup('late_almost', 'You Are Almost Done!', stat('cleared', 155), {
    icon: '🏁',
    body: 'Only a few notifications left! (We think. We lost count.)',
    cta: 'Keep Going',
  }),
  item('late_lastmail', 'mail', 'One More Thing...', after('late_almost'), {
    icon: '✉️',
    body: 'That was the thing.',
  }),
];
