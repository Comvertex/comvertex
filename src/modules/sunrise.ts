/* Sunrise — initial-load veil sequence.

   A full-screen warm-white veil above everything, scroll locked:
   1. logo dawns (2000ms fade + 44px rise)
   2. slogan letters fade in at reading speed (480ms each, 48ms stagger)
   3. the veil background dissolves in step with the letters,
      surfacing the live weave + washes behind the type
   4. slogan fades, the veil logo FLIP-morphs into the header logo
      position, nav fades in, the hero rises and its reveals fire
   5. the real header logo switches on the frame the veil logo lands

   Plays once per browser session (sessionStorage `cvxSunrise`).
   Skipped — veil never rendered — for reduced motion, deep links
   and repeat visits in the same session. */

import { gsap } from './motion';
import { lenis } from './scroll';

const KEY = 'cvxSunrise';

export function sunriseSeen(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markSunriseSeen(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* private-mode storage — play it again next load, no harm */
  }
}

interface SunriseHooks {
  /** step 4: fire the hero's staggered reveals */
  onArrival: () => void;
}

const SLOGAN_LINES = ['Your Guiding Hand', 'To Digital Ascent'];

export function playSunrise({ onArrival }: SunriseHooks): void {
  const header = document.querySelector<HTMLElement>('.site-header');
  const headerLogo = document.querySelector<HTMLImageElement>('.header-logo img');
  const hero = document.getElementById('arrival');
  if (!header || !headerLogo || !hero) {
    onArrival();
    return;
  }

  // ── build the veil (only ever rendered when playing) ──
  const veil = document.createElement('div');
  veil.className = 'veil';
  veil.setAttribute('aria-hidden', 'true');

  const logo = document.createElement('img');
  logo.className = 'veil-logo';
  logo.src = '/logo-blue-text.png';
  logo.alt = '';
  veil.appendChild(logo);

  const slogan = document.createElement('div');
  slogan.className = 'veil-slogan';
  const chars: HTMLElement[] = [];
  SLOGAN_LINES.forEach((line) => {
    const row = document.createElement('div');
    for (const ch of line) {
      if (ch === ' ') {
        row.appendChild(document.createTextNode(' '));
        continue;
      }
      const s = document.createElement('span');
      s.textContent = ch;
      row.appendChild(s);
      chars.push(s);
    }
    slogan.appendChild(row);
  });
  veil.appendChild(slogan);
  document.body.appendChild(veil);

  // ── t=0 state: scroll locked, header dark until settle ──
  document.documentElement.style.overflow = 'hidden';
  lenis?.stop();
  gsap.set(header, { autoAlpha: 0 });
  gsap.set(headerLogo, { opacity: 0 }); // stays off until the swap frame
  gsap.set(logo, { opacity: 0, y: 44 });
  gsap.set(chars, { opacity: 0 });

  const n = chars.length;
  const bgDur = n * 0.048 + 0.48;
  const tSettle = 1.5 + n * 0.048 + 1.0;

  // dev-only QA: ?sunrise-pause freezes the timelines for stepping
  const qaPause = import.meta.env.DEV && location.search.includes('sunrise-pause');

  const tl = gsap.timeline({ paused: qaPause });
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__sunrise = tl;
  }

  // 1 · logo dawns
  tl.to(logo, { opacity: 1, duration: 2, ease: 'power1.inOut' }, 0);
  tl.to(logo, { y: 0, duration: 2, ease: 'lift' }, 0);

  // 2 · slogan, per-letter, reading speed
  tl.to(chars, { opacity: 1, duration: 0.48, stagger: 0.048, ease: 'none' }, 1.5);

  // 3 · background dawns — fully clear as the last letter lands
  tl.to(veil, { backgroundColor: 'rgba(252,251,248,0)', duration: bgDur, ease: 'none' }, 1.5);

  // 4 · vertical settle
  tl.call(
    () => {
      // restore the scrollbar BEFORE measuring, or the layout shift
      // makes the logo land off-target
      document.documentElement.style.overflow = '';
      lenis?.start();

      const from = logo.getBoundingClientRect();
      const to = headerLogo.getBoundingClientRect();

      const settle = gsap.timeline({ paused: qaPause });
      if (import.meta.env.DEV) {
        (window as unknown as Record<string, unknown>).__sunriseSettle = settle;
      }
      settle.to(slogan, { opacity: 0, duration: 0.7, ease: 'power1.out' }, 0);
      gsap.set(logo, { transformOrigin: 'top left' });
      settle.to(
        logo,
        {
          x: to.left - from.left,
          y: to.top - from.top,
          scale: to.height / from.height,
          duration: 1.1,
          ease: 'lift',
        },
        0,
      );
      settle.to(header, { autoAlpha: 1, duration: 0.8, ease: 'power1.inOut' }, 0);
      settle.fromTo(hero, { y: 28 }, { y: 0, duration: 1.05, ease: 'lift', clearProps: 'y' }, 0);
      settle.call(() => onArrival(), [], 0);

      // 5 · swap on the landing frame
      settle.call(
        () => {
          gsap.set(headerLogo, { opacity: 1 });
          veil.remove();
        },
        [],
        1.12,
      );
    },
    [],
    tSettle,
  );
}
