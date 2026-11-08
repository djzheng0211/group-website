// Generates the homepage hero artwork as a static SVG string at build time.
//
// The picture: a top-down contour map of an activity "volcano" (summit = best
// material, plus a smaller hill = local optimum), overlaid with a network of
// candidate materials. Three closed-loop searches explore that network from
// different starting points; explored points are colored by their "measured"
// result, the contours show clearly only where there is data, and the gold
// route traces the climb to the summit.
//
// Everything is seeded, so the output is identical on every build.

import { ART, accentA } from './theme';

type Pt = { x: number; y: number; s?: number };
type Net = { pts: Pt[]; adj: Set<number>[]; r: () => number };

const W = 1200, H = 380;
const GOLD = ART.accent;

// Terrain: main summit + a smaller hill (local optimum)
const S = { x: 930, y: 170 }, SX = 1.45, H2 = { x: 1135, y: 330 };
const radMain = (p: Pt) => Math.hypot((p.x - S.x) / SX, p.y - S.y);
const radHill = (p: Pt) => Math.hypot((p.x - H2.x) / 1.2, p.y - H2.y);
const elev = (p: Pt) => Math.max(1 - radMain(p) / 260, 0.42 * (1 - radHill(p) / 85));

// Starting points of the three searches (the first one is drawn as the gold route)
const STARTS: [number, number][] = [[599, 284], [640, 40], [1180, 60]];

export function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);
const line = (a: Pt, b: Pt, op: number, w = 1) =>
  `<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" stroke="rgba(255,255,255,${op})" stroke-width="${w}"/>`;
const dot = (p: Pt, r: number, op: number) =>
  `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(r)}" fill="rgba(255,255,255,${op})"/>`;

// Measured value -> color: muted blue (low) -> white -> gold (high)
export function heat(e: number) {
  const stops: [number, number[]][] = [[0, ART.heat[0]], [0.55, ART.heat[1]], [1, ART.heat[2]]];
  // One shade of the high color: values past the cutoff use it as is
  if (ART.heatCutoff !== undefined) {
    if (e >= ART.heatCutoff) return `rgb(${ART.heat[2].join(',')})`;
    const t = Math.max(0, e) / ART.heatCutoff, [ca, cb] = ART.heat;
    return `rgb(${ca.map((c, i) => Math.round(c + (cb[i] - c) * t)).join(',')})`;
  }
  e = Math.pow(Math.max(0, Math.min(1, e)), 1.4);
  for (let k = 1; k < stops.length; k++) {
    if (e <= stops[k][0]) {
      const [a, ca] = stops[k - 1], [b, cb] = stops[k], t = (e - a) / (b - a);
      return `rgb(${ca.map((c, i) => Math.round(c + (cb[i] - c) * t)).join(',')})`;
    }
  }
  return `rgb(${ART.heat[2].join(',')})`;
}

function terrain(alpha: number) {
  const ring = (cx: number, cy: number, sx: number, r0: number, k: number, amp: number) => {
    let d = '';
    for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.04) {
      const rr = r0 * (1 + amp * Math.sin(3 * t + k * 0.4) + amp * 0.4 * Math.cos(5 * t - k * 0.3));
      d += (t ? 'L' : 'M') + f(cx + sx * rr * Math.cos(t)) + ' ' + f(cy + rr * Math.sin(t));
    }
    return d + 'Z';
  };
  let s = '';
  for (let k = 1; k <= 13; k++) {
    const op = ((k % 4 === 0 ? 0.28 : 0.14) * alpha).toFixed(3);
    s += `<path d="${ring(S.x, S.y, SX, 12 + 215 * Math.pow(k / 13, 1.35), k, 0.12)}" fill="none" stroke="rgba(255,255,255,${op})" stroke-width="1"/>`;
  }
  for (let k = 1; k <= 4; k++) {
    s += `<path d="${ring(H2.x, H2.y, 1.2, 14 + 17 * k, k + 5, 0.08)}" fill="none" stroke="rgba(255,255,255,${(0.13 * alpha).toFixed(3)})" stroke-width="1"/>`;
  }
  return s;
}

// Candidate network spread across the map (index 0 = summit, 1 = hill)
function mapNetwork(seed: number, count = 95): Net {
  const r = rng(seed);
  const pts: Pt[] = [{ ...S }, { ...H2 }];
  while (pts.length < count) {
    const p = { x: 500 + r() * 720, y: 6 + r() * 368, s: 1.4 + r() * 2.2 };
    if (pts.every((q) => Math.hypot(p.x - q.x, p.y - q.y) > 26)) pts.push(p);
  }
  const adj = pts.map(() => new Set<number>());
  pts.forEach((p, i) =>
    pts
      .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y) }))
      .filter((o) => o.j !== i && o.d < 135)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .forEach((o) => { adj[i].add(o.j); adj[o.j].add(i); }),
  );
  return { pts, adj, r };
}

// Closed-loop search: each round expands the best results so far (exploit)
// plus a few random explored points (explore), for at least `minRounds` rounds.
function explore(net: Net, start: number, exploitK: number, exploreK: number, minRounds: number) {
  const { pts, adj, r } = net;
  const explored = new Set([start]), expanded = new Set<number>(), parent = new Map<number, number>();
  for (let round = 0; round < 200 && (!explored.has(0) || round < minRounds); round++) {
    const open = [...explored].filter((i) => !expanded.has(i));
    if (!open.length) break;
    open.sort((a, b) => elev(pts[b]) - elev(pts[a]));
    const pick = open.slice(0, exploitK);
    const rest = open.slice(exploitK);
    for (let e = 0; e < exploreK && rest.length; e++) pick.push(rest.splice(Math.floor(r() * rest.length), 1)[0]);
    for (const u of pick) {
      expanded.add(u);
      for (const v of adj[u]) if (!explored.has(v)) { explored.add(v); parent.set(v, u); }
    }
  }
  const route: number[] = [];
  if (explored.has(0)) for (let u: number | undefined = 0; u !== undefined; u = parent.get(u)) route.unshift(u);
  return { explored, route };
}

const nearestIdx = (pts: Pt[], x: number, y: number) =>
  pts.reduce((b, p, i) => (i > 1 && Math.hypot(p.x - x, p.y - y) < Math.hypot(pts[b].x - x, pts[b].y - y) ? i : b), 2);

export function buildHeroArt(id = 'hero') {
  const net = mapNetwork(31);
  const { pts, adj } = net;
  const runs = STARTS.map(([x, y]) => explore(net, nearestIdx(pts, x, y), 1, 3, 7));
  const best = runs[0].route.length ? runs[0] : runs.find((x) => x.route.length)!;
  const seen = new Set<number>();
  runs.forEach((x) => x.explored.forEach((i) => seen.add(i)));

  // Mask that reveals the contours only around measured points
  let reveal = '';
  seen.forEach((i) => (reveal += `<circle cx="${f(pts[i].x)}" cy="${f(pts[i].y)}" r="54" fill="url(#${id}-rg)"/>`));

  // Background: faint full terrain, revealed terrain, unexplored network
  let base = `<g opacity="0.14">${terrain(0.9)}</g><g mask="url(#${id}-data)">${terrain(1.25)}</g>`;
  adj.forEach((m, u) => m.forEach((v) => { if (v > u && !(seen.has(u) && seen.has(v))) base += line(pts[u], pts[v], 0.07); }));
  pts.forEach((p, i) => { if (i > 1 && !seen.has(i)) base += dot(p, (p.s ?? 2) * 0.75, 0.2); });

  // Foreground: explored network, colored by measured value
  let top = '';
  adj.forEach((m, u) => m.forEach((v) => { if (v > u && seen.has(u) && seen.has(v)) top += line(pts[u], pts[v], 0.26); }));
  const onRoute = new Set(best.route);
  [...seen]
    .sort((a, b) => elev(pts[a]) - elev(pts[b]))
    .forEach((i) => {
      if (i > 1 && !onRoute.has(i)) {
        const e = elev(pts[i]);
        top += `<circle cx="${f(pts[i].x)}" cy="${f(pts[i].y)}" r="${f(1.8 + 2.8 * Math.max(0, e))}" fill="${heat(e)}" fill-opacity="0.92"/>`;
      }
    });

  // Local optimum (smaller hill)
  top += `<circle cx="${H2.x}" cy="${H2.y}" r="11" fill="none" stroke="${accentA(0.75)}" stroke-width="1.4"/><circle cx="${H2.x}" cy="${H2.y}" r="3.5" fill="${accentA(0.75)}"/>`;

  // Gold route to the summit
  top += `<polyline points="${best.route.map((i) => f(pts[i].x) + ',' + f(pts[i].y)).join(' ')}" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linejoin="round"/>`;
  best.route.slice(0, -1).forEach((i) => {
    top += `<circle cx="${f(pts[i].x)}" cy="${f(pts[i].y)}" r="4.2" fill="${heat(elev(pts[i]))}" stroke="${GOLD}" stroke-width="1.4"/>`;
  });

  // Search starting points
  runs.forEach((x) => {
    const p = pts[x.route[0] ?? 0];
    top += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="5" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="1.4"/>`;
  });

  // Summit
  top += `<circle cx="${S.x}" cy="${S.y}" r="15" fill="none" stroke="${accentA(0.6)}" stroke-width="1.2"/><circle cx="${S.x}" cy="${S.y}" r="7" fill="${GOLD}"/>`;

  const lens = buildLens(id);

  return `<svg class="hero-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="${id}-fade" x1="0" x2="1"><stop offset="0.36" stop-color="#fff" stop-opacity="0"/><stop offset="0.62" stop-color="#fff" stop-opacity="1"/></linearGradient>
<mask id="${id}-fademask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#${id}-fade)"/></mask>
<radialGradient id="${id}-rg"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<mask id="${id}-data" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#000"/>${reveal}</mask>
<clipPath id="${id}-lens"><circle cx="${LENS.x}" cy="${LENS.y}" r="${LENS.r - 1}"/></clipPath>
</defs>
<g mask="url(#${id}-fademask)">${base}${top}</g>
${lens}
</svg>`;
}

// Zoom lens from the summit onto the best material's active site
// ("understanding how they work"), drawn in the same dot-and-bond style as the map.
const LENS = { x: 1098, y: 108, r: 58 };

function buildLens(id: string) {
  const r1 = 15;
  const dx = LENS.x - S.x, dy = LENS.y - S.y, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  let s = '';
  for (const sg of [1, -1]) {
    s += `<line x1="${f(S.x + nx * r1 * sg)}" y1="${f(S.y + ny * r1 * sg)}" x2="${f(LENS.x + nx * LENS.r * sg)}" y2="${f(LENS.y + ny * LENS.r * sg)}" stroke="${accentA(0.6)}" stroke-width="1"/>`;
  }
  s += `<circle cx="${LENS.x}" cy="${LENS.y}" r="${LENS.r}" fill="rgba(${ART.inkRgb},0.9)" stroke="${accentA(0.75)}" stroke-width="1.4"/>`;

  const P = (x: number, y: number) => ({ x: LENS.x + x, y: LENS.y + y });
  let inner = '';
  // faint contour arcs, echoing the map
  for (const rr of [70, 86, 102]) inner += `<circle cx="${LENS.x}" cy="${LENS.y + 80}" r="${rr}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;

  // material: rows of atoms filling the bottom of the lens, fading with depth
  const rows: Pt[][] = [20, 34, 48, 62].map((y, k) => {
    const row: Pt[] = [];
    // even rows include x = 0, so the active site sits on a surface atom
    for (let x = -64 - (k % 2) * 8; x <= 72; x += 16) row.push(P(x, y));
    return row;
  });
  rows.forEach((row, k) => {
    const op = 0.3 - k * 0.05;
    row.forEach((p, i) => { if (i) inner += line(row[i - 1], p, op); });
    if (k) row.forEach((p) => rows[k - 1].forEach((q) => { if (Math.abs(q.x - p.x) < 9) inner += line(q, p, op); }));
  });
  rows.slice(1).forEach((row, k) => row.forEach((p) => (inner += dot(p, 2.6, +(0.45 - k * 0.08).toFixed(2)))));
  rows[0].forEach((p) => {
    if (Math.abs(p.x - LENS.x) > 1) inner += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="3.1" fill="${heat(0.55)}" fill-opacity="0.85"/>`;
  });

  // active site (gold, haloed like the summit)
  const site = P(0, 20);
  inner += `<circle cx="${f(site.x)}" cy="${f(site.y)}" r="9" fill="none" stroke="${accentA(0.65)}" stroke-width="1.1"/><circle cx="${f(site.x)}" cy="${f(site.y)}" r="4.4" fill="${GOLD}"/>`;

  // adsorbed intermediate, styled like the gold-route nodes
  const ad = P(0, 2), ad2 = P(9, -5);
  inner += line(site, ad, 0.55) + line(ad, ad2, 0.55);
  inner += `<circle cx="${f(ad.x)}" cy="${f(ad.y)}" r="3.4" fill="${heat(0.8)}" stroke="${GOLD}" stroke-width="1.2"/>`;
  inner += dot(ad2, 2.3, 0.85);

  // product leaving along a dashed path
  const pr1 = P(30, -28), pr2 = P(38, -33);
  inner += `<path d="M${f(ad2.x + 4)} ${f(ad2.y - 4)} Q${f(LENS.x + 20)} ${f(LENS.y - 22)} ${f(pr1.x - 4)} ${f(pr1.y + 3)}" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1" stroke-dasharray="2 3"/>`;
  inner += line(pr1, pr2, 0.6) + dot(pr1, 2.6, 0.85) + dot(pr2, 2.6, 0.85);

  return s + `<g clip-path="url(#${id}-lens)">${inner}</g>`;
}
