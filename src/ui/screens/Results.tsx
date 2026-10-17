import { useState } from 'preact/hooks';
import { formatTime, shareLine, shareResult } from '../../share/share';
import { Badge } from '../components/Badge';
import { game } from '../game';

export function Results() {
  const e = game.engine;
  const save = game.save.value;
  const time = game.zeroAtMs.value;
  const cleared = e.stats.cleared ?? 0;
  const line = shareLine(cleared, time);
  const [shareState, setShareState] = useState<string | null>(null);
  const [spread, setSpread] = useState<'none' | 'new' | 'seen'>('none');

  const share = async () => {
    const url = location.href.split('#')[0]!;
    const r = await shareResult(line, url);
    setShareState(r);
    if ((r === 'shared' || r === 'copied') && spread === 'none') setSpread('new');
  };

  return (
    <main class="results">
      <div class="results__card">
        <p class="results__eyebrow">Inbox Zero</p>
        <h1 class="results__title">You Cleared All Notifications</h1>
        <dl class="results__stats">
          <div>
            <dt>Time</dt>
            <dd>{formatTime(time)}</dd>
          </div>
          <div>
            <dt>Cleared</dt>
            <dd>{cleared}</dd>
          </div>
          <div>
            <dt>Achievements</dt>
            <dd>{e.stats.achievements ?? 0}</dd>
          </div>
          <div>
            <dt>Best Time</dt>
            <dd>{save.bestTimeMs === null ? '–' : formatTime(save.bestTimeMs)}</dd>
          </div>
        </dl>
        <p class="results__lifetime">Lifetime notifications cleared: {save.lifetimeCleared}</p>

        {spread === 'new' && (
          <button class="spread" onClick={() => setSpread('seen')}>
            🏆 Achievement Unlocked: Spread the Word <Badge count={1} />
          </button>
        )}
        {spread === 'seen' && (
          <p class="results__hint">
            You cleared the notification for sharing. Truly, it never ends.
          </p>
        )}

        <div class="results__actions">
          <button class="btn btn--gold" onClick={share}>
            Share Result
          </button>
          <button class="btn" onClick={() => game.startStory()}>
            Play Again
          </button>
          <button class="btn" onClick={() => game.startZen()}>
            🧘 Zen Mode
          </button>
        </div>
        {shareState === 'copied' && (
          <p class="results__hint" aria-live="polite">
            Copied to clipboard!
          </p>
        )}
        {shareState === 'manual' && (
          <textarea
            class="share-text"
            readOnly
            rows={2}
            onFocus={(ev) => (ev.target as HTMLTextAreaElement).select()}
            aria-label="Result to copy"
          >
            {line}
          </textarea>
        )}
      </div>
    </main>
  );
}
