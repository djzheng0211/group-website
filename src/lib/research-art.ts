// Scroll-driven artwork for the research page, generated as static HTML/SVG
// strings at build time in the same dot-and-bond style as the homepage hero.
//
// Nothing here animates by itself: every moving part reads a single CSS
// custom property, --p (0 → 1), which the page script sets from how far the
// reader has scrolled through that thrust. Elements tagged with --at fade in
// once --p passes that value. With no JS, --p defaults to 1, so each picture
// renders in its finished state.
//
// Each builder returns the SVG plus any HTML labels laid over it (HTML so the
// text stays legible at phone widths, where the SVG is scaled down).

import { heat, rng } from './hero-art';
import { ART, accentOpacity } from './theme';

const W = 720, H = 600;
const GOLD = ART.accent;
// The enzyme's metal site (metal, its halo, its bonds, the atoms that bind it
// and the pocket lining). Classic draws it in the gold highlight; a theme
// whose highlight is red-like gives it its own color, apart from the oxygens.
const METAL = ART.metal ?? GOLD;
const metalTint = (e: number) => ART.metal ?? heat(e);
const f = (n: number) => n.toFixed(1);
const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const svg = (cls: string, body: string) =>
  `<svg class="story-svg ${cls}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${body}</svg>`;

// --- Closed loop -------------------------------------------------------------
// The stages of the loop (one node per approach bullet) around a ring that
// fills as you scroll. Inside, a running "best result so far" plot gains a
// point every round. Each stage lights up as the sample passes it: --at is
// its place around the loop (0 → 1), compared with --p in the CSS.

export function buildLoopArt(labels: string[]) {
  const cx = W / 2, cy = H / 2, R = 190;
  const n = Math.max(labels.length, 1);
  const ang = (k: number) => -Math.PI / 2 + (2 * Math.PI * k) / n;

  let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>`;
  s += `<circle class="loop-arc" cx="${cx}" cy="${cy}" r="${R}" pathLength="1" transform="rotate(-90 ${cx} ${cy})" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>`;

  // Direction chevrons halfway between stages
  for (let k = 0; k < n; k++) {
    const a = ang(k + 0.5);
    s += `<path d="M-4 -6L3 0L-4 6" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(${f(cx + R * Math.cos(a))} ${f(cy + R * Math.sin(a))}) rotate(${f((a * 180) / Math.PI + 90)})"/>`;
  }

  // Center plot: each experiment's result, and the best so far
  const M = 22, x0 = 258, x1 = 462, y0 = 372, hgt = 140;
  const r = rng(7);
  const vals = Array.from({ length: M }, (_, j) =>
    Math.min(0.97, Math.max(0.04, 0.12 + 0.74 * (1 - Math.exp(-j / 6)) + (r() - 0.5) * 0.36)),
  );
  const X = (j: number) => x0 + 8 + (j * (x1 - x0 - 16)) / (M - 1);
  const Y = (v: number) => y0 - v * hgt;
  s += `<path d="M${x0} ${y0 - hgt - 8}V${y0}H${x1 + 4}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"/>`;
  let best = 0, bestJ = 0, d = '';
  vals.forEach((v, j) => {
    if (v > best) { best = v; bestJ = j; }
    d += j ? `H${f(X(j))}V${f(Y(best))}` : `M${f(X(0))} ${f(Y(v))}`;
  });
  s += `<path class="loop-best" d="${d}" pathLength="1" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linejoin="round"/>`;
  vals.forEach((v, j) => {
    s += `<circle class="fade-at" style="--at:${(0.04 + (j / M) * 0.86).toFixed(3)}" cx="${f(X(j))}" cy="${f(Y(v))}" r="${f(3 + 2.2 * v)}" fill="${heat(v)}"/>`;
  });
  s += `<circle class="fade-at" style="--at:${(0.04 + (bestJ / M) * 0.86).toFixed(3)}" cx="${f(X(bestJ))}" cy="${f(Y(vals[bestJ]))}" r="11" fill="none" stroke="${GOLD}" stroke-width="1.4"/>`;

  // A sample travelling round the loop, at the head of the arc
  s += `<g class="loop-comet"><circle cx="${cx}" cy="${cy - R}" r="13" fill="${GOLD}" fill-opacity="${accentOpacity(0.25)}"/><circle cx="${cx}" cy="${cy - R}" r="5" fill="#fff"/></g>`;

  let html = '';
  labels.forEach((label, k) => {
    const a = ang(k), x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
    const at = (k / n).toFixed(3);
    s += `<g class="loop-node" style="--at:${at}"><circle class="loop-halo" cx="${f(x)}" cy="${f(y)}" r="20" fill="none" stroke="${GOLD}" stroke-width="1.4"/>`
      + `<circle class="loop-core" cx="${f(x)}" cy="${f(y)}" r="9"/><circle class="loop-fill" cx="${f(x)}" cy="${f(y)}" r="9.8"/></g>`;
    const c = Math.cos(a), lr = R + (Math.abs(c) > 0.3 ? 24 : 34);
    const align = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
    html += `<span class="art-label loop-label" data-align="${align}" style="--at:${at};left:${pct(cx + lr * c, W)};top:${pct(cy + lr * Math.sin(a), H)}">${esc(label)}</span>`;
  });
  html += `<span class="art-label art-caption" style="left:50%;top:${pct(y0 + 26, H)}" data-align="middle">best result, round by round</span>`;
  html += `<span class="art-label art-tag" style="left:6%;top:7%">self-driving lab</span>`;

  return svg('art-loop', s) + html;
}

// --- Operando spectra → machine learning → mechanism ---------------------------
// Starts as a waterfall of spectra recorded as the potential steps up: a new
// band (the active phase) grows in and drifts, its maximum tracked in gold,
// while a broad interfacial-water band (the microenvironment) strengthens,
// shifts and broadens, tracked in blue.
// Then the spectra fade as a small neural network appears on the left,
// whose inputs are the two tracked features; signals
// light it up layer by layer; and its single output points to the cycle it
// identifies, one of two competing catalytic cycles on the right (pathway 2,
// in gold) while the other (pathway 1) stays dim and dashed. The finished
// picture shows the model and the mechanism it identified side by side.

export function buildSpectraArt() {
  const K = 14, x0 = 112, x1 = 650, amp = 52;
  const base = (k: number) => 528 - k * 27;
  const g = (u: number, m: number, w: number) => Math.exp(-((u - m) ** 2) / (2 * w * w));
  const ramp = (t: number, a: number, b: number) => {
    const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
    return x * x * (3 - 2 * x);
  };
  const r = rng(19);
  const pt = (x: number, y: number) => ({ x, y });
  type P = { x: number; y: number };

  // Spectra
  let spectra = '';
  spectra += `<path d="M78 556V118M72 128L78 116L84 128" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.4" stroke-linejoin="round"/>`;
  spectra += `<path d="M${x0 - 6} 556H${x1 + 18}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"/>`;
  const apex: P[] = [], water: P[] = [];
  // Tracked trends: active phase in blue, microenvironment in coral
  const PHASE = ART.phase, MICRO = ART.micro;
  let traces = '';
  // Back to front, so each nearer trace hides the ones behind it
  for (let k = K - 1; k >= 0; k--) {
    const t = k / (K - 1), color = heat(0.08 + 0.55 * t);
    const growth = ramp(t, 0.2, 0.85), mB = 0.6 - 0.045 * t;
    // Microenvironment: a broad interfacial-water band that strengthens,
    // shifts and broadens as the potential rises
    const mW = 0.84 - 0.06 * t, wW = 0.04 + 0.025 * t;
    let line = '', top = pt(0, Infinity), wTop = pt(0, Infinity);
    const n = 140;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const v = 0.85 * (1 - 0.7 * growth) * g(u, 0.22, 0.03) + 1.15 * growth * g(u, mB, 0.028)
        + (0.28 + 0.3 * t) * g(u, mW, wW) + 0.12 * g(u, 0.4, 0.08) + (r() - 0.5) * 0.035;
      const x = x0 + u * (x1 - x0), y = base(k) - amp * v;
      line += `${i ? 'L' : 'M'}${f(x)} ${f(y)}`;
      if (Math.abs(u - mB) < 0.04 && y < top.y) top = pt(x, y);
      if (Math.abs(u - mW) < 0.05 && y < wTop.y) wTop = pt(x, y);
    }
    traces += `<path d="${line}L${x1} ${base(k) + 6}L${x0} ${base(k) + 6}Z" fill="${ART.ink}" fill-opacity="0.88"/>`
      + `<path d="${line}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/>`;
    if (growth > 0.12) apex.unshift(pt(top.x, top.y - 9));
    if (k % 2 === 1) water.unshift(pt(wTop.x, wTop.y - 9));
  }
  spectra += traces;
  spectra += `<polyline points="${apex.map((a) => `${f(a.x)},${f(a.y)}`).join(' ')}" fill="none" stroke="${PHASE}" stroke-width="1.4" stroke-dasharray="3 4"/>`;
  apex.forEach((a) => (spectra += `<circle cx="${f(a.x)}" cy="${f(a.y)}" r="3.6" fill="${PHASE}"/>`));
  spectra += `<polyline points="${water.map((a) => `${f(a.x)},${f(a.y)}`).join(' ')}" fill="none" stroke="${MICRO}" stroke-width="1.4" stroke-dasharray="3 4"/>`;
  water.forEach((a) => (spectra += `<circle cx="${f(a.x)}" cy="${f(a.y)}" r="3.4" fill="${MICRO}"/>`));

  // Two competing catalytic cycles sharing the active site, as an upright
  // figure eight, each through three intermediates: pathway 1 on top,
  // pathway 2 below, both turning clockwise. Angles are in degrees, SVG y down.
  const site = pt(568, 290), cr = 95;
  type Cycle = { c: P; nodes: { deg: number }[]; dir: 1 | -1 };
  const path1: Cycle = { c: pt(site.x, site.y - cr), dir: 1, nodes: [{ deg: 90 }, { deg: 180 }, { deg: 270 }, { deg: 0 }] };
  const path2: Cycle = { c: pt(site.x, site.y + cr), dir: 1, nodes: [{ deg: 270 }, { deg: 0 }, { deg: 90 }, { deg: 180 }] };
  const onRing = (cy: Cycle, deg: number, rad = cr) =>
    pt(cy.c.x + rad * Math.cos((deg * Math.PI) / 180), cy.c.y + rad * Math.sin((deg * Math.PI) / 180));

  // The model: a small neural network. Its inputs are the two tracked
  // spectral features (active phase in blue, microenvironment in coral); its
  // single output, centered on the network, points to the pathway it
  // identifies.
  const layers = [[162, 234, 346, 418], [187, 257, 327, 397], [222, 290, 358], [290]];
  const lx = [70, 142, 214, 284];
  const outL = layers.length - 1;
  const nodes = layers.map((ys, l) => ys.map((y) => pt(lx[l], y)));
  const inputColor = [PHASE, PHASE, MICRO, MICRO];


  let net = '';
  for (let l = 0; l < outL; l++)
    for (const a of nodes[l])
      for (const b of nodes[l + 1])
        net += `<path class="ml-edge" style="--l:${l}" d="M${a.x} ${a.y}L${b.x} ${b.y}" pathLength="1" fill="none" stroke="${GOLD}" stroke-opacity="${accentOpacity(0.45)}" stroke-width="1"/>`;
  nodes.forEach((layer, l) => layer.forEach((q, i) => {
    const r = l === outL ? 16 : 10;
    const fill = l === 0 ? inputColor[i] : GOLD;
    net += `<circle cx="${q.x}" cy="${q.y}" r="${f(r)}" fill="${ART.ink}" stroke="rgba(255,255,255,0.6)" stroke-width="1.4"/>`
      + `<circle class="fade-at" style="--at:${(0.48 + l * 0.07).toFixed(2)}" cx="${q.x}" cy="${q.y}" r="${f(r - 3.5)}" fill="${fill}"/>`;
  }));
  // Legend for the inputs, under the network
  net += `<circle cx="52" cy="472" r="5" fill="${PHASE}"/><circle cx="52" cy="506" r="5" fill="${MICRO}"/>`;

  // From the output to the pathway it identifies: an S-curve that leaves
  // the output level and arrives level with pathway 2's left side
  const out = nodes[outL][0], start = pt(out.x + 24, out.y), end = pt(site.x - cr - 12, path2.c.y);
  const bend = (end.x - start.x) / 2;
  const arrows = `<path d="M${f(start.x)} ${f(start.y)}C${f(start.x + bend)} ${f(start.y)} ${f(end.x - bend)} ${f(end.y)} ${f(end.x)} ${f(end.y)}" fill="none" stroke="${GOLD}" stroke-width="2.4"/>`
    + `<path d="M${f(end.x - 10)} ${f(end.y - 7)}L${f(end.x)} ${f(end.y)}L${f(end.x - 10)} ${f(end.y + 7)}" fill="none" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;

  // Rings with direction chevrons halfway between intermediates, then nodes
  const ring = (cy: Cycle, supported: boolean) => {
    let d = supported
      ? `<circle cx="${cy.c.x}" cy="${cy.c.y}" r="${cr}" fill="none" stroke="${GOLD}" stroke-opacity="${accentOpacity(0.22)}" stroke-width="9"/>`
        + `<circle cx="${cy.c.x}" cy="${cy.c.y}" r="${cr}" fill="none" stroke="${GOLD}" stroke-width="2.6"/>`
      : `<circle cx="${cy.c.x}" cy="${cy.c.y}" r="${cr}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.6" stroke-dasharray="5 5"/>`;
    const color = supported ? GOLD : 'rgba(255,255,255,0.5)';
    cy.nodes.forEach((n, i) => {
      const next = cy.nodes[(i + 1) % cy.nodes.length];
      let span = next.deg - n.deg;
      span = cy.dir > 0 ? ((span % 360) + 360) % 360 : -(((-span % 360) + 360) % 360);
      const mid = n.deg + span / 2, m = onRing(cy, mid), rad = (mid * Math.PI) / 180;
      const rot = (Math.atan2(cy.dir * Math.cos(rad), -cy.dir * Math.sin(rad)) * 180) / Math.PI;
      d += `<path d="M-5 -7L4 0L-5 7" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" transform="translate(${f(m.x)} ${f(m.y)}) rotate(${f(rot)})"/>`;
    });
    cy.nodes.slice(1).forEach((n) => {
      const q = onRing(cy, n.deg);
      d += supported
        ? `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="10" fill="${GOLD}"/>`
        : `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="9" fill="${ART.ink}" stroke="rgba(255,255,255,0.5)" stroke-width="1.4"/>`;
    });
    return d;
  };
  let diagram = ring(path1, false) + ring(path2, true) + arrows;
  diagram += `<circle cx="${site.x}" cy="${site.y}" r="21" fill="none" stroke="${GOLD}" stroke-opacity="${accentOpacity(0.6)}" stroke-width="1.2"/>`
    + `<circle cx="${site.x}" cy="${site.y}" r="12" fill="#fff"/>`;

  let s = `<g class="ml-src">${spectra}</g><g class="ml-dst">${diagram}</g><g class="ml-net">${net}</g>`;

  const last = apex[apex.length - 1];
  const html = `<span class="art-label art-tag ml-src" style="left:6%;top:7%">operando spectra</span>`
    + `<span class="art-label art-tag ml-dst" style="left:6%;top:7%">reaction mechanism</span>`
    + `<span class="art-label art-axis art-axis-y ml-src" style="left:${pct(60, W)};top:${pct(340, H)}">applied potential</span>`
    + `<span class="art-label art-axis ml-src" data-align="end" style="left:${pct(x1 + 18, W)};top:${pct(578, H)}">wavenumber</span>`
    + (last ? `<span class="art-label art-callout art-phase ml-src" data-align="end" style="left:${pct(last.x - 14, W)};top:${pct(last.y - 14, H)}">active phase forms</span>` : '')
    + (water.length ? `<span class="art-label art-callout art-micro ml-src" data-align="middle" style="left:${pct(water[water.length - 1].x, W)};top:${pct(water[water.length - 1].y - 26, H)}">microenvironment shifts</span>` : '')
    + `<span class="art-label ml-net" data-align="middle" style="left:${pct((lx[0] + lx[outL]) / 2, W)};top:${pct(layers[0][0] - 36, H)}">machine learning</span>`
    + `<span class="art-label art-phase art-callout ml-net" data-align="start" style="left:${pct(64, W)};top:${pct(472, H)}">active phase</span>`
    + `<span class="art-label art-micro art-callout ml-net" data-align="start" style="left:${pct(64, W)};top:${pct(506, H)}">microenvironment</span>`
    + `<span class="art-label ml-dst" data-align="middle" style="left:${pct(path1.c.x, W)};top:${pct(path1.c.y, H)}">pathway 1</span>`
    + `<span class="art-label art-callout ml-dst" data-align="middle" style="left:${pct(path2.c.x, W)};top:${pct(path2.c.y, H)}">pathway 2</span>`;
  return svg('art-spectra', s) + html;
}

// --- Biological → synthetic ---------------------------------------------------
// An enzyme (helices around a pocket with a metal active site) rearranges,
// atom by atom, into an ordered synthetic framework whose active site keeps
// the same arrangement: the metal, its three binding partners and the bound
// substrate. The same design, put to work in a material we can make.

export function buildMorphArt() {
  const cx = W / 2, cy = H / 2;

  // Framework: 5 × 4 metal nodes joined by linkers (each linker spans `bond`)
  const cols = 5, rows = 4, sx = 120, sy = 116;
  const gx = (c: number) => cx + (c - (cols - 1) / 2) * sx;
  const gy = (q: number) => cy + (q - (rows - 1) / 2) * sy;
  type Slot = { x: number; y: number; metal: boolean; bond?: string };
  const slots: Slot[] = [];
  for (let q = 0; q < rows; q++)
    for (let c = 0; c < cols; c++) {
      slots.push({ x: gx(c), y: gy(q), metal: true });
      if (c < cols - 1)
        slots.push({ x: (gx(c) + gx(c + 1)) / 2, y: gy(q), metal: false, bond: `M${f(gx(c))} ${f(gy(q))}H${f(gx(c + 1))}` });
      if (q < rows - 1)
        slots.push({ x: gx(c), y: (gy(q) + gy(q + 1)) / 2, metal: false, bond: `M${f(gx(c))} ${f(gy(q))}V${f(gy(q + 1))}` });
    }

  // The framework's active site mirrors the enzyme's: the node nearest the
  // middle keeps the metal, the linkers around it take the place of the
  // enzyme's metal-binding residues, and the substrate sits in the middle of
  // the cage beside it, bound to the metal as it was in the enzyme's pocket.
  const center = slots
    .filter((p) => p.metal)
    .reduce((b, p) => (Math.hypot(p.x - cx, p.y - cy) < Math.hypot(b.x - cx, b.y - cy) ? p : b));
  const cage = { x: center.x + sx / 2, y: center.y - sy / 2 };
  const free = slots.filter((p) => p !== center);
  const bonds = slots.map((p) => p.bond ?? '').join('');
  const binders = free.filter((p) => !p.metal && Math.hypot(p.x - center.x, p.y - center.y) < Math.max(sx, sy) * 0.6);

  // Enzyme: coiled helices joined by loops inside a faint surface, with a
  // pocket cut in from the top. The metal active site sits at the bottom of
  // the pocket, with a substrate bound above it; helices line both walls.
  const M = { x: 360, y: 292 };

  type P = { x: number; y: number };
  type Seg = { kind: 'helix'; a: P; b: P } | { kind: 'loop'; a: P; c: P; b: P };
  const pt = (x: number, y: number) => ({ x, y });
  const segs: Seg[] = [
    { kind: 'loop', a: pt(236, 512), c: pt(184, 504), b: pt(188, 446) },
    { kind: 'helix', a: pt(188, 446), b: pt(204, 262) }, // left
    { kind: 'loop', a: pt(204, 262), c: pt(196, 150), b: pt(272, 150) },
    { kind: 'helix', a: pt(272, 150), b: pt(278, 320) }, // pocket, left wall
    { kind: 'loop', a: pt(278, 320), c: pt(358, 432), b: pt(442, 322) },
    { kind: 'helix', a: pt(442, 322), b: pt(446, 152) }, // pocket, right wall
    { kind: 'loop', a: pt(446, 152), c: pt(510, 104), b: pt(528, 184) },
    { kind: 'helix', a: pt(528, 184), b: pt(560, 400) }, // right
    { kind: 'loop', a: pt(560, 400), c: pt(566, 486), b: pt(500, 486) },
    { kind: 'helix', a: pt(500, 486), b: pt(320, 474) }, // bottom
    { kind: 'loop', a: pt(320, 474), c: pt(256, 470), b: pt(244, 420) },
    { kind: 'helix', a: pt(244, 420), b: pt(238, 318) }, // inner left
    { kind: 'loop', a: pt(238, 318), c: pt(282, 348), b: pt(300, 424) },
    { kind: 'helix', a: pt(300, 424), b: pt(436, 418) }, // under the pocket
    { kind: 'loop', a: pt(436, 418), c: pt(492, 422), b: pt(494, 388) },
    { kind: 'helix', a: pt(494, 388), b: pt(490, 242) }, // inner right
    { kind: 'loop', a: pt(490, 242), c: pt(500, 196), b: pt(474, 194) },
  ];
  const lerp = (a: P, b: P, t: number) => pt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  const quad = (a: P, c: P, b: P, t: number) => lerp(lerp(a, c, t), lerp(c, b, t), t);

  // Backbone trace (helix axes, loop curves), resampled evenly to
  // give one atom per framework site
  const trace: P[] = [];
  for (const sg of segs)
    for (let i = 0; i <= 24; i++) trace.push(sg.kind === 'loop' ? quad(sg.a, sg.c, sg.b, i / 24) : lerp(sg.a, sg.b, i / 24));
  const cum = [0];
  for (let i = 1; i < trace.length; i++) cum.push(cum[i - 1] + Math.hypot(trace[i].x - trace[i - 1].x, trace[i].y - trace[i - 1].y));
  const chain = free.map((_, k) => {
    const at = (cum[cum.length - 1] * (k + 0.5)) / free.length;
    const i = Math.max(1, cum.findIndex((c) => c >= at));
    return lerp(trace[i - 1], trace[i], (at - cum[i - 1]) / (cum[i] - cum[i - 1] || 1));
  });
  const ligands = new Set(
    chain.map((p, i) => ({ i, d: Math.hypot(p.x - M.x, p.y - M.y) })).sort((a, b) => a.d - b.d).slice(0, 3).map((o) => o.i),
  );

  // Each chain atom moves to the nearest open framework site: the
  // metal-binding residues first, onto the linkers around the active site,
  // then the rest, inner atoms first
  const target = new Map<number, Slot>();
  const open = new Set(free);
  const claim = (i: number, from: Set<Slot>) => {
    let best: Slot | undefined, bd = Infinity;
    from.forEach((p) => { const d = Math.hypot(p.x - chain[i].x, p.y - chain[i].y); if (d < bd) { bd = d; best = p; } });
    from.delete(best!);
    open.delete(best!);
    target.set(i, best!);
  };
  const binderSites = new Set(binders);
  ligands.forEach((i) => claim(i, binderSites));
  [...chain.keys()]
    .filter((i) => !ligands.has(i))
    .sort((a, b) => Math.hypot(chain[a].x - cx, chain[a].y - cy) - Math.hypot(chain[b].x - cx, chain[b].y - cy))
    .forEach((i) => claim(i, open));

  // Closed smooth outline for the protein surface, with a deep U-shaped
  // pocket cut in from the top down to the metal
  const hull = [[166, 470], [148, 340], [158, 212], [208, 130], [262, 106], [306, 112], [314, 170],
    [316, 250], [332, 300], [360, 318], [388, 300], [404, 250], [406, 170], [414, 112], [462, 102],
    [548, 140], [602, 236], [612, 370], [572, 470], [470, 530], [330, 540], [216, 520]].map(([x, y]) => pt(x, y));
  let surface = '';
  hull.forEach((p1, i) => {
    const p0 = hull[(i - 1 + hull.length) % hull.length], p2 = hull[(i + 1) % hull.length], p3 = hull[(i + 2) % hull.length];
    surface += (i ? '' : `M${f(p1.x)} ${f(p1.y)}`)
      + `C${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
  });

  // A helix as a twisted ribbon, the usual cartoon of an α-helix: a strip
  // coiling around its axis, wide where it crosses in front or behind and
  // thin where it turns edge-on at the sides. The strip is cut into pieces at
  // each edge-on point; back pieces are drawn darker, under the front ones.
  const HELIX_FRONT = heat(0.22), HELIX_BACK = ART.helixBack;
  const helixRibbon = (a: P, b: P) => {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const u = pt((b.x - a.x) / len, (b.y - a.y) / len), v = pt(-u.y, u.x);
    const R = 13, pitch = 26, w = 5.5;
    const at = (t: number) => {
      const th = (t / pitch) * 2 * Math.PI, r = R * Math.max(0, Math.min(1, t / 10, (len - t) / 10));
      return { p: pt(a.x + u.x * t + v.x * r * Math.sin(th), a.y + u.y * t + v.y * r * Math.sin(th)), depth: Math.cos(th) };
    };
    let back = '', front = '';
    let left: P[] = [], right: P[] = [], facing = at(0).depth >= 0;
    const close = () => {
      if (left.length < 2) return;
      const poly = [...left, ...right.reverse()].map((q) => `${f(q.x)},${f(q.y)}`).join(' ');
      const shape = `<polygon points="${poly}" fill="${facing ? HELIX_FRONT : HELIX_BACK}" stroke="rgba(14,35,64,0.55)" stroke-width="0.8" stroke-linejoin="round"/>`;
      if (facing) front += shape; else back += shape;
    };
    for (let t = 0; t <= len + 0.01; t += 1.5) {
      const { p, depth } = at(Math.min(t, len));
      const p0 = at(Math.max(0, t - 0.75)).p, p1 = at(Math.min(len, t + 0.75)).p;
      const tl = Math.hypot(p1.x - p0.x, p1.y - p0.y) || 1;
      const n = pt(-(p1.y - p0.y) / tl, (p1.x - p0.x) / tl);
      const h = w * (0.18 + 0.82 * Math.abs(depth));
      const l = pt(p.x + n.x * h, p.y + n.y * h), r = pt(p.x - n.x * h, p.y - n.y * h);
      if ((depth >= 0) !== facing) {
        // Edge-on point: finish this piece and start the next from here
        left.push(p); right.push(p); close();
        left = [p]; right = [p]; facing = depth >= 0;
      }
      left.push(l); right.push(r);
    }
    close();
    return { back, front };
  };

  let loops = '', helixBack = '', helixFront = '';
  for (const sg of segs) {
    if (sg.kind === 'loop') {
      loops += `M${f(sg.a.x)} ${f(sg.a.y)}Q${f(sg.c.x)} ${f(sg.c.y)} ${f(sg.b.x)} ${f(sg.b.y)}`;
    } else {
      const { back, front } = helixRibbon(sg.a, sg.b);
      helixBack += back;
      helixFront += front;
    }
  }
  const ribbons = helixBack + helixFront;

  // Substrate: CO2 (O=C=O) bound to the metal through its carbon, above it,
  // lying at a slant across the pocket
  const tilt = (28 * Math.PI) / 180;
  const sub = [pt(360, 238), pt(360 - 24 * Math.cos(tilt), 238 + 24 * Math.sin(tilt)), pt(360 + 24 * Math.cos(tilt), 238 - 24 * Math.sin(tilt))];

  const dash = (a: P, b: P) =>
    `<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" stroke="${METAL}" stroke-opacity="${accentOpacity(0.8)}" stroke-width="1.3" stroke-dasharray="3 3"/>`;

  // Pocket design: side chains reaching into the pocket, with hydrogen bonds
  // (white dashes) holding the substrate's oxygens.
  // Side-chain tips: blue and green for the two groups that hold the
  // substrate (kept apart from the substrate's red oxygens), grey for carbon.
  const N = '#6f9be0', G = '#6cc489', C = '#aab4c0';
  const hbond = (a: P, b: P) =>
    `<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" stroke="rgba(255,255,255,0.75)" stroke-width="1.1" stroke-dasharray="2 3"/>`;
  const sideChain = (pts: P[], end: string) =>
    `<polyline points="${pts.map((q) => `${f(q.x)},${f(q.y)}`).join(' ')}" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`
    + pts.slice(1, -1).map((q) => `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="2.2" fill="rgba(255,255,255,0.85)"/>`).join('')
    + `<circle cx="${f(pts[pts.length - 1].x)}" cy="${f(pts[pts.length - 1].y)}" r="4.4" fill="${end}"/>`;
  const holdLeft = pt(313, 246), holdRight = pt(407, 246);

  let s = `<g class="morph-chain">`;
  s += `<path d="${surface}Z" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.26)" stroke-width="1.5"/>`;
  // The pocket's lining, tinted so the designed cavity stands out
  s += `<path d="M313 136L316 250C318 300 336 318 360 318C384 318 402 300 404 250L408 136" fill="none" stroke="${metalTint(0.9)}" stroke-opacity="${accentOpacity(0.45)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="${loops}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2.4" stroke-linecap="round"/>`;
  s += ribbons;
  s += sideChain([pt(287, 252), pt(300, 242), holdLeft], N);      // holds one oxygen
  s += sideChain([pt(433, 252), pt(420, 242), holdRight], G);     // holds the other
  s += sideChain([pt(288, 182), pt(300, 172), pt(312, 182)], C);  // gate residues at the
  s += sideChain([pt(432, 188), pt(420, 178), pt(408, 188)], C);  // pocket mouth
  s += hbond(holdLeft, sub[1]) + hbond(holdRight, sub[2]);
  ligands.forEach((i) => (s += dash(M, chain[i])));
  s += dash(M, sub[0]) + `</g>`;

  // Substrate moves as one piece, its carbon going to the middle of the cage.
  // It turns as it goes, by the same angle as its bond to the metal (straight
  // up in the enzyme, diagonal in the framework), so it keeps the same pose
  // relative to the metal.
  const angle = (from: P, to: P) => (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  const turn = angle(center, cage) - angle(M, sub[0]);

  s += `<g class="morph-grid"><path d="${bonds}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>`;
  ligands.forEach((i) => (s += dash(center, target.get(i)!)));
  s += dash(center, cage);

  // The framework's pocket design mirrors the enzyme's: functional groups on
  // the linkers around the cage reach in and hydrogen-bond the substrate's
  // oxygens, where the side chains did in the enzyme
  const spin = (v: P) => {
    const a = (turn * Math.PI) / 180;
    return pt(v.x * Math.cos(a) - v.y * Math.sin(a), v.x * Math.sin(a) + v.y * Math.cos(a));
  };
  const cageO = sub.slice(1).map((o) => {
    const v = spin(pt(o.x - sub[0].x, o.y - sub[0].y));
    return pt(cage.x + v.x, cage.y + v.y);
  });
  // Each oxygen keeps the same partner it had in the enzyme: the first is
  // held by the blue group, the second by the green one
  for (const site of [pt(cage.x, cage.y - sy / 2), pt(cage.x + sx / 2, cage.y)]) {
    const o = cageO.reduce((a, b) => (Math.hypot(b.x - site.x, b.y - site.y) < Math.hypot(a.x - site.x, a.y - site.y) ? b : a));
    const d = Math.hypot(site.x - o.x, site.y - o.y);
    const end = pt(o.x + ((site.x - o.x) / d) * 24, o.y + ((site.y - o.y) / d) * 24);
    s += sideChain([site, end], o === cageO[0] ? N : G) + hbond(end, o);
  }
  s += `</g>`;

  // Moves an element from `from` to `to`, turning it by `rot` degrees about `from`
  const move = (from: P, to: P, rot = 0) =>
    `class="morph-atom" style="--dx:${f(to.x - from.x)};--dy:${f(to.y - from.y)};--d:${(from.x / W).toFixed(3)}`
    + (rot ? `;--rot:${f(rot)};--ox:${f(from.x)}px;--oy:${f(from.y)}px"` : '"');
  const atom = (from: P, to: Slot, a: string, b: string) =>
    `<g ${move(from, to)}><circle class="morph-a" cx="${f(from.x)}" cy="${f(from.y)}" ${a}/><circle class="morph-b" cx="${f(from.x)}" cy="${f(from.y)}" ${b}/></g>`;
  const metal = `r="7" fill="${METAL}"`, linker = `r="4" fill="rgba(255,255,255,0.85)"`, binder = `r="5" fill="${metalTint(0.8)}"`;
  // Backbone atoms show as dots along the loops; on a helix the ribbon
  // already draws the chain, so they stay hidden until they move off it
  const onHelix = (p: P) => segs.some((sg) => {
    if (sg.kind !== 'helix') return false;
    const dx = sg.b.x - sg.a.x, dy = sg.b.y - sg.a.y, l2 = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((p.x - sg.a.x) * dx + (p.y - sg.a.y) * dy) / l2));
    return Math.hypot(p.x - (sg.a.x + t * dx), p.y - (sg.a.y + t * dy)) < 1;
  });
  chain.forEach((p, i) => {
    const to = target.get(i)!;
    if (ligands.has(i)) s += atom(p, to, binder, binder);
    else s += atom(p, to, `r="2.4" fill="rgba(255,255,255,${onHelix(p) ? 0 : 0.7})"`, to.metal ? metal : linker);
  });

  s += `<g ${move(sub[0], cage, turn)}>`;
  // C=O double bonds as pairs of parallel lines, then carbon (grey) and oxygens (red)
  const [c, ...oxygens] = sub;
  for (const o of oxygens) {
    // offset each pair of lines perpendicular to the bond, whatever its angle
    const l = Math.hypot(o.x - c.x, o.y - c.y), nx = -(o.y - c.y) / l, ny = (o.x - c.x) / l;
    for (const k of [-2.6, 2.6])
      s += `<line x1="${f(c.x + nx * k)}" y1="${f(c.y + ny * k)}" x2="${f(o.x + nx * k)}" y2="${f(o.y + ny * k)}" stroke="rgba(255,255,255,0.8)" stroke-width="1.6"/>`;
  }
  s += `<circle cx="${c.x}" cy="${c.y}" r="6" fill="#c9d2dc"/>`;
  oxygens.forEach((o) => (s += `<circle cx="${f(o.x)}" cy="${f(o.y)}" r="7" fill="${ART.oxygen}"/>`));
  s += `</g>`;

  // The metal and its halo move as one piece onto the framework node
  s += `<g ${move(M, center)}><circle cx="${M.x}" cy="${M.y}" r="17" fill="none" stroke="${METAL}" stroke-opacity="${accentOpacity(0.6)}" stroke-width="1.2"/>`;
  s += `<circle cx="${M.x}" cy="${M.y}" r="9" fill="${METAL}"/></g>`;

  const html = `<span class="art-label art-tag morph-from" style="left:6%;top:7%">enzyme</span>`
    + `<span class="art-label art-tag morph-to" style="left:6%;top:7%">synthetic framework</span>`;
  return svg('art-morph', s) + html;
}

export function buildStoryArt(id: string, labels: string[]) {
  if (id === 'operando-spectroscopy') return buildSpectraArt();
  if (id === 'bioinspired-design') return buildMorphArt();
  return buildLoopArt(labels);
}
