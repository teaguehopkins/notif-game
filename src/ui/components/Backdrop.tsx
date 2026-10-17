import { useEffect, useRef } from 'preact/hooks';
import { prefersReducedMotion } from '../motion';

/**
 * The home screen scene: a moonlit castle, hills and a tavern, with drifting fog. Layers shift a
 * little with the pointer, and the whole scene dims as notifications pile up (`clutter`, 0 to 1).
 */
export function Backdrop({ clutter }: { clutter: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion() || !matchMedia('(pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty('--mx', String(e.clientX / innerWidth - 0.5));
      el.style.setProperty('--my', String(e.clientY / innerHeight - 0.5));
    };
    addEventListener('pointermove', onMove);
    return () => removeEventListener('pointermove', onMove);
  }, []);
  return (
    <div ref={ref} class="backdrop" aria-hidden="true" style={{ '--clutter': clutter }}>
      <svg
        class="backdrop__layer backdrop__far"
        viewBox="0 0 1200 500"
        preserveAspectRatio="xMidYMax meet"
      >
        <circle cx="930" cy="110" r="46" fill="#f6e7c1" opacity="0.85" />
        <circle cx="930" cy="110" r="90" fill="#f6e7c1" opacity="0.08" />
        <path
          d="M0 360 120 250 230 320 360 200 480 300 600 230 720 310 860 190 980 290 1100 230 1200 300V500H0z"
          fill="#2a1b24"
        />
      </svg>
      <svg
        class="backdrop__layer backdrop__mid"
        viewBox="0 0 1200 500"
        preserveAspectRatio="xMidYMax meet"
      >
        <g fill="#1d130f">
          <rect x="470" y="210" width="260" height="200" />
          <rect x="440" y="150" width="60" height="260" />
          <rect x="700" y="150" width="60" height="260" />
          <rect x="565" y="110" width="70" height="300" />
          <path d="M432 150h76l-38-60zM692 150h76l-38-60zM557 110h86l-43-80z" />
          {[440, 455, 470, 485, 700, 715, 730, 745].map((x) => (
            <rect key={x} x={x} y="140" width="10" height="14" />
          ))}
          <path d="M0 420c200-60 400-40 600-10s400 20 600-30V500H0z" />
        </g>
        <g class="backdrop__windows" fill="#ffcf6b">
          <rect x="590" y="160" width="10" height="16" rx="5" />
          <rect x="460" y="200" width="8" height="14" rx="4" />
          <rect x="720" y="230" width="8" height="14" rx="4" />
          <rect x="530" y="300" width="10" height="16" rx="5" />
          <rect x="650" y="280" width="10" height="16" rx="5" />
        </g>
      </svg>
      <div class="backdrop__fog backdrop__fog--a" />
      <svg
        class="backdrop__layer backdrop__near"
        viewBox="0 0 1200 500"
        preserveAspectRatio="xMidYMax meet"
      >
        <path d="M0 470c150-40 300-50 450-30s300 30 750-10V500H0z" fill="#120a06" />
        <g fill="#140b07">
          <rect x="60" y="360" width="150" height="120" />
          <path d="M40 365h190l-95-70z" />
          <rect x="1010" y="390" width="12" height="90" />
          <circle cx="1016" cy="370" r="44" />
          <circle cx="1060" cy="395" r="34" />
        </g>
        <rect x="100" y="400" width="26" height="30" rx="2" fill="#ffb347" opacity="0.9" />
        <rect x="150" y="400" width="26" height="30" rx="2" fill="#ffb347" opacity="0.7" />
        <rect
          x="210"
          y="380"
          width="44"
          height="20"
          rx="3"
          fill="#3d2615"
          stroke="#b9832f"
          stroke-width="2"
        />
      </svg>
      <div class="backdrop__fog backdrop__fog--b" />
      <div class="backdrop__dim" />
    </div>
  );
}
