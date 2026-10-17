import type { Rarity } from '../engine/types';

/**
 * Synthesized sound (no audio assets). Everything routes through one master gain, so mute and
 * volume apply at once, even to notes already scheduled. Sound effects and music each get their
 * own bus under it. The AudioContext is created on the first user gesture, because browsers block
 * audio before that.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = false;
let volume = 0.8;
let zen = false;
let combo = 0;
let lastClear = 0;
/** Until this context time, spawn sounds are swallowed (the beat of silence at Inbox Zero). */
let hushUntil = 0;

export function unlockAudio(): void {
  if (typeof window === 'undefined') return;
  if (ctx) {
    // iOS suspends the context when the page is backgrounded; a gesture can wake it.
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    return;
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.55;
    musicBus.connect(master);
    applyMaster();
  } catch {
    ctx = null;
  }
}

function applyMaster(): void {
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.02);
}

export function setMuted(value: boolean): void {
  muted = value;
  applyMaster();
}

export function isMuted(): boolean {
  return muted;
}

/** 0 to 1. */
export function setVolume(value: number): void {
  volume = Math.min(Math.max(value, 0), 1);
  applyMaster();
}

/** Zen swaps pings for soft bells. */
export function setZen(value: boolean): void {
  zen = value;
}

/** Swallow spawn sounds for a moment. */
export function hush(seconds: number): void {
  if (ctx) hushUntil = ctx.currentTime + seconds;
}

/** The context and the music bus, for the music sequencer. Null until audio is unlocked. */
export function audioOut(): { ctx: AudioContext; music: GainNode } | null {
  return ctx && musicBus && !muted ? { ctx, music: musicBus } : null;
}

export function setMusicLevel(level: number): void {
  if (ctx && musicBus) musicBus.gain.setTargetAtTime(level, ctx.currentTime, 0.3);
}

/** Two seconds of white noise, shared by every noisy sound. */
function noiseBuffer(c: AudioContext): AudioBuffer {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

type Bus = 'sfx' | 'music';

function out(bus: Bus = 'sfx'): GainNode | null {
  if (!ctx || muted) return null;
  return bus === 'music' ? musicBus : sfxBus;
}

export interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  bus?: Bus;
  /** Glide to this frequency over the note. */
  slideTo?: number;
  /** Cents. */
  detune?: number;
  attack?: number;
  /** Lowpass cutoff. */
  filter?: number;
  vibrato?: { rate: number; depth: number };
}

/** One enveloped oscillator note. `start` is seconds from now. */
export function tone(freq: number, start: number, dur: number, o: ToneOpts = {}): void {
  const bus = out(o.bus);
  if (!ctx || !bus) return;
  const t = ctx.currentTime + Math.max(start, 0);
  const osc = ctx.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
  if (o.detune) osc.detune.value = o.detune;
  const g = ctx.createGain();
  const attack = o.attack ?? 0.01;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.gain ?? 0.1, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + 0.01));
  let node: AudioNode = osc;
  if (o.filter) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.filter;
    node = node.connect(f);
  }
  node.connect(g).connect(bus);
  if (o.vibrato) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = o.vibrato.rate;
    depth.gain.value = o.vibrato.depth;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
  }
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export interface NoiseOpts {
  gain?: number;
  bus?: Bus;
  type?: BiquadFilterType;
  freq?: number;
  slideTo?: number;
  q?: number;
  attack?: number;
}

/** A burst of filtered noise. `start` is seconds from now. */
export function noise(start: number, dur: number, o: NoiseOpts = {}): void {
  const bus = out(o.bus);
  if (!ctx || !bus) return;
  const t = ctx.currentTime + Math.max(start, 0);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const f = ctx.createBiquadFilter();
  f.type = o.type ?? 'bandpass';
  f.frequency.setValueAtTime(o.freq ?? 2000, t);
  if (o.slideTo) f.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
  f.Q.value = o.q ?? 1;
  const g = ctx.createGain();
  const attack = o.attack ?? 0.005;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.gain ?? 0.1, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + 0.01));
  src.connect(f).connect(g).connect(bus);
  // Start somewhere random in the buffer so repeated bursts don't sound identical.
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.05);
}

/** A sustained, looping noise source (rain, drumrolls). Returns its gain so callers can fade it. */
export function noiseLoop(
  filterType: BiquadFilterType,
  freq: number,
  bus: Bus = 'sfx',
): { src: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode } | null {
  const b = out(bus);
  if (!ctx || !b) return null;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  src.connect(filter).connect(gain).connect(b);
  src.start();
  return { src, filter, gain };
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

/** Major-scale steps (do re mi…) over two octaves. Fast clears climb it. */
export const LADDER = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
/** Clears closer together than this keep the combo going. */
export const COMBO_MS = 1500;

/** The next rung of the ladder, given the previous one and the time since the last clear. */
export function nextCombo(prev: number, sinceLastMs: number): number {
  return sinceLastMs < COMBO_MS ? Math.min(prev + 1, LADDER.length - 1) : 0;
}

export type SpawnKind = 'popup' | 'item' | 'achievement' | 'gary' | 'legendary';

export interface HoldSound {
  update(progress: number): void;
  stop(): void;
}

const SILENT_HOLD: HoldSound = { update() {}, stop() {} };

export const sfx = {
  /** A ding that climbs a major scale while you clear quickly. */
  clear(): void {
    const now = performance.now();
    combo = nextCombo(combo, now - lastClear);
    lastClear = now;
    const f = midi(72 + LADDER[combo]!);
    if (zen) {
      tone(f / 2, 0, 0.9, { gain: 0.05 });
      tone(f, 0, 0.6, { gain: 0.02 });
      return;
    }
    tone(f, 0, 0.2, { type: 'triangle', gain: 0.1 });
    tone(f * 2, 0.015, 0.14, { gain: 0.04 });
  },

  /**
   * Something new arrived. Each kind has its own sound, so your ear knows what it was. Past ten
   * active dots an extra ping joins in, and it gets faster, higher and more out of tune the more
   * there are.
   */
  spawn(kind: SpawnKind, active: number): void {
    if (!ctx || ctx.currentTime < hushUntil) return;
    if (zen) {
      const bell = midi(pick([79, 81, 84, 86, 88]));
      tone(bell, 0, 1.6, { gain: 0.035 });
      tone(bell * 2.01, 0, 0.9, { gain: 0.012 });
      return;
    }
    switch (kind) {
      case 'popup':
        tone(170, 0, 0.2, { gain: 0.2, slideTo: 70 });
        noise(0, 0.07, { type: 'lowpass', freq: 700, gain: 0.12 });
        break;
      case 'item':
        tone(1319, 0, 0.35, { gain: 0.045 });
        tone(2637, 0.005, 0.2, { gain: 0.018 });
        break;
      case 'gary':
        sfx.gary();
        break;
      case 'legendary':
        sfx.rarity('rare');
        break;
      case 'achievement':
        // The toast plays its own chime.
        break;
    }
    if (active < 10) return;
    const u = Math.min((active - 10) / 30, 1);
    const pings = 1 + Math.round(u * 3);
    const gap = 0.12 - u * 0.06;
    for (let i = 0; i < pings; i++) {
      tone(880 + u * 520, 0.06 + i * gap, 0.07, {
        type: 'square',
        gain: 0.018 + u * 0.022,
        detune: (i % 2 ? 1 : -1) * u * 45,
        filter: 4000,
      });
    }
  },

  achievement(): void {
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(f, i * 0.07, 0.3, { type: 'triangle', gain: 0.08 }),
    );
    [2093, 2637, 3136].forEach((f, i) => tone(f, 0.28 + i * 0.04, 0.25, { gain: 0.02 }));
  },

  fanfare(): void {
    [392, 523, 659, 784, 1047].forEach((f, i) =>
      tone(f, i * 0.09, 0.4, { type: 'sawtooth', gain: 0.05, filter: 3000 }),
    );
  },

  coins(): void {
    for (let i = 0; i < 6; i++)
      tone(1200 + i * 150 + Math.random() * 80, i * 0.05, 0.09, { type: 'square', gain: 0.035 });
  },

  snooze(): void {
    tone(440, 0, 0.15, { gain: 0.08 });
    tone(330, 0.12, 0.25, { gain: 0.08 });
  },

  error(): void {
    tone(160, 0, 0.18, { type: 'sawtooth', gain: 0.08, filter: 1200 });
  },

  /** Paper rustle, for scrolling the Terms of Service. */
  rustle(): void {
    noise(0, 0.1 + Math.random() * 0.08, {
      type: 'bandpass',
      freq: 2500 + Math.random() * 2500,
      q: 0.7,
      gain: 0.035,
    });
  },

  /** The key turns. */
  lockClunk(): void {
    tone(110, 0, 0.14, { type: 'square', gain: 0.08, filter: 600 });
    noise(0, 0.05, { type: 'lowpass', freq: 900, gain: 0.14 });
    tone(240, 0.09, 0.05, { type: 'square', gain: 0.05, filter: 1500 });
  },

  creak(): void {
    tone(90, 0.12, 0.7, { type: 'sawtooth', slideTo: 170, gain: 0.035, filter: 700, attack: 0.1 });
  },

  /** The lid flies open. */
  chestBurst(): void {
    noise(0, 0.4, { type: 'highpass', freq: 3000, slideTo: 8000, gain: 0.06 });
    [784, 988, 1175, 1568].forEach((f, i) =>
      tone(f, i * 0.05, 0.3, { type: 'triangle', gain: 0.06 }),
    );
    sfx.coins();
  },

  /** Tearing the foil on a pack. */
  foilRip(): void {
    for (let i = 0; i < 7; i++)
      noise(i * 0.04, 0.06, { type: 'highpass', freq: 1800 + i * 600, gain: 0.07 });
  },

  cardFlip(): void {
    noise(0, 0.05, { type: 'bandpass', freq: 3200, gain: 0.06 });
    tone(620, 0, 0.05, { gain: 0.03 });
  },

  /** Rarity stingers for card reveals. */
  rarity(r: Rarity): void {
    switch (r) {
      case 'common':
        tone(784, 0, 0.14, { type: 'triangle', gain: 0.06 });
        break;
      case 'rare':
        [1568, 1976, 2349, 3136].forEach((f, i) => tone(f, i * 0.05, 0.5, { gain: 0.03 }));
        break;
      case 'epic':
        [1568, 1976, 2349, 3136].forEach((f, i) => tone(f, i * 0.05, 0.6, { gain: 0.03 }));
        [196, 247, 294].forEach((f) =>
          tone(f, 0, 1, { type: 'sawtooth', gain: 0.03, filter: 1500 }),
        );
        break;
      case 'legendary':
        // An orchestra hit: a stacked chord, a timpani, and a crash.
        [65.4, 130.8, 196, 261.6, 329.6, 392].forEach((f) =>
          tone(f, 0, 1.4, { type: 'sawtooth', gain: 0.045, filter: 2400 }),
        );
        tone(65, 0, 0.9, { gain: 0.25, slideTo: 48 });
        noise(0, 0.8, { type: 'highpass', freq: 4000, gain: 0.08 });
        break;
    }
  },

  /** For when the legendary card is a duplicate. */
  sadTrombone(): void {
    [392, 370, 349].forEach((f, i) =>
      tone(f, i * 0.32, 0.34, { type: 'sawtooth', gain: 0.05, filter: 900 }),
    );
    tone(330, 0.96, 1, {
      type: 'sawtooth',
      gain: 0.05,
      filter: 900,
      slideTo: 300,
      vibrato: { rate: 6, depth: 8 },
    });
  },

  /** A drumroll that rises in pitch while a hold-to-claim button fills. */
  holdStart(): HoldSound {
    const roll = noiseLoop('bandpass', 900);
    if (!ctx || !roll) return SILENT_HOLD;
    const c = ctx;
    // A square LFO on the gain turns the noise into a snare roll.
    const lfo = c.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 16;
    const depth = c.createGain();
    depth.gain.value = 0.05;
    lfo.connect(depth).connect(roll.gain.gain);
    roll.gain.gain.value = 0.05;
    lfo.start();
    const hum = c.createOscillator();
    hum.type = 'triangle';
    hum.frequency.value = 220;
    const humGain = c.createGain();
    humGain.gain.value = 0.025;
    hum.connect(humGain).connect(roll.gain);
    hum.start();
    return {
      update(p) {
        const t = c.currentTime;
        roll.filter.frequency.setTargetAtTime(900 + p * 2600, t, 0.05);
        lfo.frequency.setTargetAtTime(16 + p * 14, t, 0.05);
        hum.frequency.setTargetAtTime(220 + p * 440, t, 0.05);
      },
      stop() {
        const t = c.currentTime;
        roll.gain.gain.cancelScheduledValues(t);
        depth.gain.setTargetAtTime(0, t, 0.02);
        roll.gain.gain.setTargetAtTime(0, t, 0.02);
        for (const n of [roll.src, lfo, hum]) n.stop(t + 0.15);
      },
    };
  },

  /** The close button jumps away. */
  boing(): void {
    tone(160, 0, 0.09, { type: 'triangle', gain: 0.1, slideTo: 620 });
    tone(620, 0.09, 0.35, {
      type: 'triangle',
      gain: 0.08,
      slideTo: 180,
      vibrato: { rate: 18, depth: 40 },
    });
  },

  /** The jingle at the start of the fake ad. */
  adJingle(): void {
    [784, 988, 1175, 1568, 1319, 1568].forEach((f, i) =>
      tone(f, i * 0.11, 0.13, { type: 'square', gain: 0.03, filter: 3500 }),
    );
  },

  /** Gary says "heyy". */
  gary(): void {
    tone(196, 0, 0.18, { type: 'sawtooth', gain: 0.05, filter: 1300, slideTo: 247 });
    tone(247, 0.2, 0.4, {
      type: 'sawtooth',
      gain: 0.05,
      filter: 1300,
      slideTo: 220,
      vibrato: { rate: 7, depth: 9 },
    });
  },

  levelUp(): void {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone(f, i * 0.06, 0.35, { type: 'triangle', gain: 0.07 }),
    );
    sfx.swoosh();
  },

  swoosh(): void {
    noise(0, 0.4, { type: 'bandpass', freq: 500, slideTo: 4500, gain: 0.05, attack: 0.15 });
  },

  /** A dusty puff. */
  puff(): void {
    noise(0, 0.12, { type: 'lowpass', freq: 500, gain: 0.08 });
  },

  /** A beat of silence, then a warm, resolved chord. Run at Inbox Zero. */
  inboxZero(): void {
    hush(1.2);
    [261.6, 329.6, 392, 587.3].forEach((f) =>
      tone(f, 1, 2.6, { type: 'triangle', gain: 0.06, attack: 0.05 }),
    );
    [1047, 1568, 2093].forEach((f, i) => tone(f, 1 + i * 0.08, 1.4, { gain: 0.03 }));
    tone(65.4, 1, 1.2, { gain: 0.22, slideTo: 50 });
  },
};

function pick<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)]!;
}
