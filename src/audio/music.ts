import { audioOut, noiseLoop, setMusicLevel, tone } from './sfx';

/**
 * Generative launcher music, synthesized and scheduled a beat ahead.
 * - launcher: an "epic fantasy menu" ostinato that never resolves, gaining a layer each act.
 * - zen: rain and a slow pad.
 * - credits: a sincere 8-bar tune that finally resolves, then the zero pad.
 * - zero: one held pad chord. Inbox Zero.
 */
export type MusicMode = 'off' | 'launcher' | 'zen' | 'credits' | 'zero';

const BPM = 92;
const STEP = 60 / BPM / 4;
const BAR = STEP * 16;
const LOOKAHEAD = 0.15;

// Dm Bb F C | Dm Bb Gm Asus4, then back to the top. It never lands on the A.
const LAUNCHER_CHORDS = [
  [62, 65, 69],
  [58, 62, 65],
  [65, 69, 72],
  [60, 64, 67],
  [62, 65, 69],
  [58, 62, 65],
  [55, 58, 62],
  [57, 62, 64],
];
const COUNTER = [74, 72, 69, 72, 77, 76, 74, 72];

// C G Am F | C G F C. The credits are allowed to resolve.
const CREDITS_CHORDS = [
  [60, 64, 67],
  [55, 59, 62],
  [57, 60, 64],
  [53, 57, 60],
  [60, 64, 67],
  [55, 59, 62],
  [53, 57, 60],
  [60, 64, 67],
];
const CREDITS_TUNE: (number | null)[][] = [
  [76, 74, 72, 74],
  [74, null, 71, 67],
  [72, 71, 69, 72],
  [77, null, 76, 74],
  [76, 79, 84, 83],
  [81, null, 79, 74],
  [77, 76, 74, 71],
  [72, null, null, null],
];

const ZEN_CHORDS = [
  [57, 64, 67, 72],
  [53, 60, 64, 69],
  [55, 62, 65, 71],
  [52, 59, 64, 67],
];

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

/** How many launcher layers to play, from how far into the run you are. */
export function musicLayersFor(cleared: number, eventBegun: boolean): number {
  if (eventBegun) return 5;
  if (cleared < 12) return 1;
  if (cleared < 40) return 2;
  if (cleared < 80) return 3;
  return 4;
}

let mode: MusicMode = 'off';
let layers = 1;
let enabled = true;
let timer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let nextTime = 0;
let rain: ReturnType<typeof noiseLoop> = null;
let nextBell = 0;

export function getMusicMode(): MusicMode {
  return mode;
}

export function setMusicEnabled(on: boolean): void {
  enabled = on;
  setMusicLevel(on ? 0.55 : 0);
}

export function setMusicLayers(n: number): void {
  layers = n;
}

export function setMusicMode(next: MusicMode): void {
  if (next === mode) return;
  mode = next;
  step = 0;
  nextTime = 0;
  stopRain();
  if (timer) clearInterval(timer);
  timer = null;
  if (next === 'off' || typeof window === 'undefined') return;
  timer = setInterval(schedule, 40);
  schedule();
}

function stopRain(): void {
  const a = audioOut();
  if (rain && a) {
    rain.gain.gain.setTargetAtTime(0, a.ctx.currentTime, 0.3);
    rain.src.stop(a.ctx.currentTime + 1.5);
  }
  rain = null;
}

function schedule(): void {
  const a = audioOut();
  if (!a || !enabled) {
    // Keep time moving so music picks up on the beat when it comes back.
    nextTime = 0;
    return;
  }
  const now = a.ctx.currentTime;
  if (nextTime < now) nextTime = now + 0.05;
  if (mode === 'zen' && !rain) {
    rain = noiseLoop('lowpass', 1400, 'music');
    rain?.gain.gain.setTargetAtTime(0.06, now, 1.5);
  }
  while (nextTime < now + LOOKAHEAD) {
    play(step, nextTime - now);
    step++;
    nextTime += STEP;
  }
}

function play(s: number, at: number): void {
  const bar = Math.floor(s / 16);
  const s16 = s % 16;
  switch (mode) {
    case 'launcher':
      return launcher(bar % 8, s16, at);
    case 'zen':
      return zenStep(bar, s16, at);
    case 'credits':
      if (bar >= 8) {
        if (s16 === 0) setTimeout(() => mode === 'credits' && setMusicMode('zero'), 0);
        return;
      }
      return credits(bar, s16, at);
    case 'zero':
      if (s % 64 === 0) pad([50, 57, 62, 66, 69], at, BAR * 4, 0.018);
      return;
  }
}

function pad(notes: number[], at: number, dur: number, gain: number): void {
  for (const n of notes) {
    tone(midi(n), at, dur, { type: 'sawtooth', gain, filter: 900, attack: 0.4, bus: 'music' });
    tone(midi(n), at, dur, {
      type: 'sawtooth',
      gain: gain * 0.7,
      filter: 900,
      attack: 0.4,
      detune: 9,
      bus: 'music',
    });
  }
}

function launcher(bar: number, s16: number, at: number): void {
  const chord = LAUNCHER_CHORDS[bar]!;
  const root = chord[0]!;
  if (s16 === 0) pad(chord, at, BAR * 1.05, 0.016);
  if (layers >= 2 && s16 % 4 === 0) {
    const note = s16 === 8 ? root - 17 : root - 24;
    tone(midi(note), at, STEP * 3, { type: 'triangle', gain: 0.09, bus: 'music' });
  }
  if (layers >= 3) {
    const n = chord[s16 % 3]! + (Math.floor(s16 / 3) % 2 ? 12 : 0);
    tone(midi(n), at, STEP * 0.9, { type: 'square', gain: 0.012, filter: 2200, bus: 'music' });
  }
  if (layers >= 4) {
    if (s16 % 8 === 0) tone(80, at, 0.3, { gain: 0.16, slideTo: 40, bus: 'music' });
    if (s16 === 12) tone(110, at, 0.25, { gain: 0.09, slideTo: 70, bus: 'music' });
  }
  if (layers >= 5 && s16 % 4 === 0) {
    const n = COUNTER[(bar * 4 + s16 / 4) % COUNTER.length]!;
    tone(midi(n), at, STEP * 3.5, { type: 'triangle', gain: 0.03, attack: 0.03, bus: 'music' });
  }
}

function zenStep(bar: number, s16: number, at: number): void {
  // Half speed: one chord every two bars.
  if (s16 === 0 && bar % 2 === 0) {
    const chord = ZEN_CHORDS[(bar / 2) % ZEN_CHORDS.length]!;
    for (const n of chord) tone(midi(n), at, BAR * 2.2, { gain: 0.016, attack: 1.2, bus: 'music' });
  }
  if (s16 === 8 && bar >= nextBell) {
    nextBell = bar + 1 + Math.floor(Math.random() * 3);
    const n = [81, 84, 86, 88, 91][Math.floor(Math.random() * 5)]!;
    tone(midi(n), at, 2.5, { gain: 0.012, bus: 'music' });
  }
}

function credits(bar: number, s16: number, at: number): void {
  const chord = CREDITS_CHORDS[bar]!;
  if (s16 === 0) {
    pad(chord, at, BAR * 1.05, 0.014);
    tone(midi(chord[0]! - 24), at, BAR, { type: 'triangle', gain: 0.07, bus: 'music' });
  }
  if (s16 % 4 === 0) {
    const n = CREDITS_TUNE[bar]![s16 / 4];
    if (n)
      tone(midi(n), at, STEP * 3.8, {
        type: 'triangle',
        gain: 0.05,
        attack: 0.02,
        vibrato: { rate: 5, depth: 3 },
        bus: 'music',
      });
  }
}
