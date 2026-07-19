/* Environment flags + easing math shared across modules */

export const reduced =
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  new URLSearchParams(location.search).has('reduced'); // QA override
export const finePointer = matchMedia('(pointer: fine)').matches;

export const isNarrow = () => window.innerWidth <= 900;

/* Duration tokens (s) — mirrors tokens.css; JS choreography reads these */
export const DUR = {
  micro: 0.16,
  swift: 0.32,
  reveal: 0.64,
  scene: 1.0,
} as const;

/* cubic-bezier(p1x, p1y, p2x, p2y) → easing fn, exact match to CSS tokens */
export function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  const solveX = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-6) return t;
      const d = sampleDX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    while (lo < hi) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-6) return t;
      if (err > 0) hi = t;
      else lo = t;
      t = (lo + hi) / 2;
    }
    return t;
  };

  return (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : sampleY(solveX(x)));
}

/* Token easings as JS functions (for Lenis and manual rAF work) */
export const easeGlide = cubicBezier(0.65, 0, 0.35, 1);
