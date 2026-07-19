/* Contact form — Netlify Forms post + client-side success crossfade */

import { gsap } from './motion';
import { reduced, DUR } from './env';

export function initForm(onSuccess?: (successEl: HTMLElement) => void): void {
  const form = document.querySelector<HTMLFormElement>('.contact-form');
  const success = document.querySelector<HTMLElement>('.form-success');
  if (!form || !success) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (button) button.disabled = true;

    const data = new FormData(form);
    const body = new URLSearchParams(data as unknown as Record<string, string>).toString();
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch {
      /* client-side success state regardless — no backend */
    }

    const show = () => {
      success.hidden = false;
      onSuccess?.(success);
    };

    if (reduced) {
      form.style.display = 'none';
      show();
      return;
    }

    gsap.to(form, {
      autoAlpha: 0,
      y: -8,
      duration: DUR.swift,
      ease: 'fluid',
      onComplete: () => {
        form.style.display = 'none';
        show();
        gsap.fromTo(
          success,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: DUR.swift, ease: 'fluid' },
        );
      },
    });
  });
}
