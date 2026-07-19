import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/site.css';

import { reduced, finePointer } from './modules/env';
import { ScrollTrigger } from './modules/motion';
import { initScroll, initHeader, initSpy, type SceneId } from './modules/scroll';
import { initMenu } from './modules/menu';
import { initReveals, type ArrivalMode } from './modules/reveals';
import { sunriseSeen, markSunriseSeen, playSunrise } from './modules/sunrise';
import { initCursor } from './modules/cursor';
import { initForm } from './modules/form';
import type { WeaveHandle } from './modules/weave';

let weave: WeaveHandle | null = null;
let currentScene: SceneId = 'arrival';

/* Per-scene weave mood: +15% density on Portfolio; −30% and slowed on Contact */
const MOODS: Record<SceneId, [number, number]> = {
  arrival: [1, 1],
  services: [1, 1],
  portfolio: [1.15, 1],
  about: [1, 1],
  contact: [0.7, 0.6],
};

function applyMood(id: SceneId): void {
  currentScene = id;
  weave?.setMood(...MOODS[id]);
}

/* Sunrise gate: first clean arrival this session gets the veil; deep
   links, reduced motion and repeat visits land in final state instead */
const deepLink = location.hash.length > 1;
const sunrise = !reduced && !deepLink && !sunriseSeen();
markSunriseSeen();
const arrivalMode: ArrivalMode = sunrise ? 'deferred' : deepLink ? 'auto' : 'instant';

initScroll();
initHeader();
initMenu();
const { playArrival } = initReveals(arrivalMode);
initSpy(applyMood);
initCursor();

if (sunrise) playSunrise({ onArrival: () => void playArrival() });

initForm((successEl) => {
  // one orange node drifts to rest beside the confirmation line
  const r = successEl.getBoundingClientRect();
  const x = Math.min(window.innerWidth - 24, r.right + 28);
  const y = r.top + r.height / 2;
  weave?.landOrangeNode(x, y);
});

/* The weave — lazy init after first paint; fades in over --dur-scene */
function startWeave(): void {
  const canvas = document.getElementById('weave') as HTMLCanvasElement | null;
  if (!canvas) return;
  import('./modules/weave').then(({ createWeave }) => {
    weave = createWeave({ canvas, reduced });
    applyMood(currentScene);

    // Portfolio row hover: the weave gathers gently behind it
    if (finePointer && !reduced) {
      document.querySelectorAll<HTMLElement>('.pf-row').forEach((row) => {
        row.addEventListener('pointerenter', () =>
          weave?.setFocusRect(row.getBoundingClientRect()),
        );
        row.addEventListener('pointerleave', () => weave?.setFocusRect(null));
      });
    }
  });
}

if ('requestIdleCallback' in window) {
  requestIdleCallback(startWeave, { timeout: 600 });
} else {
  setTimeout(startWeave, 250);
}

/* Trigger positions are first measured against fallback-font layout; the
   swap to the real fonts changes the document height after window.load,
   so re-measure whenever the body actually resizes */
let refreshTimer = 0;
const ro = new ResizeObserver(() => {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
});
ro.observe(document.body);
document.fonts.addEventListener('loadingdone', () => ScrollTrigger.refresh());
