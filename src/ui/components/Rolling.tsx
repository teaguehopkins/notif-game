import { useEffect, useRef, useState } from 'preact/hooks';
import { prefersReducedMotion } from '../motion';

/** A number that counts up (or down) to its new value instead of jumping. */
export function Rolling({ value, ms = 450 }: { value: number; ms?: number }) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;
    if (prefersReducedMotion() || Math.abs(value - from) === 1) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min((t - t0) / ms, 1);
      const v = Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3)));
      shownRef.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span class={shown !== value ? 'rolling rolling--on' : 'rolling'}>{shown}</span>;
}
