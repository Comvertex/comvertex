import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/site.css';

import { reduced } from './modules/env';
import { initHeader } from './modules/scroll';
import { initLoadReveals } from './modules/reveals';
import { initCursor } from './modules/cursor';

initHeader();
initLoadReveals();
initCursor();

/* The weave runs here too — one orange node sits alone, unconnected,
   beside the headline */
function startWeave(): void {
  const canvas = document.getElementById('weave') as HTMLCanvasElement | null;
  const title = document.getElementById('nf-title');
  if (!canvas) return;
  import('./modules/weave').then(({ createWeave }) => {
    createWeave({
      canvas,
      reduced,
      seed: 404,
      loneAnchor: () => {
        if (!title) return null;
        const r = title.getBoundingClientRect();
        return {
          x: Math.min(window.innerWidth - 32, r.right + 40),
          y: r.top + r.height * 0.35,
        };
      },
    });
  });
}

if ('requestIdleCallback' in window) {
  requestIdleCallback(startWeave, { timeout: 600 });
} else {
  setTimeout(startWeave, 250);
}
