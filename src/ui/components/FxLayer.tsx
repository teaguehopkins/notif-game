import { useEffect, useRef } from 'preact/hooks';
import { attachCanvas, fx } from '../fx';
import { game } from '../game';

/** Badged things that can do the "notice me" wiggle while you're idle. */
const WIGGLERS = '.menu-tile:has(.badge), .tab:has(.badge), .play-btn:has(.badge), .item-card--new';
const IDLE_WIGGLE_MS = 8000;

/** The particle canvas, plus the idle wiggle. Decorative, and invisible to pointers. */
export function FxLayer() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    attachCanvas(ref.current);
    const t = setInterval(() => {
      const s = game.screen.value;
      if ((s !== 'story' && s !== 'zen') || document.hidden) return;
      if (document.querySelector('[aria-modal="true"]') || game.idleMs() < IDLE_WIGGLE_MS) return;
      const all = document.querySelectorAll(WIGGLERS);
      const el = all[Math.floor(Math.random() * all.length)];
      // Wiggle the icon and the dot, not the button, so it never moves under a click.
      fx.wiggle(el?.querySelector('.badge, .new-pill'));
      fx.wiggle(el?.querySelector('.menu-tile__icon, .item-card__icon'));
    }, 2600);
    return () => {
      clearInterval(t);
      attachCanvas(null);
    };
  }, []);
  return <canvas ref={ref} class="fx-canvas" aria-hidden="true" />;
}
