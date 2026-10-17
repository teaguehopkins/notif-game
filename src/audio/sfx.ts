/**
 * Synthesized sound effects (no audio assets). The AudioContext is created on the first user
 * gesture, because browsers block audio before that.
 */
let ctx: AudioContext | null = null;
let muted = false;
let combo = 0;
let lastClear = 0;

export function unlockAudio(): void {
  if (ctx || typeof window === 'undefined') return;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  try {
    ctx = new Ctor();
  } catch {
    ctx = null;
  }
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

function tone(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.12,
): void {
  if (!ctx || muted) return;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  /** A ding whose pitch climbs while you clear quickly. */
  clear(): void {
    const now = performance.now();
    combo = now - lastClear < 1500 ? Math.min(combo + 1, 12) : 0;
    lastClear = now;
    const f = 660 * Math.pow(2, combo / 12);
    tone(f, 0, 0.18, 'triangle', 0.1);
    tone(f * 2, 0.02, 0.12, 'sine', 0.04);
  },
  /** The ping of a new dot. Gets more insistent the more dots are active. */
  spawn(active: number): void {
    const urgency = Math.min(active / 40, 1);
    tone(880 + urgency * 440, 0, 0.08, 'square', 0.03 + urgency * 0.03);
    if (urgency > 0.5) tone(1320 + urgency * 440, 0.09, 0.06, 'square', 0.03);
  },
  achievement(): void {
    [523, 659, 784].forEach((f, i) => tone(f, i * 0.07, 0.25, 'triangle', 0.08));
  },
  fanfare(): void {
    [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.4, 'sawtooth', 0.05));
  },
  coins(): void {
    for (let i = 0; i < 5; i++) tone(1200 + i * 150, i * 0.05, 0.08, 'square', 0.04);
  },
  snooze(): void {
    tone(440, 0, 0.15, 'sine', 0.08);
    tone(330, 0.12, 0.25, 'sine', 0.08);
  },
  error(): void {
    tone(160, 0, 0.18, 'sawtooth', 0.08);
  },
};
