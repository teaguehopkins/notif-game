interface Props {
  count: number;
  /** Shown as text for screen readers, e.g. "Collection". */
  label?: string;
}

/** The red dot. Shows a number when there's more than one thing behind it. */
export function Badge({ count, label }: Props) {
  if (count <= 0) return null;
  const text = label ? `${label}, ${count} new` : `${count} new`;
  return (
    <span class={count > 1 ? 'badge badge--count' : 'badge'} role="status" aria-label={text}>
      <span aria-hidden="true">{count > 1 ? (count > 99 ? '99+' : count) : ''}</span>
    </span>
  );
}

export function NewPill() {
  return (
    <span class="new-pill" aria-label="new">
      NEW
    </span>
  );
}
