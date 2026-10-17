import { useEffect, useRef, useState } from 'preact/hooks';
import { MAX_SNOOZES } from '../../engine/engine';
import type { Instance, NotifDef, Rarity } from '../../engine/types';
import { sfx, type HoldSound } from '../../audio/sfx';
import { fx } from '../fx';
import { prefersReducedMotion } from '../motion';
import { CardBack, CardFace, cardName } from './Cards';
import { Crest } from './Crest';
import { CURRENCY_LABELS, CurrencyIcon } from './CurrencyIcon';
import { FocusButton } from './FocusButton';
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
  /** Popups queued behind this one. */
  behind?: number;
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

export function NotifModal({ inst, onClear, onSnooze, onClose, contents, layer, behind }: Props) {
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
      behind={behind}
      extraClass={def.rarity === 'legendary' ? 'modal--legendary' : ''}
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

function Body({ text }: { text: string }) {
  return text ? <p class="modal__body">{text}</p> : null;
}

function Rewards({ def }: { def: NotifDef }) {
  const entries = Object.entries(def.rewards ?? {});
  if (entries.length === 0) return null;
  return (
    <ul class="rewards" aria-label="Rewards">
      {entries.map(([k, v]) => (
        <li key={k}>
          <CurrencyIcon kind={k} /> +{v} {CURRENCY_LABELS[k] ?? k}
        </li>
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
  const lastRustle = useRef(0);
  const outcomes = inst.def.outcomes;
  const check = () => {
    const el = ref.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setAtBottom(true);
  };
  const onScroll = () => {
    const now = performance.now();
    if (now - lastRustle.current > 160) {
      lastRustle.current = now;
      sfx.rustle();
    }
    check();
  };
  useEffect(check, []);
  return (
    <>
      <div
        ref={ref}
        class="scroll-box"
        onScroll={onScroll}
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

function centerOf(el: Element | null): { x: number; y: number } | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

type ChestState = 'closed' | 'opening' | 'open';

/** A treasure chest (or, for daily rewards, a gift box) whose lid bounces open. */
function ChestArt({ state, gift }: { state: ChestState; gift: boolean }) {
  const body = gift ? '#c4302b' : '#7a4a22';
  const lid = gift ? '#e04a3f' : '#8a5a2a';
  const band = gift ? '#ffe29a' : '#f0c35a';
  return (
    <div class={`chest-art chest-art--${state}`} aria-hidden="true">
      <div class="chest-art__beams" />
      <svg class="chest-art__svg" viewBox="0 0 120 100">
        <g class="chest-art__base">
          <rect
            x="14"
            y="44"
            width="92"
            height="50"
            rx="6"
            fill={body}
            stroke="#3a2108"
            stroke-width="3"
          />
          <rect x="14" y="58" width="92" height="7" fill={band} />
          <rect x="30" y="44" width="8" height="50" fill={band} />
          <rect x="82" y="44" width="8" height="50" fill={band} />
          {!gift && (
            <rect
              x="52"
              y="52"
              width="16"
              height="20"
              rx="3"
              fill="#f0c35a"
              stroke="#3a2108"
              stroke-width="2"
            />
          )}
          {!gift && <circle cx="60" cy="61" r="3" fill="#3a2108" />}
        </g>
        <g class="chest-art__lid">
          <path d="M14 46V34c0-16 92-16 92 0v12z" fill={lid} stroke="#3a2108" stroke-width="3" />
          <rect x="30" y="20" width="8" height="26" fill={band} />
          <rect x="82" y="20" width="8" height="26" fill={band} />
          {gift && (
            <path
              d="M60 22c-12-14-24-4-12 2zM60 22c12-14 24-4 12 2z"
              fill={band}
              stroke="#3a2108"
              stroke-width="2"
            />
          )}
        </g>
      </svg>
    </div>
  );
}

function Chest({ inst, onClear }: InteractionProps) {
  const [state, setState] = useState<ChestState>('closed');
  const ref = useRef<HTMLDivElement>(null);
  const open = () => {
    setState('opening');
    sfx.lockClunk();
    sfx.creak();
    setTimeout(
      () => {
        setState('open');
        sfx.chestBurst();
        const at = centerOf(ref.current);
        if (at) {
          fx.burst(at, {
            count: 18,
            shape: 'coin',
            colors: ['#f0c35a', '#ffe29a'],
            speed: 9,
            size: 6,
            gravity: 0.35,
            life: 1100,
            angle: -Math.PI / 2,
            spread: 0.9,
          });
        }
        fx.shake(ref.current?.closest('.modal'), 'small');
        fx.buzz(25);
      },
      prefersReducedMotion() ? 0 : 900,
    );
  };
  return (
    <>
      <Body text={inst.body} />
      <div ref={ref}>
        <ChestArt state={state} gift={inst.def.icon === '📅'} />
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

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};
const RARITY_SPARK: Record<Rarity, string[]> = {
  common: ['#e6cf9f'],
  rare: ['#6fd3ff', '#ffffff'],
  epic: ['#c08bff', '#ffffff'],
  legendary: ['#ff9a3c', '#ffe29a', '#ffffff'],
};

/** Shake, tear the foil, fan out face-down cards, flip them one at a time (or all at once). */
function Pack({ inst, onClear, contents }: InteractionProps) {
  const [stage, setStage] = useState<'sealed' | 'tearing' | 'fanned'>('sealed');
  const [up, setUp] = useState<boolean[]>(() => contents.map(() => false));
  const [auto, setAuto] = useState(false);
  const [said, setSaid] = useState('');
  const upRef = useRef(up);
  const fanRef = useRef<HTMLUListElement>(null);
  const packRef = useRef<HTMLDivElement>(null);
  const reduced = prefersReducedMotion();
  const done = stage === 'fanned' && up.every(Boolean);

  const open = () => {
    setStage('tearing');
    sfx.foilRip();
    fx.shake(packRef.current, 'small');
    setTimeout(() => setStage('fanned'), reduced ? 0 : 750);
  };

  const flip = (i: number) => {
    const c = contents[i];
    if (!c || upRef.current[i]) return;
    const next = [...upRef.current];
    next[i] = true;
    upRef.current = next;
    setUp(next);
    const rarity = c.rarity ?? 'common';
    const dupe = /^Duplicate/.test(c.title);
    sfx.cardFlip();
    sfx.rarity(rarity);
    if (dupe) setTimeout(() => sfx.sadTrombone(), 700);
    setSaid(`${cardName(c.title)}, ${RARITY_LABEL[rarity]}${dupe ? ', duplicate' : ''}`);
    if (rarity !== 'common') {
      const at = centerOf(fanRef.current?.children[i] ?? null);
      if (at)
        fx.burst(at, {
          count: rarity === 'legendary' ? 30 : 14,
          colors: RARITY_SPARK[rarity],
          shape: 'star',
          speed: 5,
          gravity: 0.02,
          size: 5,
        });
      if (rarity === 'legendary') fx.shake(fanRef.current?.closest('.modal'), 'small');
    }
  };

  // Reveal All flips the rest one after another.
  useEffect(() => {
    if (!auto || done) return;
    const t = setTimeout(
      () => {
        const i = upRef.current.indexOf(false);
        if (i >= 0) flip(i);
      },
      reduced ? 30 : 280,
    );
    return () => clearTimeout(t);
  }, [auto, up]);

  const revealAll = () => {
    if (!auto) return setAuto(true);
    // Impatient? Flip everything now.
    upRef.current.forEach((u, i) => !u && flip(i));
  };

  return (
    <>
      <Body text={inst.body} />
      {stage !== 'fanned' ? (
        <div ref={packRef} class={`pack-foil pack-foil--${stage}`} aria-hidden="true">
          <span class="pack-foil__strip" />
          <span class="pack-foil__crest">
            <Crest size={46} />
          </span>
          <span class="pack-foil__title">Legends of Loot</span>
          <span class="pack-foil__count">{contents.length} cards</span>
        </div>
      ) : (
        <ul class="pack-fan" ref={fanRef} style={{ '--n': contents.length }}>
          {contents.map((c, i) => {
            const rarity = c.rarity ?? 'common';
            const name = cardName(c.title);
            const isUp = up[i];
            return (
              <li key={c.id} style={{ '--i': i }}>
                <button
                  class={`pack-slot pack-slot--${rarity}${isUp ? ' pack-slot--up' : ''}`}
                  onClick={() => flip(i)}
                  // Face up, the card's own text names the button; face down there's no text.
                  aria-label={isUp ? undefined : `Card ${i + 1}, face down. Flip it.`}
                >
                  <span class="pack-slot__inner">
                    <span class="pack-slot__back">
                      <CardBack />
                    </span>
                    <span class="pack-slot__front">
                      {isUp && (
                        <CardFace
                          spoken
                          name={name}
                          icon={c.icon}
                          rarity={rarity}
                          text={c.body}
                          stamp={/^Duplicate/.test(c.title) ? 'Duplicate' : undefined}
                        />
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p class="sr-only" aria-live="polite">
        {said}
      </p>
      <div class="modal__actions">
        {done ? (
          <FocusButton class="btn btn--gold" onClick={() => onClear()}>
            Done
          </FocusButton>
        ) : stage === 'fanned' ? (
          <button class="btn btn--gold" onClick={revealAll}>
            Reveal All
          </button>
        ) : (
          <button class="btn btn--gold" disabled={stage === 'tearing'} onClick={open}>
            {stage === 'tearing' ? 'Opening…' : (inst.def.cta ?? 'Open')}
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

const AD_NOTIFS = [
  'You have a new notification',
  'Reminder: check notifications',
  'Your notification was delivered',
  'New: notification about notifications',
];

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
        <div
          class="fake-ad"
          role="img"
          aria-label="Advertisement: Notifly Pro. Never miss a notification again."
        >
          <div class="fake-ad__phone">
            <div class="fake-ad__screen">
              {AD_NOTIFS.map((n, i) => (
                <div class="fake-ad__notif" key={n} style={{ '--i': i }}>
                  <span class="fake-ad__bell">🔔</span>
                  {n}
                </div>
              ))}
            </div>
          </div>
          <div class="fake-ad__side">
            <div class="fake-ad__brand">Notifly Pro</div>
            <div class="fake-ad__copy">
              Never miss a notification again. Get notified about everything, all the time.
            </div>
            <div class="fake-ad__stars">★★★★★ "I get so many notifications now" (Gary)</div>
          </div>
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
        <button
          class="btn btn--gold btn--huge"
          onClick={() => {
            sfx.adJingle();
            setAd(5);
          }}
        >
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
  const ref = useRef<HTMLButtonElement>(null);
  const dodge = () => {
    if (dodges >= MAX_DODGES) return;
    // A puff of dust where it was.
    const at = centerOf(ref.current);
    if (at)
      fx.burst(at, {
        count: 10,
        colors: ['#b9a58a', '#d8c8a8', '#8a7a60'],
        speed: 2.2,
        gravity: -0.03,
        size: 6,
        life: 500,
      });
    sfx.boing();
    sfx.puff();
    setDodges(dodges + 1);
  };
  return (
    <>
      <button
        ref={ref}
        // Alternating hop classes restart the squash-and-stretch on every dodge.
        class={`dodge-x ${DODGE_SPOTS[dodges % DODGE_SPOTS.length]}${dodges ? ` dodge-x--hop${dodges % 2}` : ''}`}
        aria-label="Close"
        onPointerEnter={(e) => e.pointerType === 'mouse' && dodge()}
        onClick={() => (dodges < MAX_DODGES ? dodge() : onClear())}
      >
        ✕
        {dodges >= MAX_DODGES && (
          <span class="dodge-x__eyes" aria-hidden="true">
            👀
          </span>
        )}
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
  const sound = useRef<HoldSound | null>(null);
  const begin = () => {
    if (startedAt.current !== null) return;
    startedAt.current = performance.now();
    sound.current = sfx.holdStart();
    const step = () => {
      if (startedAt.current === null) return;
      const p = Math.min((performance.now() - startedAt.current) / HOLD_MS, 1);
      setProgress(p);
      sound.current?.update(p);
      if (p >= 1) {
        startedAt.current = null;
        sound.current?.stop();
        sound.current = null;
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
    sound.current?.stop();
    sound.current = null;
    setProgress(0);
  };
  useEffect(() => end, []);
  const label = inst.def.cta ?? 'Hold to Claim';
  return (
    <>
      <Body text={inst.body} />
      <Rewards def={inst.def} />
      <div class="modal__actions">
        <button
          class={`btn btn--gold btn--hold${progress > 0.7 ? ' btn--hold-near' : ''}`}
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
          aria-label={`${label}. Press and hold.`}
        >
          <span class="btn--hold__liquid" aria-hidden="true" />
          <span class="btn--hold__label">{label}</span>
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
