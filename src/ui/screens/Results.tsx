import { useEffect, useState } from 'preact/hooks';
import { renderResultCard } from '../../share/card';
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
  const [card, setCard] = useState<{ file: File; url: string } | null>(null);

  // Draw the share image up front, so sharing it can happen straight from the click.
  useEffect(() => {
    let url = '';
    let live = true;
    void renderResultCard({
      cleared,
      timeMs: time,
      achievements: e.stats.achievements ?? 0,
      bestMs: save.bestTimeMs,
      host: location.host + location.pathname.replace(/\/$/, ''),
    }).then((blob) => {
      if (!blob || !live) return;
      url = URL.createObjectURL(blob);
      setCard({ file: new File([blob], 'legends-of-loot.png', { type: 'image/png' }), url });
    });
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  const share = async () => {
    const url = location.href.split('#')[0]!;
    const r = await shareResult(line, url, navigator, undefined, card?.file);
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
        {card && (
          <figure class="results__share-card">
            <img
              class="results__card-img"
              src={card.url}
              alt={`Result card: ${cleared} notifications cleared in ${formatTime(time)}`}
              width={216}
              height={270}
            />
            <figcaption>
              <a href={card.url} download="legends-of-loot.png">
                Save image
              </a>
            </figcaption>
          </figure>
        )}
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
        <p class="results__studio">
          Enjoyed this?{' '}
          <a href="https://zenwombat.com/" target="_blank" rel="noopener">
            More games from Zen Wombat
          </a>
        </p>
      </div>
    </main>
  );
}
