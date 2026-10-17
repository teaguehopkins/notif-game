interface Props {
  count: number;
}

/**
 * The red dot. Shows a number when there's more than one thing behind it. The visual dot is
 * hidden from screen readers; the hidden text joins the parent button's name ("Mail (3 new)").
 */
export function Badge({ count }: Props) {
  if (count <= 0) return null;
  return (
    <>
      <span class={count > 1 ? 'badge badge--count' : 'badge'} aria-hidden="true">
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
