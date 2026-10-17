import { useEffect, useRef, useState } from 'preact/hooks';
import { unlockAudio } from '../../audio/sfx';
import { formatTime } from '../../share/share';
import { Crest } from '../components/Crest';
import { game } from '../game';
import { prefersReducedMotion } from '../motion';

const TIPS = [
  'Did you know? Red dots mean something is new.',
  'Did you know? Clearing a notification can unlock an achievement.',
  'Did you know? Achievements are notifications.',
  'Did you know? You can turn off notifications. (You cannot.)',
  'Loading notifications…',
  'Generating red dots…',
  'Updating Terms of Service…',
  'Did you know? A red dot with a number is worth that many red dots.',
  'Did you know? Gary is always online.',
  'Did you know? Notifications cleared in Zen mode are cleared more peacefully.',
  'Did you know? "Remind Me Later" means sooner than you think.',
  'Did you know? The Play button has never been pressed successfully.',
  'Tip: Reading the patch notes is optional. Accepting them is not.',
  'Tip: The ✕ is in the corner. Look closer.',
  'Tip: Mark All As Read unlocks at Level 10. Nobody has reached Level 10.',
  'Pro tip: Every achievement is also a notification. Plan accordingly.',
  'Polishing the gold…',
  'Counting your unread messages… (still counting)',
  'Reticulating red dots…',
  'Recalculating Battle Pass value…',
  'Teaching notifications to ping…',
  'Waking up Gary…',
  'Inflating rewards…',
  'Pre-loading regret…',
  'Calibrating dopamine…',
  'Shuffling the deck you never play…',
  'Did you know? 99% of loading screens stall at 99%.',
  'Did you know? This loading bar is decorative.',
];

const EMBERS = Array.from({ length: 16 }, (_, i) => ({
  left: 5 + ((i * 53) % 90),
  delay: (i * 0.7) % 6,
  dur: 5 + ((i * 3) % 5),
  size: 3 + (i % 4),
}));

const LOAD_MS = 3000;

export function Title() {
  const [progress, setProgress] = useState(prefersReducedMotion() ? 1 : 0);
  const [tip, setTip] = useState(0);
  const save = game.save.value;
  const run = game.savedRun.value;

  useEffect(() => {
    if (progress >= 1) return;
    const started = performance.now();
    let raf = 0;
    const step = () => {
      // Fake loading: fast, then stalls at 99%, then done.
      const p = Math.min((performance.now() - started) / LOAD_MS, 1);
      setProgress(p < 0.7 ? (p / 0.7) * 0.99 : p < 1 ? 0.99 : 1);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    setTip(Math.floor(Math.random() * TIPS.length));
    const t = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 900);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(t);
    };
  }, []);

  const begin = (mode: 'continue' | 'story' | 'zen') => {
    unlockAudio();
    if (mode === 'continue') game.resumeStory();
    else if (mode === 'story') game.startStory();
    else game.startZen();
  };

  const ready = progress >= 1;
  const startRef = useRef<HTMLButtonElement>(null);
  // autoFocus doesn't apply to a button that was disabled while loading.
  useEffect(() => {
    if (ready) startRef.current?.focus();
  }, [ready]);
  return (
    <main class="title">
      <div class="embers" aria-hidden="true">
        {EMBERS.map((e, i) => (
          <span
            key={i}
            class="ember"
            style={{
              left: `${e.left}%`,
              width: e.size,
              height: e.size,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.dur}s`,
            }}
          />
        ))}
      </div>
      <p class="title__presents">Legends of Loot Interactive presents</p>
      <Crest size={88} />
      <h1 class="logo logo--title">
        <span class="logo__top">Legends</span>
        <span class="logo__of">of</span>
        <span class="logo__big">Loot</span>
      </h1>
      <div
        class={progress >= 0.99 && progress < 1 ? 'loading loading--stalled' : 'loading'}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label="Loading"
      >
        <div class="loading__fill" style={{ width: `${progress * 100}%` }} />
      </div>
      <p class="title__tip" aria-live="polite">
        {ready
          ? 'Ready! You have unread notifications.'
          : progress >= 0.99
            ? '99%… 99%… 99%…'
            : TIPS[tip]}
      </p>
      <div class="title__actions">
        {run ? (
          <>
            <button
              class="btn btn--gold btn--huge"
              disabled={!ready}
              onClick={() => begin('continue')}
              ref={startRef}
            >
              Continue
              <span class="title__run">
                {run.engine.stats.cleared ?? 0} cleared · {formatTime(run.engine.now)}
              </span>
            </button>
            <button class="btn" disabled={!ready} onClick={() => begin('story')}>
              New Game
            </button>
          </>
        ) : (
          <button
            class="btn btn--gold btn--huge"
            disabled={!ready}
            onClick={() => begin('story')}
            ref={startRef}
          >
            {save.runsCompleted > 0 ? 'Play Again' : 'Start'}
          </button>
        )}
        {save.zenUnlocked && (
          <button class="btn" disabled={!ready} onClick={() => begin('zen')}>
            🧘 Zen Mode
          </button>
        )}
      </div>
      {(save.runsCompleted > 0 || save.lifetimeCleared > 0) && (
        <p class="title__stats">
          Lifetime cleared: {save.lifetimeCleared}
          {save.bestTimeMs !== null && <> · Best time: {formatTime(save.bestTimeMs)}</>}
          {save.zenLifetime > 0 && <> · Zen: {save.zenLifetime}</>}
        </p>
      )}
      <p class="title__fine">A satire of notification overload. Sound on recommended. 🔴</p>
    </main>
  );
}
