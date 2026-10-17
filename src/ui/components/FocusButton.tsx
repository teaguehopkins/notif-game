import type { ComponentProps } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

/** A button that takes focus when it appears mid-interaction, so keyboard focus isn't dropped. */
export function FocusButton(props: ComponentProps<'button'>) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return <button ref={ref} {...props} />;
}
