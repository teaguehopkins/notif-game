import { useEffect } from 'preact/hooks';
import { game, useEngine } from '../game';

/** Where focus should go next, in priority order. */
const TARGETS = [
  '.item-card--new',
  '.tab:has(.badge)',
  '.back-btn',
  '.play-btn:has(.badge)',
  '.menu-tile:has(.badge)',
  '.play-btn',
];

let lastFocused: Element | null = null;
if (typeof document !== 'undefined') {
  document.addEventListener('focusin', (e) => {
    lastFocused = e.target as Element;
  });
}

/**
 * Clearing things removes the element you were on: a cleared card, a closed modal, a menu you
 * left. When that happens, move focus to the next sensible thing instead of dropping it on <body>.
 */
export function FocusKeeper() {
  useEngine();
  const route = game.route.value;
  useEffect(() => {
    const t = setTimeout(() => {
      if (document.querySelector('[aria-modal="true"]')) return;
      const active = document.activeElement;
      const onNothing = !active || active === document.body;
      const lost =
        !!lastFocused &&
        (!lastFocused.isConnected ||
          lastFocused.classList.contains('item-card--seen') ||
          (onNothing && (lastFocused as HTMLButtonElement).disabled));
      if (!lost) return;
      for (const sel of TARGETS) {
        const el = document.querySelector<HTMLElement>(sel);
        if (el) {
          el.focus();
          return;
        }
      }
    }, 0);
    return () => clearTimeout(t);
  }, [game.version.value, route]);
  return null;
}
