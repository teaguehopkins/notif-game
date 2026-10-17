import { isMuted } from '../audio/sfx';
import { prefersReducedMotion } from './motion';

/**
 * Juice: particles on one full-screen canvas, shakes, and haptics. Everything is decorative and
 * does nothing under prefers-reduced-motion (the CSS rule for that doesn't reach canvas or script
 * animations). The canvas loop only runs while particles are alive.
 */

export interface Point {
  x: number;
  y: number;
}

type Shape = 'dot' | 'rect' | 'coin' | 'gem' | 'star';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  age: number;
  life: number;
  size: number;
  color: string;
  shape: Shape;
  rot: number;
  vr: number;
  delay: number;
  /** Fly along a curve from (x, y) to here instead of using physics. */
  to?: { x: number; y: number; cx: number; cy: number; x0: number; y0: number };
}

const RED = ['#e5322d', '#ff5a52', '#c41f1a', '#ff8a84'];
const CONFETTI = ['#f0c35a', '#ffe29a', '#5bd16b', '#8fd3ff', '#e5322d', '#c08bff', '#ff9a3c'];
export const COLORS = {
  gold: '#f0c35a',
  gems: '#6fd3ff',
  dust: '#c08bff',
  tokens: '#ff9a3c',
  xp: '#ffe29a',
  red: '#e5322d',
};

const parts: Particle[] = [];
let canvas: HTMLCanvasElement | null = null;
let g: CanvasRenderingContext2D | null = null;
let raf = 0;
let last = 0;
let dpr = 1;
let lastPointer: Point | null = null;
let lastInput: 'pointer' | 'key' = 'pointer';

function on(): boolean {
  return !!g && !prefersReducedMotion();
}

function resize(): void {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
}

/** Called once by FxLayer with its canvas. */
export function attachCanvas(c: HTMLCanvasElement | null): void {
  canvas = c;
  g = c?.getContext('2d') ?? null;
  if (c) resize();
}

if (typeof window !== 'undefined') {
  addEventListener('resize', resize);
  addEventListener(
    'pointerdown',
    (e) => {
      lastPointer = { x: e.clientX, y: e.clientY };
      lastInput = 'pointer';
    },
    true,
  );
  addEventListener('keydown', () => (lastInput = 'key'), true);
}

function start(): void {
  if (raf || !g) return;
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

function frame(t: number): void {
  const dt = Math.min(t - last, 50);
  last = t;
  if (!g || !canvas) {
    raf = 0;
    return;
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, canvas.width, canvas.height);
  const k = dt / 16.67;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]!;
    if (p.delay > 0) {
      p.delay -= dt;
      continue;
    }
    p.age += dt;
    if (p.age >= p.life) {
      parts.splice(i, 1);
      continue;
    }
    if (p.to) {
      const u = easeInOut(p.age / p.life);
      const a = 1 - u;
      p.x = a * a * p.to.x0 + 2 * a * u * p.to.cx + u * u * p.to.x;
      p.y = a * a * p.to.y0 + 2 * a * u * p.to.cy + u * u * p.to.y;
    } else {
      p.vy += p.gravity * k;
      p.vx *= Math.pow(p.drag, k);
      p.vy *= Math.pow(p.drag, k);
      p.x += p.vx * k;
      p.y += p.vy * k;
    }
    p.rot += p.vr * k;
    const fade = p.to ? 1 : Math.min(1, (p.life - p.age) / 250);
    draw(g, p, fade);
  }
  raf = parts.length ? requestAnimationFrame(frame) : 0;
  if (!raf) g.clearRect(0, 0, canvas.width, canvas.height);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function draw(c: CanvasRenderingContext2D, p: Particle, alpha: number): void {
  c.save();
  c.globalAlpha = alpha;
  c.translate(p.x, p.y);
  c.rotate(p.rot);
  const s = p.size;
  switch (p.shape) {
    case 'dot':
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(0, 0, s, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.45)';
      c.beginPath();
      c.arc(-s * 0.3, -s * 0.3, s * 0.35, 0, Math.PI * 2);
      c.fill();
      break;
    case 'rect':
      c.fillStyle = p.color;
      c.fillRect(-s, -s * 0.5, s * 2, s);
      break;
    case 'coin': {
      // Spinning: squash horizontally with the rotation.
      c.scale(Math.max(Math.abs(Math.cos(p.rot * 2)), 0.15), 1);
      c.rotate(-p.rot);
      c.fillStyle = '#9a6a1f';
      c.beginPath();
      c.arc(0, 0, s, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(0, 0, s * 0.78, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'gem':
      c.fillStyle = p.color;
      c.beginPath();
      c.moveTo(0, -s);
      c.lineTo(s * 0.8, 0);
      c.lineTo(0, s);
      c.lineTo(-s * 0.8, 0);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.5)';
      c.fillRect(-s * 0.2, -s * 0.6, s * 0.3, s * 0.5);
      break;
    case 'star':
      c.fillStyle = p.color;
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = i % 2 ? s * 0.4 : s;
        const a = (i * Math.PI) / 4;
        c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath();
      c.fill();
      break;
  }
  c.restore();
}

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

function pickColor(colors: string[]): string {
  return colors[Math.floor(Math.random() * colors.length)]!;
}

function center(el: Element): Point {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export interface BurstOpts {
  count?: number;
  colors?: string[];
  speed?: number;
  size?: number;
  shape?: Shape;
  gravity?: number;
  life?: number;
  /** Radians; omit for all directions. */
  angle?: number;
  spread?: number;
}

export const fx = {
  /** Where the player last acted: the pointer, or the focused element for keyboard users. */
  origin(): Point {
    const el = document.activeElement;
    if ((lastInput === 'key' || !lastPointer) && el && el !== document.body) return center(el);
    return lastPointer ?? { x: innerWidth / 2, y: innerHeight / 2 };
  },

  burst(at: Point, o: BurstOpts = {}): void {
    if (!on()) return;
    const count = o.count ?? 10;
    for (let i = 0; i < count; i++) {
      const a =
        o.angle === undefined
          ? rand(0, Math.PI * 2)
          : o.angle + rand(-(o.spread ?? 0.6), o.spread ?? 0.6);
      const v = rand(0.5, 1) * (o.speed ?? 4);
      parts.push({
        x: at.x,
        y: at.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        gravity: o.gravity ?? 0.12,
        drag: 0.96,
        age: 0,
        life: (o.life ?? 650) * rand(0.7, 1.2),
        size: (o.size ?? 4) * rand(0.7, 1.3),
        color: pickColor(o.colors ?? RED),
        shape: o.shape ?? 'dot',
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.2, 0.2),
        delay: 0,
      });
    }
    start();
  },

  /** A red dot pops: a little ring of red. */
  pop(at: Point = fx.origin()): void {
    fx.burst(at, { count: 9, speed: 3.5, size: 3.5, gravity: 0.05, life: 450 });
  },

  /** Confetti from a point, thrown upward. Sometimes it's red dots instead. */
  confetti(at: Point, count = 40, redDots = Math.random() < 0.2): void {
    if (!on()) return;
    fx.burst(at, {
      count,
      colors: redDots ? RED : CONFETTI,
      shape: redDots ? 'dot' : 'rect',
      speed: 9,
      size: redDots ? 5 : 5,
      gravity: 0.22,
      life: 1600,
      angle: -Math.PI / 2,
      spread: 1.1,
    });
  },

  /** Dots fall off the top of the screen, as if draining away. */
  drain(count = 50): void {
    if (!on()) return;
    for (let i = 0; i < count; i++) {
      parts.push({
        x: rand(0, innerWidth),
        y: rand(-60, 40),
        vx: rand(-0.5, 0.5),
        vy: rand(1, 3),
        gravity: 0.25,
        drag: 0.99,
        age: 0,
        life: 2400,
        size: rand(4, 9),
        color: pickColor(RED),
        shape: 'dot',
        rot: 0,
        vr: 0,
        delay: rand(0, 600),
      });
    }
    start();
  },

  /**
   * Fly particles along an arc from one place to an element (coins into the gold counter).
   * The target is looked up after the next render, since it may be about to appear.
   */
  fly(
    from: Point,
    target: string,
    o: { count?: number; shape?: Shape; color?: string } = {},
  ): void {
    if (!on()) return;
    requestAnimationFrame(() => {
      const el = document.querySelector(target);
      if (!el) return;
      const to = center(el);
      const count = o.count ?? 8;
      for (let i = 0; i < count; i++) {
        const x0 = from.x + rand(-20, 20);
        const y0 = from.y + rand(-20, 20);
        parts.push({
          x: x0,
          y: y0,
          vx: 0,
          vy: 0,
          gravity: 0,
          drag: 1,
          age: 0,
          life: rand(650, 900),
          size: o.shape === 'star' ? 7 : 6,
          color: o.color ?? COLORS.gold,
          shape: o.shape ?? 'coin',
          rot: rand(0, Math.PI),
          vr: 0.25,
          delay: i * 45,
          to: {
            x: to.x,
            y: to.y,
            x0,
            y0,
            cx: (x0 + to.x) / 2 + rand(-80, 80),
            cy: Math.min(y0, to.y) - rand(60, 160),
          },
        });
      }
      start();
    });
  },

  /** Shake one element. Never the page itself: a transform there would unpin fixed modals. */
  shake(el: Element | null | undefined, level: 'small' | 'big' = 'small'): void {
    if (!el || prefersReducedMotion() || !('animate' in el)) return;
    const d = level === 'big' ? 10 : 4;
    (el as HTMLElement).animate(
      [
        { translate: '0 0' },
        { translate: `${-d}px ${d / 2}px` },
        { translate: `${d}px ${-d / 2}px` },
        { translate: `${-d * 0.6}px ${-d / 3}px` },
        { translate: `${d * 0.4}px ${d / 4}px` },
        { translate: '0 0' },
      ],
      { duration: level === 'big' ? 550 : 320, easing: 'ease-out' },
    );
  },

  /** A small "notice me" wiggle. */
  wiggle(el: Element | null | undefined): void {
    if (!el || prefersReducedMotion() || !('animate' in el)) return;
    (el as HTMLElement).animate(
      [
        { rotate: '0deg' },
        { rotate: '-12deg' },
        { rotate: '10deg' },
        { rotate: '-6deg' },
        { rotate: '0deg' },
      ],
      { duration: 600, easing: 'ease-in-out' },
    );
  },

  /** Haptics where supported. Goes with the sound toggle. */
  buzz(pattern: number | number[]): void {
    if (isMuted() || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Some browsers throw without a recent gesture.
    }
  },
};
