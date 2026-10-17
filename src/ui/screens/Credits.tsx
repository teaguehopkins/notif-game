import { useState } from 'preact/hooks';
import { FINALE_CREDITS } from '../../content/finale';
import { Badge } from '../components/Badge';
import { game, useEngine } from '../game';
import { prefersReducedMotion } from '../motion';

const CREDITS: [string, string[]][] = [
  ['Clear All', ['A game about clearing notifications']],
  ['Notification Design', ['The Red Dot', 'Another Red Dot', 'A Slightly Larger Red Dot']],
  ['Achievement Design', ['An Achievement for Designing Achievements']],
  ['Legal', ['Terms of Service (Updated)', 'Privacy Policy (Updated)', 'Cookie Policy (Required)']],
  ['Community', ['xX_Gary_Xx', 'Gary2', 'The <CLEAR ALL GANG>']],
  [
    'Special Thanks',
    ['Every launcher that greets you with 14 popups', 'You, for clearing them all'],
  ],
  ['No notifications were harmed', ['(Several were marked as read)']],
];

export function Credits() {
  useEngine();
  const [reduced] = useState(prefersReducedMotion);
  const [ended, setEnded] = useState(reduced);
  if (!game.engine.isActive(FINALE_CREDITS)) return null;
  return (
    <div class="credits" role="dialog" aria-modal="true" aria-label="Credits">
      <div
        class={reduced ? 'credits__roll credits__roll--static' : 'credits__roll'}
        onAnimationEnd={() => setEnded(true)}
      >
        {CREDITS.map(([role, names]) => (
          <section key={role}>
            <h2>{role}</h2>
            {names.map((n) => (
              <p key={n}>{n}</p>
            ))}
          </section>
        ))}
      </div>
      {ended && (
        <button class="credits__dot" onClick={() => game.clear(FINALE_CREDITS)} autoFocus>
          1 New Notification
          <Badge count={1} />
        </button>
      )}
    </div>
  );
}
