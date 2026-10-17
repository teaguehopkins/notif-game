import { game } from '../game';

export function Toasts() {
  return (
    <div class="toasts" aria-live="polite">
      {game.toasts.value.map((t) => (
        <div class="toast" key={t.key}>
          <span class="toast__icon" aria-hidden="true">
            {t.icon}
          </span>
          <span class="toast__text">
            <span class="toast__label">{t.label}</span>
            <span class="toast__title">{t.title}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
