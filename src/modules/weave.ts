/* The weave — persistent node field, production OGL re-implementation
   of the prototype's canvas-2D reference.

   · viewport-sized WebGL canvas (fixed), field parallaxes at 0.3× scroll
   · density: area/16000 (≥700px) — ~90 nodes/viewport at 1440, cap 440;
     area/9000 below 700px (~mobile reference density)
   · every ~43rd node is orange, links glow warm
   · links within 150px (105px <700px); alphas run ~50% above the
     prototype reference (client asked for a more present field)
   · gaussian pointer pull (lerp 0.05), faint upward drift, edge wrap
   · per-scene mood: density +15% on Portfolio, −30% and slowed on Contact
   · 60fps cap, DPR ≤2, paused when tab hidden
   · reduced motion: one seeded still frame, no drift, no pointer */

import { Renderer, Program, Mesh, Geometry, Transform } from 'ogl';

export interface WeaveHandle {
  setMood(density: number, speed: number): void;
  setFocusRect(rect: DOMRect | null): void;
  landOrangeNode(x: number, y: number): void;
  /** begin rendering (no-op if already running) — used with startPaused */
  start(): void;
  destroy(): void;
}

export interface WeaveOptions {
  canvas: HTMLCanvasElement;
  reduced: boolean;
  seed?: number;
  /** build everything but hold rendering until start() — lets the sunrise
      veil run without WebGL cost, then fade the field in after landing */
  startPaused?: boolean;
  /** 404: one orange node sits alone, unconnected — anchor in viewport px */
  loneAnchor?: () => { x: number; y: number } | null;
}

const MAX_NODES = 440;
const MAX_SEGS = 4200;

const BLUE = [43 / 255, 95 / 255, 163 / 255] as const;
const ORANGE = [194 / 255, 73 / 255, 28 / 255] as const;

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface WNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  orange: boolean;
  a: number; // current alpha (density modulation)
  g: number; // cursor-contact glow (0..1, eased)
  gt: number; // glow target set by the cursor pass each frame
  px: number; // projected draw pos (CSS px, viewport space)
  py: number;
}

const POINT_VERT = /* glsl */ `
attribute vec2 position;
attribute float aSize;
attribute vec4 aColor;
uniform vec2 uRes;
varying vec4 vColor;
void main() {
  vColor = aColor;
  vec2 clip = position / uRes * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = aSize;
}
`;

const POINT_FRAG = /* glsl */ `
precision mediump float;
varying vec4 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.32, length(c)) * vColor.a;
  gl_FragColor = vec4(vColor.rgb * a, a);
}
`;

const LINE_VERT = /* glsl */ `
attribute vec2 position; // x: 0..1 along segment, y: -0.5..0.5 across
attribute vec2 iA;
attribute vec2 iB;
attribute vec4 iColor;
attribute float iFlow;
uniform vec2 uRes;
uniform float uWidth;
varying vec4 vColor;
varying float vX;
varying float vFlow;
void main() {
  vColor = iColor;
  vX = position.x;
  vFlow = iFlow;
  vec2 dir = iB - iA;
  float len = max(length(dir), 0.0001);
  vec2 n = vec2(-dir.y, dir.x) / len;
  vec2 p = iA + dir * position.x + n * uWidth * position.y;
  vec2 clip = p / uRes * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

const LINE_FRAG = /* glsl */ `
precision mediump float;
varying vec4 vColor;
varying float vX;
varying float vFlow;
uniform float uTime;
void main() {
  float a = vColor.a;
  vec3 rgb = vColor.rgb;
  if (vFlow > 0.5) {
    // energy drains from the node (x=0) toward the cursor (x=1):
    // the line stays solid link-blue while a distinct orange packet
    // travels along it — colour does the work, not transparency
    float wave = 0.5 + 0.5 * sin((vX * 2.0 - uTime * 1.6) * 6.28318);
    float band = smoothstep(0.62, 0.95, wave);
    rgb = mix(rgb, vec3(0.761, 0.287, 0.11), band);
    a *= 0.9 + 0.5 * band;
  }
  gl_FragColor = vec4(rgb * a, a);
}
`;

export function createWeave(opts: WeaveOptions): WeaveHandle {
  const { canvas, reduced } = opts;
  // DPR cap: ≤2 desktop, ≤1.5 on small screens — fill rate is the
  // dominant cost on weak mobile GPUs and the field reads identically
  let dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2);
  const rnd =
    reduced || opts.seed != null ? mulberry32(opts.seed ?? 20260719) : Math.random;

  const renderer = new Renderer({
    canvas,
    dpr,
    alpha: true,
    depth: false,
    antialias: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  });
  const gl = renderer.gl;
  const scene = new Transform();

  // ── geometry: points ──
  const posData = new Float32Array((MAX_NODES + 1) * 2);
  const sizeData = new Float32Array(MAX_NODES + 1);
  const colorData = new Float32Array((MAX_NODES + 1) * 4);

  const pointGeo = new Geometry(gl, {
    position: { size: 2, data: posData, usage: gl.DYNAMIC_DRAW },
    aSize: { size: 1, data: sizeData, usage: gl.DYNAMIC_DRAW },
    aColor: { size: 4, data: colorData, usage: gl.DYNAMIC_DRAW },
  });
  const pointProgram = new Program(gl, {
    vertex: POINT_VERT,
    fragment: POINT_FRAG,
    uniforms: { uRes: { value: [1, 1] } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  pointProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const points = new Mesh(gl, { geometry: pointGeo, program: pointProgram, mode: gl.POINTS });
  points.setParent(scene);

  // ── geometry: instanced line quads ──
  const quad = new Float32Array([0, -0.5, 1, -0.5, 0, 0.5, 1, 0.5]);
  const iAData = new Float32Array(MAX_SEGS * 2);
  const iBData = new Float32Array(MAX_SEGS * 2);
  const iColorData = new Float32Array(MAX_SEGS * 4);
  const iFlowData = new Float32Array(MAX_SEGS);

  const lineGeo = new Geometry(gl, {
    position: { size: 2, data: quad },
    iA: { size: 2, data: iAData, instanced: 1, usage: gl.DYNAMIC_DRAW },
    iB: { size: 2, data: iBData, instanced: 1, usage: gl.DYNAMIC_DRAW },
    iColor: { size: 4, data: iColorData, instanced: 1, usage: gl.DYNAMIC_DRAW },
    iFlow: { size: 1, data: iFlowData, instanced: 1, usage: gl.DYNAMIC_DRAW },
  });
  const lineProgram = new Program(gl, {
    vertex: LINE_VERT,
    fragment: LINE_FRAG,
    uniforms: { uRes: { value: [1, 1] }, uWidth: { value: 1 }, uTime: { value: 0 } },
    transparent: true,
    cullFace: false,
    depthTest: false,
    depthWrite: false,
  });
  lineProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const lines = new Mesh(gl, {
    geometry: lineGeo,
    program: lineProgram,
    mode: gl.TRIANGLE_STRIP,
  });
  lines.setParent(scene);

  // ── simulation state ──
  const nodes: WNode[] = [];
  for (let i = 0; i < MAX_NODES; i++) {
    nodes.push({
      x: rnd(),
      y: rnd(),
      vx: (rnd() * 2 - 1) * 0.00014,
      vy: (rnd() * 2 - 1) * 0.00014 - 0.00005,
      r: 0.8 + rnd() * 1.1,
      orange: i % 43 === 7,
      a: 1,
      g: 0,
      gt: 0,
      px: 0,
      py: 0,
    });
  }

  let w = 0;
  let h = 0;
  let pad = 150;
  let linkR = 150;
  let fieldW = 0;
  let fieldH = 0;
  let baseCount = 0;

  const ptr = { x: 0.72, y: 0.2, tx: 0.72, ty: 0.2 };
  const mood = { density: 1, speed: 1, dCur: 1, sCur: 1 };
  // rect is retained while strength fades out, so the radius eases back
  const focus = { rect: null as DOMRect | null, active: false, s: 0 };
  let landing: { node: WNode; x: number; y: number; t: number } | null = null;
  let destroyed = false;
  let paused = false;
  let halted = false; // governor gave up — hold the last frame
  let raf = 0;
  let lastFrame = 0;
  let lastTime = performance.now();
  let shown = false;

  /* Frame-time governor: if a device can't hold the target frame rate,
     step down — first render resolution, then node density, and as a
     last resort hold a still frame (same design, weave at rest). */
  let densityScale = 1;
  let govTier = 0;
  let govWarmup = 60;
  let govCount = 0;
  let govAccum = 0;

  const governor = (gap: number) => {
    if (govWarmup > 0) {
      govWarmup--;
      return;
    }
    govAccum += Math.min(gap, 200);
    if (++govCount < 90) return;
    const avg = govAccum / govCount;
    govCount = 0;
    govAccum = 0;
    if (avg <= 27) return; // holding ≥ ~37fps of real work — leave it be
    govTier++;
    if (govTier === 1) {
      dpr = 1;
      renderer.dpr = 1;
      resize();
    } else if (govTier === 2) {
      densityScale = 0.6;
    } else {
      halted = true;
      cancelAnimationFrame(raf);
    }
  };

  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    renderer.setSize(w, h);
    linkR = w < 700 ? 105 : 150;
    pad = linkR;
    fieldW = w + pad * 2;
    fieldH = h + pad * 2;
    const density = w < 700 ? 9000 : 16000;
    baseCount = Math.min(Math.round(MAX_NODES / 1.15), Math.round((fieldW * fieldH) / density));
    pointProgram.uniforms.uRes.value = [w, h];
    lineProgram.uniforms.uRes.value = [w, h];
  };
  resize();
  for (let i = 0; i < MAX_NODES; i++) nodes[i].a = i < baseCount ? 1 : 0;

  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      // ignore height-only wobble (mobile URL bar) to avoid repaint jumps
      if (window.innerWidth === w && Math.abs(window.innerHeight - h) < 120) return;
      resize();
      if (reduced) frame(performance.now(), true);
    }, 150);
  };
  window.addEventListener('resize', onResize);

  // fast follower for the connection lines — same lerp as the visible
  // node cursor, so the energy lines appear to root at the cursor dot
  const cur = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

  const onMove = (e: PointerEvent) => {
    ptr.tx = e.clientX / w;
    ptr.ty = e.clientY / h;
    if (cur.tx < -9000) {
      cur.x = e.clientX;
      cur.y = e.clientY;
    }
    cur.tx = e.clientX;
    cur.ty = e.clientY;
  };
  const onLeave = () => {
    cur.tx = -9999;
    cur.ty = -9999;
    cur.x = -9999;
    cur.y = -9999;
  };
  const finePtr = matchMedia('(pointer: fine)').matches;
  if (!reduced && finePtr) {
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
  }

  const onVisibility = () => {
    if (reduced || halted || !started) return;
    if (document.hidden) {
      paused = true;
      cancelAnimationFrame(raf);
    } else if (paused && !destroyed) {
      paused = false;
      lastTime = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  const inFocus = (x: number, y: number): boolean => {
    const r = focus.rect;
    if (!r) return false;
    return x > r.left - 24 && x < r.right + 24 && y > r.top - 24 && y < r.bottom + 24;
  };

  function frame(now: number, force = false): void {
    const dt = force ? 16.7 : Math.min(50, now - lastTime);
    lastTime = now;
    const step = dt / 16.7;

    // mood easing
    mood.dCur += (mood.density - mood.dCur) * 0.03 * step;
    mood.sCur += (mood.speed - mood.sCur) * 0.03 * step;
    focus.s += ((focus.active ? 1 : 0) - focus.s) * 0.1 * step;

    if (!reduced) {
      ptr.x += (ptr.tx - ptr.x) * 0.05 * step;
      ptr.y += (ptr.ty - ptr.y) * 0.05 * step;
    }

    const activeCount = Math.min(MAX_NODES, Math.round(baseCount * mood.dCur * densityScale));
    const scrollOff = (window.scrollY * 0.3) % fieldH;
    const px = ptr.x * w;
    const py = ptr.y * h;
    const lone = opts.loneAnchor ? opts.loneAnchor() : null;

    // ── advance + project nodes ──
    for (let i = 0; i < MAX_NODES; i++) {
      const n = nodes[i];
      const target = i < activeCount ? 1 : 0;
      n.a += (target - n.a) * 0.04 * step;

      const isLanding = landing && landing.node === n;
      if (!reduced && !isLanding) {
        const sp = mood.sCur * step;
        n.x += n.vx * sp + Math.sin(now * 0.0003 + n.r * 9) * 0.00004 * sp;
        n.y += n.vy * sp + Math.cos(now * 0.00025 + n.r * 7) * 0.000015 * sp;
        if (n.x < -0.02) n.x = 1.02;
        if (n.x > 1.02) n.x = -0.02;
        if (n.y < -0.01) n.y = 1.01;
        if (n.y > 1.01) n.y = -0.01;
      }

      const wx = n.x * fieldW - pad;
      let wy = (n.y * fieldH - scrollOff) % fieldH;
      if (wy < 0) wy += fieldH;
      wy -= pad;

      if (reduced) {
        n.px = wx;
        n.py = wy;
      } else {
        const dx = px - wx;
        const dy = py - wy;
        const pull = Math.exp(-(dx * dx + dy * dy) / 90000) * 0.22;
        n.px = wx + dx * pull;
        n.py = wy + dy * pull;
      }

      if (isLanding && landing) {
        landing.t = Math.min(1, landing.t + 0.012 * step);
        const e = 1 - Math.pow(1 - landing.t, 3);
        n.px = n.px + (landing.x - n.px) * e;
        n.py = n.py + (landing.y - n.py) * e;
      }

      // cursor-contact glow: ignite fast, fade soft; dots warm to
      // orange and swell slightly while the cursor holds them
      n.g += (n.gt - n.g) * (n.gt > n.g ? 0.35 : 0.1) * step;
      n.gt = 0; // the cursor pass re-arms this every frame it connects

      posData[i * 2] = n.px;
      posData[i * 2 + 1] = n.py;
      sizeData[i] = Math.max(2, n.r * 2 * dpr * (1 + 0.4 * n.g));
      const c = n.orange ? ORANGE : BLUE;
      const glow = n.g;
      const alpha = ((n.orange ? 0.62 : 0.4) + 0.4 * glow) * n.a;
      colorData[i * 4] = c[0] + (ORANGE[0] - c[0]) * glow;
      colorData[i * 4 + 1] = c[1] + (ORANGE[1] - c[1]) * glow;
      colorData[i * 4 + 2] = c[2] + (ORANGE[2] - c[2]) * glow;
      colorData[i * 4 + 3] = Math.min(1, alpha);
    }

    // ── lone node (404) ──
    let drawCount = MAX_NODES;
    if (lone) {
      const bob = reduced ? 0 : Math.sin(now * 0.0011) * 4;
      posData[MAX_NODES * 2] = lone.x;
      posData[MAX_NODES * 2 + 1] = lone.y + bob;
      sizeData[MAX_NODES] = 2.2 * 2 * dpr;
      colorData[MAX_NODES * 4] = ORANGE[0];
      colorData[MAX_NODES * 4 + 1] = ORANGE[1];
      colorData[MAX_NODES * 4 + 2] = ORANGE[2];
      colorData[MAX_NODES * 4 + 3] = 0.85;
      drawCount = MAX_NODES + 1;
    }

    // ── links ──
    let seg = 0;
    const focusMul = 1 + 0.3 * focus.s;
    for (let i = 0; i < activeCount && seg < MAX_SEGS; i++) {
      const a = nodes[i];
      if (a.a < 0.03) continue;
      for (let j = i + 1; j < activeCount; j++) {
        const b = nodes[j];
        if (b.a < 0.03) continue;
        let eff = linkR;
        if (focus.s > 0.01 && inFocus(a.px, a.py) && inFocus(b.px, b.py)) {
          eff = linkR * focusMul;
        }
        const dx = a.px - b.px;
        const dy = a.py - b.py;
        if (Math.abs(dx) > eff || Math.abs(dy) > eff) continue;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= eff) continue;
        const near = 1 - d / eff;
        const warm = a.orange || b.orange;
        const alpha = near * (warm ? 0.25 : 0.19) * a.a * b.a;
        const c = warm ? ORANGE : BLUE;
        iAData[seg * 2] = a.px;
        iAData[seg * 2 + 1] = a.py;
        iBData[seg * 2] = b.px;
        iBData[seg * 2 + 1] = b.py;
        iColorData[seg * 4] = c[0];
        iColorData[seg * 4 + 1] = c[1];
        iColorData[seg * 4 + 2] = c[2];
        iColorData[seg * 4 + 3] = alpha;
        iFlowData[seg] = 0;
        seg++;
        if (seg >= MAX_SEGS) break;
      }
    }

    // ── cursor connections — the node cursor draws energy from the
    //    dots it reaches (flow-shaded lines, node → cursor) ──
    if (!reduced && cur.tx > -9000) {
      cur.x += (cur.tx - cur.x) * 0.28 * step;
      cur.y += (cur.ty - cur.y) * 0.28 * step;
      const CURSOR_R = linkR * 1.25;
      for (let i = 0; i < activeCount && seg < MAX_SEGS; i++) {
        const n = nodes[i];
        if (n.a < 0.05) continue;
        const dx = n.px - cur.x;
        const dy = n.py - cur.y;
        if (Math.abs(dx) > CURSOR_R || Math.abs(dy) > CURSOR_R) continue;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= CURSOR_R || d < 8) continue;
        const near = 1 - d / CURSOR_R;
        n.gt = near; // connected — the dot lights up while held
        iAData[seg * 2] = n.px;
        iAData[seg * 2 + 1] = n.py;
        iBData[seg * 2] = cur.x;
        iBData[seg * 2 + 1] = cur.y;
        iColorData[seg * 4] = BLUE[0];
        iColorData[seg * 4 + 1] = BLUE[1];
        iColorData[seg * 4 + 2] = BLUE[2];
        iColorData[seg * 4 + 3] = near * 0.34 * n.a;
        iFlowData[seg] = 1;
        seg++;
      }
    }

    // ── upload + draw ──
    pointGeo.attributes.position.needsUpdate = true;
    pointGeo.attributes.aSize.needsUpdate = true;
    pointGeo.attributes.aColor.needsUpdate = true;
    pointGeo.setDrawRange(0, drawCount);

    lineGeo.attributes.iA.needsUpdate = true;
    lineGeo.attributes.iB.needsUpdate = true;
    lineGeo.attributes.iColor.needsUpdate = true;
    lineGeo.attributes.iFlow.needsUpdate = true;
    lineGeo.instancedCount = seg;
    lineProgram.uniforms.uTime.value = now * 0.001;

    lines.visible = seg > 0;
    renderer.render({ scene });

    if (!shown) {
      shown = true;
      canvas.classList.add('is-on');
    }
  }

  function loop(now: number): void {
    if (destroyed || paused || halted) return;
    raf = requestAnimationFrame(loop);
    if (now - lastFrame < 16) return; // 60fps cap
    const gap = now - lastFrame;
    lastFrame = now;
    frame(now);
    governor(gap);
  }

  let started = false;
  const start = () => {
    if (started || destroyed) return;
    started = true;
    if (reduced) {
      frame(performance.now(), true);
    } else {
      lastTime = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };
  if (!opts.startPaused) start();

  return {
    start,
    setMood(density: number, speed: number) {
      mood.density = density;
      mood.speed = speed;
    },
    setFocusRect(rect: DOMRect | null) {
      if (rect) focus.rect = rect;
      focus.active = !!rect;
    },
    landOrangeNode(x: number, y: number) {
      const n = nodes.find((nd, i) => nd.orange && i < baseCount) ?? nodes[7];
      landing = { node: n, x, y, t: 0 };
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
