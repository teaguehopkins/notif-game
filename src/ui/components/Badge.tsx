import { useRef } from 'preact/hooks';

interface Props {
  count: number;
}

/**
 * The red dot. Shows a number when there's more than one thing behind it. The visual dot is
 * hidden from screen readers; the hidden text joins the parent button's name ("Mail (3 new)").
 * It pops in when it appears and flips when its count changes.
 */
export function Badge({ count }: Props) {
  const prev = useRef(0);
  // Remembered per count, so a re-render with the same count doesn't swap the animation.
  const ticked = useRef(false);
  if (prev.current !== count) {
    ticked.current = prev.current > 0 && count > 0;
    prev.current = count;
  }
  if (count <= 0) return null;
  return (
    <>
      <span
        key={count}
        class={`badge${count > 1 ? ' badge--count' : ''}${ticked.current ? ' badge--tick' : ''}`}
        aria-hidden="true"
      >
        {count > 1 ? (count > 99 ? '99+' : count) : ''}
      </span>
      <span class="sr-only">({count} new)</span>
    </>
  );
}

export function NewPill() {
  return (
    <>
      <span class="new-pill" aria-hidden="true">
        NEW
      </span>
      <span class="sr-only">(new)</span>
    </>
  );
}
