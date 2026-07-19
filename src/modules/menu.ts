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

  const openMenu = () => {
    if (open) return;
    open = true;
    menu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    setScrollLock(true);
    if (!reduced) {
      gsap.fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: DUR.swift, ease: 'fluid' });
      gsap.fromTo(
        links,
        { y: 16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: DUR.reveal * 0.8, ease: 'lift', stagger: 0.05 },
      );
    }
    closeBtn.focus();
  };

  const closeMenu = (returnFocus = true) => {
    if (!open) return;
    open = false;
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
