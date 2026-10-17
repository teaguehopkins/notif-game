import type { ComponentChildren } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';

interface Props {
  title: string;
  icon?: string;
  children: ComponentChildren;
  /** Esc closes only when this is provided. Popups don't get one. */
  onClose?: () => void;
  variant?: 'default' | 'finale' | 'small';
  /** Stack position, so later modals sit on top. */
  layer?: number;
}

const FOCUSABLE = 'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])';

/** Accessible dialog: focuses its first control, traps Tab, restores focus when closed. */
export function Modal({ title, icon, children, onClose, variant = 'default', layer = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const first =
      el?.querySelector<HTMLElement>('.modal__actions ' + FOCUSABLE) ??
      el?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? el)?.focus();
    return () => previous?.focus?.();
  }, [title]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (items.length === 0) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div class="modal-backdrop" style={{ zIndex: 100 + layer }}>
      <div
        ref={ref}
        class={`modal modal--${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <div class="modal__header">
          {icon && (
            <span class="modal__icon" aria-hidden="true">
              {icon}
            </span>
          )}
          <h2 id={titleId} class="modal__title">
            {title}
          </h2>
          {onClose && (
            <button class="modal__close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
