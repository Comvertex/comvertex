/* Mobile full-screen menu sheet */

import { gsap } from './motion';
import { reduced, DUR } from './env';
import { lenis } from './scroll';

export function initMenu(): void {
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  const closeBtn = document.getElementById('menu-close');
  if (!burger || !menu || !closeBtn) return;

  const links = Array.from(menu.querySelectorAll<HTMLElement>('.menu-links a'));
  let open = false;

  const setScrollLock = (lock: boolean) => {
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    if (lock) lenis?.stop();
    else lenis?.start();
  };

  const contact = menu.querySelector<HTMLElement>('.menu-contact');

  const openMenu = () => {
    if (open) return;
    open = true;
    menu.hidden = false;
    // next frame, so the bars→× morph transitions instead of snapping
    requestAnimationFrame(() => menu.classList.add('is-open'));
    burger.setAttribute('aria-expanded', 'true');
    setScrollLock(true);
    if (!reduced) {
      gsap.fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: DUR.swift, ease: 'fluid' });
      gsap.fromTo(
        links,
        { y: 20, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: DUR.reveal * 0.8,
          ease: 'lift',
          stagger: 0.06,
          delay: 0.08,
        },
      );
      if (contact) {
        gsap.fromTo(
          contact,
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: DUR.reveal * 0.8, ease: 'lift', delay: 0.3 },
        );
      }
    }
    closeBtn.focus();
  };

  const closeMenu = (returnFocus = true) => {
    if (!open) return;
    open = false;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    setScrollLock(false);
    if (reduced) {
      menu.hidden = true;
    } else {
      gsap.to(menu, {
        autoAlpha: 0,
        duration: DUR.swift,
        ease: 'fluid',
        onComplete: () => {
          menu.hidden = true;
          gsap.set(menu, { clearProps: 'opacity,visibility' });
        },
      });
    }
    if (returnFocus) burger.focus();
  };

  burger.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', () => closeMenu());
  links.forEach((l) => l.addEventListener('click', () => closeMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) closeMenu();
  });
}
