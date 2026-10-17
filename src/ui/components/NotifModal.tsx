import type { ComponentProps } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { MAX_SNOOZES } from '../../engine/engine';
import type { Instance, NotifDef } from '../../engine/types';
import { sfx } from '../../audio/sfx';
import { prefersReducedMotion } from '../motion';
import { Modal } from './Modal';

interface Props {
  inst: Instance;
  onClear: (outcome?: string) => void;
  onSnooze: () => void;
  /** Items opened from a menu can be closed without clearing; popups can't. */
  onClose?: () => void;
  /** What clearing this reveals (cards in a pack). */
  contents: NotifDef[];
  layer?: number;
}

const CURRENCIES: Record<string, string> = {
  gold: '🪙 Gold',
  gems: '💎 Gems',
  dust: '✨ Dust',
  xp: '⭐ XP',
  passxp: '🎖️ Pass XP',
  tokens: '🌽 Harvest Tokens',
};

export function formatRewards(rewards: Record<string, number> | undefined): string[] {
  return Object.entries(rewards ?? {}).map(([k, v]) => `+${v} ${CURRENCIES[k] ?? k}`);
}

export function NotifModal({ inst, onClear, onSnooze, onClose, contents, layer }: Props) {
  const def = inst.def;
  const interaction = def.interaction === 'view' || !def.interaction ? 'dismiss' : def.interaction;
  const finale = def.phase === 'finale';
  return (
    <Modal
      title={inst.title}
      icon={def.icon}
      onClose={onClose}
      variant={finale ? 'finale' : 'default'}
      layer={layer}
    >
      <Interaction
        key={`${def.id}:${inst.seq}`}
        kind={interaction}
        inst={inst}
        onClear={onClear}
        onSnooze={onSnooze}
        contents={contents}
      />
    </Modal>
  );
}

interface InteractionProps {
  kind: string;
  inst: Instance;
  onClear: (outcome?: string) => void;
  onSnooze: () => void;
  contents: NotifDef[];
}

function Interaction(p: InteractionProps) {
  switch (p.kind) {
    case 'scroll':
      return <ScrollGate {...p} />;
    case 'chest':
      return <Chest {...p} />;
    case 'pack':
      return <Pack {...p} />;
    case 'snooze':
      return <Snooze {...p} />;
    case 'tinyX':
      return <TinyX {...p} />;
    case 'dodgeX':
      return prefersReducedMotion() ? <Confirm {...p} /> : <DodgeX {...p} />;
    case 'hold':
      return <Hold {...p} />;
    case 'confirm':
      return <Confirm {...p} />;
    case 'choice':
      return <Choice {...p} />;
    default:
      return <Dismiss {...p} />;
  }
}

/** Focuses a button that appears mid-interaction, so keyboard focus isn't dropped. */
function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => ref.current?.focus(), []);
  return ref;
}

function FocusButton(props: ComponentProps<'button'>) {
  const ref = useFocusOnMount<HTMLButtonElement>();
  return <button ref={ref} {...props} />;
}

function Body({ text }: { text: string }) {
  return text ? <p class="modal__body">{text}</p> : null;
}

function Rewards({ def }: { def: NotifDef }) {
  const lines = formatRewards(def.rewards);
  if (lines.length === 0) return null;
  return (
    <ul class="rewards" aria-label="Rewards">
      {lines.map((l) => (
        <li key={l}>{l}</li>
      ))}
    </ul>
  );
}

function Dismiss({ inst, onClear }: InteractionProps) {
  return (
    <>
      <Body text={inst.body} />
      <Rewards def={inst.def} />
      <div class="modal__actions">
        <button class="btn btn--gold" onClick={() => onClear()}>
          {inst.def.cta ?? 'OK'}
        </button>
      </div>
    </>
  );
}

function Choice({ inst, onClear }: InteractionProps) {
  const outcomes = inst.def.outcomes ?? [];
  const stars = outcomes.every((o) => o.endsWith('★'));
  return (
    <>
      <Body text={inst.body} />
      <div class={stars ? 'modal__actions modal__actions--stars' : 'modal__actions'}>
        {outcomes.map((o, i) => (
          <button
            key={o}
            class={i === 0 && !stars ? 'btn btn--gold' : 'btn'}
            onClick={() => onClear(o)}
            aria-label={stars ? `${parseInt(o, 10)} stars` : undefined}
          >
            {o}
          </button>
        ))}
      </div>
    </>
  );
}

function ScrollGate({ inst, onClear }: InteractionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(false);
  const [declined, setDeclined] = useState(0);
  const outcomes = inst.def.outcomes;
  const check = () => {
    const el = ref.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setAtBottom(true);
  };
  useEffect(check, []);
  return (
    <>
      <div
        ref={ref}
        class="scroll-box"
        onScroll={check}
        tabIndex={0}
        aria-label="Document. Scroll to the bottom to continue."
      >
        {inst.body}
      </div>
      <p class="modal__hint" aria-live="polite">
        {atBottom ? 'Thank you for reading.' : 'Scroll to the bottom to continue.'}
        {declined > 0 && ` Declining is not supported (attempt ${declined}).`}
      </p>
      <div class="modal__actions">
        {outcomes?.includes('skip') ? (
          <button class="btn btn--link" onClick={() => onClear('skip')}>
            skip
          </button>
        ) : (
          <button
            class={declined ? 'btn shake' : 'btn'}
            key={declined}
            onClick={() => {
              sfx.error();
              setDeclined(declined + 1);
            }}
          >
            Decline
          </button>
        )}
        <button
          class="btn btn--gold"
          disabled={!atBottom}
          onClick={() => onClear(outcomes?.includes('read') ? 'read' : undefined)}
        >
          {inst.def.cta ?? 'Accept'}
        </button>
      </div>
    </>
  );
}

function Chest({ inst, onClear }: InteractionProps) {
  const [state, setState] = useState<'closed' | 'opening' | 'open'>('closed');
  const open = () => {
    setState('opening');
    setTimeout(
      () => {
        setState('open');
        sfx.coins();
      },
      prefersReducedMotion() ? 0 : 900,
    );
  };
  return (
    <>
      <Body text={inst.body} />
      <div class={`chest chest--${state}`} aria-hidden="true">
        {state === 'open' ? '✨' : inst.def.icon === '📅' ? '🎁' : '🧰'}
      </div>
      {state === 'open' && <Rewards def={inst.def} />}
      <div class="modal__actions">
        {state === 'open' ? (
          <FocusButton class="btn btn--gold" onClick={() => onClear()}>
            Collect
          </FocusButton>
        ) : (
          <button class="btn btn--gold" disabled={state === 'opening'} onClick={open}>
            {inst.def.cta ?? 'Open'}
          </button>
        )}
      </div>
    </>
  );
}

function Pack({ inst, onClear, contents }: InteractionProps) {
  const [revealed, setRevealed] = useState(-1);
  const opening = revealed >= 0;
  const done = revealed >= contents.length;
  useEffect(() => {
    if (!opening || done) return;
    const t = setTimeout(
      () => {
        setRevealed(revealed + 1);
        sfx.clear();
      },
      prefersReducedMotion() ? 50 : 450,
    );
    return () => clearTimeout(t);
  }, [revealed]);
  return (
    <>
      <Body text={inst.body} />
      {!opening ? (
        <div class="chest" aria-hidden="true">
          {inst.def.icon ?? '📦'}
        </div>
      ) : (
        <ul class="pack-cards" aria-live="polite">
          {contents.map((c, i) => (
            <li key={c.id} class={i < revealed ? 'pack-card pack-card--up' : 'pack-card'}>
              {i < revealed ? (
                <>
                  <span class="pack-card__icon">{c.icon ?? '🃏'}</span>
                  <span class="pack-card__name">{c.title.replace(/^NEW: /, '')}</span>
                </>
              ) : (
                <span class="pack-card__back" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
      )}
      <div class="modal__actions">
        {done ? (
          <FocusButton class="btn btn--gold" onClick={() => onClear()}>
            Done
          </FocusButton>
        ) : (
          <button class="btn btn--gold" disabled={opening} onClick={() => setRevealed(0)}>
            {inst.def.cta ?? 'Open'}
          </button>
        )}
      </div>
    </>
  );
}

function Snooze({ inst, onClear, onSnooze }: InteractionProps) {
  const canSnooze = inst.snoozes < MAX_SNOOZES;
  return (
    <>
      <Body text={inst.body} />
      {inst.snoozes > 0 && (
        <p class="modal__hint">You asked us to remind you later. It is later.</p>
      )}
      <div class="modal__actions">
        {canSnooze && (
          <button class="btn" onClick={onSnooze}>
            Remind Me Later
          </button>
        )}
        <button class="btn btn--gold" onClick={() => onClear()}>
          {canSnooze ? (inst.def.cta ?? 'OK') : 'Ugh, Fine'}
        </button>
      </div>
    </>
  );
}

function TinyX({ inst, onClear }: InteractionProps) {
  const [ad, setAd] = useState<number | null>(null);
  useEffect(() => {
    if (ad === null || ad <= 0) return;
    const t = setTimeout(() => setAd(ad - 1), 1000);
    return () => clearTimeout(t);
  }, [ad]);
  if (ad !== null) {
    return (
      <>
        <div class="fake-ad" role="img" aria-label="Advertisement">
          <div class="fake-ad__brand">🔔 NotifyMe Pro</div>
          <div class="fake-ad__copy">
            Never miss a notification again. Get notified about everything, all the time.
          </div>
          <div class="fake-ad__stars">★★★★★ "I get so many notifications now" (Gary)</div>
        </div>
        <div class="modal__actions">
          {ad > 0 ? (
            <button class="btn btn--gold" disabled>
              Reward in {ad}…
            </button>
          ) : (
            <FocusButton class="btn btn--gold" onClick={() => onClear('ad')}>
              Claim Reward
            </FocusButton>
          )}
        </div>
      </>
    );
  }
  return (
    <>
      <button class="tiny-x" onClick={() => onClear('x')} aria-label="No thanks, close">
        ✕
      </button>
      <Body text={inst.body} />
      <div class="modal__actions">
        <button class="btn btn--gold btn--huge" onClick={() => setAd(5)}>
          ▶ Watch Ad for 2× Reward
        </button>
      </div>
    </>
  );
}

const DODGE_SPOTS = ['dodge--tr', 'dodge--bl', 'dodge--tl', 'dodge--br'];
const MAX_DODGES = 2;

function DodgeX({ inst, onClear }: InteractionProps) {
  const [dodges, setDodges] = useState(0);
  const dodge = () => {
    if (dodges < MAX_DODGES) setDodges(dodges + 1);
  };
  return (
    <>
      <button
        class={`dodge-x ${DODGE_SPOTS[dodges % DODGE_SPOTS.length]}`}
        aria-label="Close"
        onPointerEnter={(e) => e.pointerType === 'mouse' && dodge()}
        onClick={() => (dodges < MAX_DODGES ? dodge() : onClear())}
      >
        ✕
      </button>
      <Body text={inst.body} />
      {dodges > 0 && (
        <p class="modal__hint">
          {dodges < MAX_DODGES ? 'Whoops!' : 'OK, OK. You can close it now.'}
        </p>
      )}
      <div class="modal__actions">
        <button class="btn btn--gold" onClick={() => sfx.error()}>
          Go to Festival
        </button>
      </div>
    </>
  );
}

const HOLD_MS = 1500;

function Hold({ inst, onClear }: InteractionProps) {
  const [progress, setProgress] = useState(0);
  const startedAt = useRef<number | null>(null);
  const raf = useRef(0);
  const begin = () => {
    if (startedAt.current !== null) return;
    startedAt.current = performance.now();
    const step = () => {
      if (startedAt.current === null) return;
      const p = Math.min((performance.now() - startedAt.current) / HOLD_MS, 1);
      setProgress(p);
      if (p >= 1) {
        startedAt.current = null;
        onClear();
      } else {
        raf.current = requestAnimationFrame(step);
      }
    };
    raf.current = requestAnimationFrame(step);
  };
  const end = () => {
    startedAt.current = null;
    cancelAnimationFrame(raf.current);
    setProgress(0);
  };
  useEffect(() => end, []);
  return (
    <>
      <Body text={inst.body} />
      <Rewards def={inst.def} />
      <div class="modal__actions">
        <button
          class="btn btn--gold btn--hold"
          style={{ '--progress': progress }}
          onPointerDown={begin}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
          onKeyDown={(e) =>
            (e.key === ' ' || e.key === 'Enter') && !e.repeat && (e.preventDefault(), begin())
          }
          onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && end()}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={`${inst.def.cta ?? 'Hold to claim'}. Press and hold.`}
        >
          {inst.def.cta ?? 'Hold to Claim'}
        </button>
      </div>
    </>
  );
}

function Confirm({ inst, onClear }: InteractionProps) {
  const [asking, setAsking] = useState(false);
  return (
    <>
      <Body text={asking ? 'Are you sure you want to dismiss this notification?' : inst.body} />
      <div class="modal__actions">
        {asking ? (
          <>
            <button class="btn" onClick={() => setAsking(false)}>
              No, Keep It
            </button>
            <FocusButton class="btn btn--gold" onClick={() => onClear()}>
              Yes, Dismiss
            </FocusButton>
          </>
        ) : (
          <FocusButton class="btn btn--gold" onClick={() => setAsking(true)}>
            {inst.def.cta ?? 'Dismiss'}
          </FocusButton>
        )}
      </div>
    </>
  );
}
