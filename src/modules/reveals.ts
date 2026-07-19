/* Reveal choreography — masked rises, hairline draws, per-line H1 mask.
   All durations/eases are the motion tokens. Mobile runs at 0.8×.
   Deep links land pre-revealed (no replay). Reduced motion: everything
   rests in its final composed position (no hiding at all). */

import { gsap, ScrollTrigger } from './motion';
import { reduced, isNarrow, DUR } from './env';

const SCENES = ['arrival', 'services', 'portfolio', 'about', 'contact'];

const k = () => (isNarrow() ? 0.8 : 1);

/* Split an element's text into per-line mask/line span pairs.
   Returns a restore fn that puts the original content back. */
function splitLines(el: HTMLElement): { lines: HTMLElement[]; restore: () => void } {
  const original = el.innerHTML;
  const text = el.textContent ?? '';
  const words = text.split(' ');
  el.innerHTML = words
    .map((wd) => `<span class="h1-word" style="display:inline-block">${wd}</span>`)
    .join(' ');
  const spans = Array.from(el.querySelectorAll<HTMLElement>('.h1-word'));
  const rows: HTMLElement[][] = [];
  let lastTop: number | null = null;
  spans.forEach((s) => {
    const top = s.offsetTop;
    if (top !== lastTop) {
      rows.push([]);
      lastTop = top;
    }
    rows[rows.length - 1].push(s);
  });
  el.innerHTML = rows
    .map(
      (row) =>
        `<span class="h1-line-mask"><span class="h1-line">${row
          .map((s) => s.textContent)
          .join(' ')}</span></span>`,
    )
    .join('');
  const lines = Array.from(el.querySelectorAll<HTMLElement>('.h1-line'));
  return {
    lines,
    restore: () => {
      el.innerHTML = original;
    },
  };
}

function preReveal(section: HTMLElement): void {
  section.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.set(el, { clearProps: 'all' });
  });
  section.querySelectorAll<HTMLElement>('.rule').forEach((el) => {
    gsap.set(el, { clearProps: 'all' });
  });
}

/* Sections at/above a deep-linked hash land pre-revealed */
function preRevealedIds(): Set<string> {
  const done = new Set<string>();
  const hash = location.hash.replace('#', '');
  const idx = SCENES.indexOf(hash);
  if (idx > 0) for (let i = 0; i <= idx; i++) done.add(SCENES[i]);
  return done;
}

async function fontsSettled(): Promise<void> {
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]);
}

/* ── 01 Arrival · load sequence ─────────────────────────────────
   Prepared eagerly (elements hidden pre-paint, H1 split once fonts
   settle) and returns a play() so the sunrise veil can fire it at
   its settle step instead of on load. */
async function arrivalSetup(skip: boolean): Promise<() => void> {
  const noop = () => {};
  const section = document.getElementById('arrival');
  if (!section || reduced || skip) return noop;

  const kicker = section.querySelector<HTMLElement>('.arrival-kicker');
  const h1 = section.querySelector<HTMLElement>('h1');
  const lead = section.querySelector<HTMLElement>('.arrival-lead');
  const ctas = section.querySelector<HTMLElement>('.hero-ctas');
  const meta = section.querySelector<HTMLElement>('.arrival-meta');
  if (!kicker || !h1 || !lead || !ctas) return noop;

  gsap.set([kicker, lead, ctas], { y: 24, autoAlpha: 0 });
  gsap.set(h1, { autoAlpha: 0 });
  if (meta) gsap.set(meta, { autoAlpha: 0 });

  await fontsSettled();

  const { lines, restore } = splitLines(h1);
  gsap.set(h1, { autoAlpha: 0 });
  gsap.set(lines, { yPercent: 110 });

  return () => {
    gsap.set(h1, { autoAlpha: 1 });
    const f = k();
    const tl = gsap.timeline({ defaults: { ease: 'lift' } });
    tl.to(kicker, { y: 0, autoAlpha: 1, duration: DUR.reveal * f }, 0);
    tl.to(lines, { yPercent: 0, duration: DUR.reveal * f, stagger: 0.12 * f }, 0.12 * f);
    tl.to(lead, { y: 0, autoAlpha: 1, duration: DUR.reveal * f }, 0.26 * f);
    tl.to(ctas, { y: 0, autoAlpha: 1, duration: DUR.reveal * f }, 0.4 * f);
    if (meta) {
      tl.to(meta, { autoAlpha: 1, duration: DUR.reveal * 1.5 * f, ease: 'power1.inOut' }, 0.6 * f);
    }
    tl.call(() => restore(), [], `+=${0.1}`);
  };
}

/* ── Generic per-element masked rises ───────────────────────── */
function elementReveals(section: HTMLElement): void {
  section.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const delay = (parseInt(el.dataset.reveal || '0', 10) / 1000) * k();
    gsap.set(el, { y: 24, autoAlpha: 0 });
    gsap.to(el, {
      y: 0,
      autoAlpha: 1,
      duration: DUR.reveal * k(),
      ease: 'lift',
      delay,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
}

/* ── Rows: hairline draws, then content rises (80ms stagger) ── */
function rowReveals(section: HTMLElement): void {
  section.querySelectorAll<HTMLElement>('[data-row]').forEach((row) => {
    const delay = (parseInt(row.dataset.row || '0', 10) / 1000) * k();
    const rules = Array.from(row.querySelectorAll<HTMLElement>('.rule'));
    const content = Array.from(row.children).filter(
      (c) => !c.classList.contains('rule'),
    ) as HTMLElement[];
    const dot = row.querySelector<HTMLElement>('.pf-dot');

    gsap.set(rules, { scaleX: 0 });
    gsap.set(content, { y: 24, autoAlpha: 0 });

    const f = k();
    const tl = gsap.timeline({
      delay,
      scrollTrigger: { trigger: row, start: 'top 88%', once: true },
    });
    tl.to(rules, { scaleX: 1, duration: DUR.reveal * f, ease: 'glide' }, 0);
    tl.to(
      content,
      { y: 0, autoAlpha: 1, duration: DUR.reveal * f, ease: 'lift', stagger: 0.08 * f },
      0.24 * f,
    );
    if (dot) {
      tl.fromTo(
        dot,
        { scale: 1 },
        {
          scale: 1.6,
          duration: (DUR.swift / 2) * f,
          ease: 'fluid',
          yoyo: true,
          repeat: 1,
          transformOrigin: '50% 50%',
        },
        `-=${0.3 * f}`,
      );
    }
  });
}

/* ── About card: shadow settles from shadow-1 to shadow-2 ───── */
function aboutCardShadow(section: HTMLElement): void {
  const card = section.querySelector<HTMLElement>('.mech-card');
  if (!card) return;
  const s1 = '0 1px 2px rgba(12,30,55,.04), 0 6px 20px rgba(12,30,55,.05)';
  const s2 = '0 2px 4px rgba(12,30,55,.05), 0 16px 44px rgba(12,30,55,.08)';
  gsap.fromTo(
    card,
    { boxShadow: s1 },
    {
      boxShadow: s2,
      duration: DUR.reveal * 1.5,
      ease: 'lift',
      scrollTrigger: { trigger: card, start: 'top 88%', once: true },
    },
  );
}

export type ArrivalMode = 'auto' | 'deferred' | 'instant';

export function initReveals(arrivalMode: ArrivalMode = 'auto'): {
  playArrival: () => Promise<void>;
} {
  const noop = { playArrival: async () => {} };
  if (reduced) return noop; // everything already rests in final position

  const done = preRevealedIds();
  const skipArrival = done.size > 0 || arrivalMode === 'instant';

  const prepared = arrivalSetup(skipArrival);
  if (arrivalMode === 'auto') prepared.then((play) => play());

  ['services', 'portfolio', 'about', 'contact'].forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;
    if (done.has(id)) {
      preReveal(section);
      return;
    }
    elementReveals(section);
    rowReveals(section);
    if (id === 'about') aboutCardShadow(section);
  });

  ScrollTrigger.refresh();

  return {
    playArrival: () => prepared.then((play) => play()),
  };
}

/* 404 page: simple load-in stack (no scroll dependence) */
export function initLoadReveals(): void {
  if (reduced) return;
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  els.forEach((el) => gsap.set(el, { y: 24, autoAlpha: 0 }));
  fontsSettled().then(() => {
    els.forEach((el) => {
      const delay = (parseInt(el.dataset.reveal || '0', 10) / 1000) * k();
      gsap.to(el, { y: 0, autoAlpha: 1, duration: DUR.reveal * k(), ease: 'lift', delay });
    });
  });
}
