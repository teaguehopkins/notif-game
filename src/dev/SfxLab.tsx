import { useState } from 'preact/hooks';
import { setMusicLayers, setMusicMode, type MusicMode } from '../audio/music';
import { setZen, sfx, unlockAudio, type HoldSound, type SpawnKind } from '../audio/sfx';

/** A hidden page (`?sfx`) with a button for every sound, for reviewing the audio by ear. */
const SOUNDS: [string, () => void][] = [
  ['Clear (press fast to climb the scale)', () => sfx.clear()],
  ['Achievement', () => sfx.achievement()],
  ['Level up', () => sfx.levelUp()],
  ['Mark All fanfare', () => sfx.fanfare()],
  ['Coins', () => sfx.coins()],
  ['Snooze', () => sfx.snooze()],
  ['Error', () => sfx.error()],
  ['Paper rustle (ToS)', () => sfx.rustle()],
  ['Lock clunk', () => sfx.lockClunk()],
  ['Chest creak', () => sfx.creak()],
  ['Chest burst', () => sfx.chestBurst()],
  ['Foil rip (pack)', () => sfx.foilRip()],
  ['Card flip', () => sfx.cardFlip()],
  ['Common', () => sfx.rarity('common')],
  ['Rare', () => sfx.rarity('rare')],
  ['Epic', () => sfx.rarity('epic')],
  ['Legendary', () => sfx.rarity('legendary')],
  ['Sad trombone (duplicate)', () => sfx.sadTrombone()],
  ['Boing (dodging ✕)', () => sfx.boing()],
  ['Dust puff', () => sfx.puff()],
  ['Ad jingle', () => sfx.adJingle()],
  ['Gary: "heyy"', () => sfx.gary()],
  ['Swoosh', () => sfx.swoosh()],
  ['Inbox Zero', () => sfx.inboxZero()],
];

const SPAWNS: SpawnKind[] = ['popup', 'item', 'gary', 'legendary'];
const MODES: MusicMode[] = ['off', 'launcher', 'zen', 'credits', 'zero'];

export function SfxLab() {
  const [active, setActive] = useState(5);
  const [layers, setLayers] = useState(1);
  const [mode, setMode] = useState<MusicMode>('off');
  const [hold, setHold] = useState<HoldSound | null>(null);
  const play = (fn: () => void) => {
    unlockAudio();
    fn();
  };
  return (
    <main class="sfx-lab">
      <h1>Sound check</h1>
      <p>Every sound in Legends of Loot. Nothing here is saved.</p>

      <h2>Sound effects</h2>
      <div class="sfx-lab__grid">
        {SOUNDS.map(([label, fn]) => (
          <button key={label} class="btn" onClick={() => play(fn)}>
            {label}
          </button>
        ))}
        <button
          class="btn"
          onPointerDown={() => {
            unlockAudio();
            const h = sfx.holdStart();
            setHold(h);
            let p = 0;
            const step = () => {
              p = Math.min(p + 0.012, 1);
              h.update(p);
              if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }}
          onPointerUp={() => {
            hold?.stop();
            setHold(null);
          }}
        >
          Hold-to-claim drumroll (hold me)
        </button>
      </div>

      <h2>Spawn sounds</h2>
      <label class="slider">
        <span>Active dots: {active}</span>
        <input
          type="range"
          min={0}
          max={50}
          value={active}
          onInput={(e) => setActive(Number((e.target as HTMLInputElement).value))}
        />
      </label>
      <div class="sfx-lab__grid">
        {SPAWNS.map((k) => (
          <button key={k} class="btn" onClick={() => play(() => sfx.spawn(k, active))}>
            {k}
          </button>
        ))}
        <button
          class="btn"
          onClick={() =>
            play(() => {
              setZen(true);
              sfx.spawn('item', active);
              setZen(false);
            })
          }
        >
          zen bell
        </button>
      </div>

      <h2>Music</h2>
      <div class="sfx-lab__grid">
        {MODES.map((m) => (
          <button
            key={m}
            class={m === mode ? 'btn btn--gold' : 'btn'}
            aria-pressed={m === mode}
            onClick={() =>
              play(() => {
                setMode(m);
                setMusicMode(m);
              })
            }
          >
            {m}
          </button>
        ))}
      </div>
      <label class="slider">
        <span>Launcher layers: {layers}</span>
        <input
          type="range"
          min={1}
          max={5}
          value={layers}
          onInput={(e) => {
            const n = Number((e.target as HTMLInputElement).value);
            setLayers(n);
            setMusicLayers(n);
          }}
        />
      </label>
      <p>
        <a href="./">Back to the game</a>
      </p>
    </main>
  );
}
