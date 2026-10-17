import { useEffect, useState } from 'preact/hooks';
import { unlockAudio } from '../../audio/sfx';
import { formatTime } from '../../share/share';
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
];

const LOAD_MS = 2600;

export function Title() {
  const [progress, setProgress] = useState(prefersReducedMotion() ? 1 : 0);
  const [tip, setTip] = useState(0);
  const save = game.save.value;

  useEffect(() => {
    if (progress >= 1) return;
    const started = performance.now();
    let raf = 0;
    const step = () => {
      // Fake loading: fast, then stalls at 99%, then done.
      const p = Math.min((performance.now() - started) / LOAD_MS, 1);
      setProgress(p < 0.85 ? p * 1.16 : p < 1 ? 0.99 : 1);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const t = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 900);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(t);
    };
  }, []);

  const begin = (mode: 'story' | 'zen') => {
    unlockAudio();
    if (mode === 'story') game.startStory();
    else game.startZen();
  };

  const ready = progress >= 1;
  return (
    <main class="title">
      <p class="title__presents">Clear All presents</p>
      <h1 class="logo logo--title">
        <span class="logo__top">Legends</span>
        <span class="logo__of">of</span>
        <span class="logo__big">Loot</span>
      </h1>
      <div
        class="loading"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label="Loading"
      >
        <div class="loading__fill" style={{ width: `${progress * 100}%` }} />
      </div>
      <p class="title__tip" aria-live="polite">
        {ready ? 'Ready! You have unread notifications.' : TIPS[tip]}
      </p>
      <div class="title__actions">
        <button
          class="btn btn--gold btn--huge"
          disabled={!ready}
          onClick={() => begin('story')}
          autoFocus
        >
          {save.runsCompleted > 0 ? 'Play Again' : 'Start'}
        </button>
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
