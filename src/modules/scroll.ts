/* Camera: Lenis smooth scroll (lerp 0.09) + anchor navigation + scroll-spy + header */

import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './motion';
import { reduced, DUR, easeGlide } from './env';

export let lenis: Lenis | null = null;

export function initScroll(): void {
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis!.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  // Nav clicks: scrollTo over --dur-scene with --ease-glide
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href')!;
      if (hash.length < 2) return;
      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.start();
        lenis.scrollTo(target, { duration: DUR.scene, easing: easeGlide });
      } else {
        target.scrollIntoView();
      }
      history.replaceState(null, '', hash);
    });
  });
}

export function initHeader(): void {
  const header = document.getElementById('site-header');
  const progress = header?.querySelector<HTMLElement>('.header-progress');
  if (!header) return;

  let condensed = false;
  const onScroll = () => {
    const sc = window.scrollY;
    const c = sc > 48;
    if (c !== condensed) {
      condensed = c;
      header.classList.toggle('is-condensed', c);
    }
    if (progress) {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      progress.style.transform = `scaleX(${Math.min(1, Math.max(0, sc / max))})`;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
}

export type SceneId = 'arrival' | 'services' | 'portfolio' | 'about' | 'contact';

export function initSpy(onScene?: (id: SceneId) => void): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-spy]'));
  const setActive = (id: string | null) => {
    links.forEach((l) => l.classList.toggle('is-active', l.dataset.spy === id));
  };

  (['arrival', 'services', 'portfolio', 'about', 'contact'] as SceneId[]).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        if (!self.isActive) return;
        setActive(id === 'arrival' ? null : id);
        onScene?.(id);
      },
    });
  });
}
