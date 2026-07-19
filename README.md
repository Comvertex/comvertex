# comvertex.digital — v2 "Digital Ascent"

Static single-page site for Comvertex (fractional direction & digital consultancy).
Five scenes + 404, built from the design hand-off in `design_handoff_comvertex_site/`
(not committed — tokens.css there is the source of truth for every colour, size,
duration and easing).

## Stack

- **Vite + vanilla TypeScript** — static output, no framework
- **GSAP + ScrollTrigger** — reveals, header condense, scroll-spy
- **Lenis** (lerp 0.09) — the scroll camera
- **OGL** — the weave: WebGL node field (instanced line quads + points)
- **Netlify Forms** — contact form, client-side success crossfade, no backend

Fonts are self-hosted woff2 only: Satoshi + Switzer (Fontshare licence) and
JetBrains Mono (OFL). Zero third-party requests site-wide; no analytics, no
cookie banner.

## Develop

```sh
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/
npm run preview
```

QA: append `?reduced` to the URL to force the JS reduced-motion path
(the CSS path follows the real `prefers-reduced-motion` media query).

## Deploy

Netlify builds `npm run build` and publishes `dist/` (see `netlify.toml`).
`404.html` in the publish directory is picked up automatically.
