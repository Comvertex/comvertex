/* Node cursor — a 10px weave node follows the pointer (lerp 0.28,
   difference blend). Over interactive elements it yields to the
   native hand/caret. Fine pointers only; disabled for reduced motion. */

import { reduced, finePointer } from './env';

export function initCursor(): void {
  if (reduced || !finePointer) return;

  const dot = document.createElement('div');
  dot.setAttribute('aria-hidden', 'true');
  dot.style.cssText =
    'position:fixed; left:0; top:0; width:10px; height:10px; margin:-5px 0 0 -5px;' +
    'border-radius:999px; background:#FCFBF8; mix-blend-mode:difference;' +
    'pointer-events:none; z-index:9999; opacity:0;' +
    'transition:opacity 160ms cubic-bezier(0.33,1,0.68,1);';
  document.body.appendChild(dot);

  const cur = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    tx: window.innerWidth / 2,
    ty: window.innerHeight / 2,
  };
  let hot = false;

  const onMove = (e: PointerEvent) => {
    cur.tx = e.clientX;
    cur.ty = e.clientY;
    const t = e.target as Element | null;
    const h = !!(t && t.closest && t.closest('a, button, input, textarea'));
    if (h !== hot) hot = h;
    dot.style.opacity = h ? '0' : '1';
  };
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', () => {
    dot.style.opacity = '0';
  });

  const tick = () => {
    cur.x += (cur.tx - cur.x) * 0.28;
    cur.y += (cur.ty - cur.y) * 0.28;
    dot.style.transform = `translate(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
