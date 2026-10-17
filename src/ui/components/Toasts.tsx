import { useEffect, useRef } from 'preact/hooks';
import { fx } from '../fx';
import { game, type Toast } from '../game';

function ToastCard({ t }: { t: Toast }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Confetti once the slam lands.
    const timer = setTimeout(() => {
      const r = el.getBoundingClientRect();
      fx.confetti({ x: r.left + 28, y: r.top + r.height / 2 }, 24);
    }, 260);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div class="toast" ref={ref}>
      <span class="toast__icon" aria-hidden="true">
        {t.icon}
      </span>
      <span class="toast__text">
        <span class="toast__label">{t.label}</span>
        <span class="toast__title">{t.title}</span>
      </span>
    </div>
  );
}

export function Toasts() {
  return (
    <div class="toasts" aria-live="polite">
      {game.toasts.value.map((t) => (
        <ToastCard key={t.key} t={t} />
      ))}
    </div>
  );
}
