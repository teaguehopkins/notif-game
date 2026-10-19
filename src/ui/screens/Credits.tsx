import { useEffect, useRef, useState } from 'preact/hooks';
import { FINALE_CREDITS } from '../../content/finale';
import { Badge } from '../components/Badge';
import { FocusButton } from '../components/FocusButton';
import { game, useEngine } from '../game';
import { fx } from '../fx';
import { prefersReducedMotion } from '../motion';

const CREDITS: [string, string[]][] = [
  ['Legends of Loot', ['A game about clearing notifications', 'Made by Zen Wombat']],
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
  return useEngine().isActive(FINALE_CREDITS) ? <CreditsRoll /> : null;
}

function CreditsRoll() {
  const [reduced] = useState(prefersReducedMotion);
  const [ended, setEnded] = useState(reduced);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div
      ref={ref}
      class="credits"
      role="dialog"
      aria-modal="true"
      aria-label="Credits"
      tabIndex={-1}
      // The only control is the dot at the end; keep Tab from wandering into the launcher behind.
      onKeyDown={(e) => e.key === 'Tab' && e.preventDefault()}
    >
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
        <FocusButton
          class="credits__dot"
          onClick={() => {
            fx.confetti(fx.origin(), 90);
            game.clear(FINALE_CREDITS);
          }}
        >
          1 New Notification
          <Badge count={1} />
        </FocusButton>
      )}
    </div>
  );
}
