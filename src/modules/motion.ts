/* GSAP setup — token easings registered once, used by name everywhere */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, CustomEase);

/* tokens.css → named GSAP eases */
CustomEase.create('fluid', '0.33,1,0.68,1');
CustomEase.create('lift', '0.22,1,0.36,1');
CustomEase.create('glide', '0.65,0,0.35,1');
CustomEase.create('magnetic', '0.2,0.8,0.2,1');

export { gsap, ScrollTrigger };
