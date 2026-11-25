// Native drawing (Canvas 2D → textures) of every printed surface. No photos.
// Each printed board also gets a "light" texture: R = how much the LED light tints it, G = how much it glows.
import { R, RW, TARGET_R, BADGE_R, CENTER_R, TARGETS, PANEL_TOP, BOARD, CHANNEL, PLATES, ARROW } from './constants.js';
import { P, slotPolygon, arrowOutline, plateOutline } from './geometry.js';

const D2R = Math.PI / 180;
const FONT = '"Arial Rounded MT Bold", "Arial Black", "Helvetica Neue", sans-serif';

// a canvas whose 2D context draws in world units, y up
function layer(x0, y0, x1, y1, px = 2) {
  const w = x1 - x0, h = y0 - y1, c = document.createElement('canvas');
  c.width = Math.round(w * px); c.height = Math.round(h * px);
  const g = c.getContext('2d');
  g.setTransform(px, 0, 0, -px, -x0 * px, y0 * px);
  return { c, g, x0, y0, x1, y1, w, h, px, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }
function star(g, x, y, r, a = 0.9) {
  g.save(); g.translate(x, y); g.beginPath();
  for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.28 : r, t = (i * Math.PI) / 4; g.lineTo(rr * Math.cos(t), rr * Math.sin(t)); }
  g.closePath(); g.fillStyle = `rgba(255,255,255,${a})`; g.fill(); g.restore();
}
function poly(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); }
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, f = c => Math.round(c + (255 - c) * amt);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function glyph(g, text, x, y, rot, size, fill, stroke) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, -1);
  g.font = `${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = size * 0.17; g.strokeStyle = stroke; g.strokeText(text, 0, size * 0.04);
  g.fillStyle = fill; g.fillText(text, 0, size * 0.04);
  g.lineWidth = size * 0.035; g.strokeStyle = 'rgba(255,255,255,.35)'; g.strokeText(text, 0, size * 0.04);
  g.restore();
}

// ───────────────────────────── wheel print (covers the whole disc, right to the cut edges) ─────────────────────────────
export function drawWheel() {
  const L = layer(-RW, RW, RW, -RW, 3), g = L.g, rand = rng(7);
  const grad = g.createRadialGradient(0, 0, 40, 0, 0, RW);
  grad.addColorStop(0, '#2b52ad'); grad.addColorStop(1, '#1d3c8c');
  g.fillStyle = grad; g.fillRect(-RW, -RW, 2 * RW, 2 * RW);
  g.save(); g.rotate(-28 * D2R);
  for (let j = 0; j < 15; j++) {
    const y0 = -RW + j * 48;
    g.beginPath();
    for (let x = -RW - 40; x <= RW + 40; x += 8) g.lineTo(x, y0 + 18 * Math.sin(x / 70 + j * 1.3) + 8 * Math.sin(x / 23 + j));
    g.lineWidth = 20 + (j % 3) * 6; g.strokeStyle = j % 2 ? 'rgba(70,120,210,.28)' : 'rgba(8,18,60,.35)'; g.stroke();
  }
  g.restore();
  // pinwheel blades between the slots
  for (let s = 0; s < 8; s++) {
    const th = 90 + 45 * s + 22.5;
    const pts = [P(th - 9.5, RW + 4), P(th + 9.5, RW + 4), P(th + 9, 250), P(th - 15, 116), P(th - 28, 116), P(th - 9, 250)];
    poly(g, pts);
    const bg2 = g.createLinearGradient(...P(th, R), ...P(th - 20, 116)); bg2.addColorStop(0, '#16307a'); bg2.addColorStop(1, '#11266a');
    g.fillStyle = bg2; g.fill(); g.lineJoin = 'round'; g.lineWidth = 3; g.strokeStyle = '#dbe3f7'; g.stroke();
  }
  for (let i = 0; i < 46; i++) { const a = rand() * 360, r = 110 + rand() * 200, [x, y] = P(a, r); star(g, x, y, 2 + rand() * 4, 0.55 + rand() * 0.4); }
  // white printed border running along every cut edge (the cut itself is the 3D shape)
  g.lineJoin = 'miter'; g.miterLimit = 8;
  for (let k = 0; k < 8; k++) { poly(g, slotPolygon(k)); g.lineWidth = 22; g.strokeStyle = '#0a1230'; g.stroke(); }
  for (let k = 0; k < 8; k++) { poly(g, slotPolygon(k)); g.lineWidth = 16; g.strokeStyle = '#eef2fb'; g.stroke(); }
  // dark centre disc
  const cg = g.createRadialGradient(-20, 20, 10, 0, 0, CENTER_R);
  cg.addColorStop(0, '#16285e'); cg.addColorStop(1, '#0b1536');
  g.beginPath(); g.arc(0, 0, CENTER_R, 0, Math.PI * 2); g.fillStyle = cg; g.fill(); g.lineWidth = 3; g.strokeStyle = '#3b5196'; g.stroke();
  g.save(); g.beginPath(); g.arc(0, 0, CENTER_R - 2, 0, Math.PI * 2); g.clip(); g.rotate(-20 * D2R);
  for (let j = 0; j < 5; j++) { g.beginPath(); for (let x = -110; x <= 110; x += 6) g.lineTo(x, -90 + j * 42 + 10 * Math.sin(x / 30 + j)); g.lineWidth = 14; g.strokeStyle = 'rgba(60,100,190,.18)'; g.stroke(); }
  g.restore();
  for (let i = 0; i < 16; i++) { const a = rand() * 360, r = rand() * 88, [x, y] = P(a, r); star(g, x, y, 1.5 + rand() * 3, 0.6); }
  for (const [x, y] of [[-8, 42], [-6, 22], [-62, -38], [62, -24]]) { g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fillStyle = '#9aa3b6'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#4a5268'; g.stroke(); }
  // soft shadow where each raised badge sits
  TARGETS.forEach((t, k) => { const [x, y] = P(90 + 45 * k, TARGET_R); g.beginPath(); g.arc(x + 3, y - 4, BADGE_R + 2, 0, Math.PI * 2); g.fillStyle = 'rgba(0,0,0,.28)'; g.fill(); });
  return L;
}

// ───────────────────────────── printed cabinet face around the wheel window ─────────────────────────────
export function drawFace() {
  const p = PANEL_TOP, L = layer(p.x0, p.y0, p.x1, p.y1), g = L.g, rand = rng(11);
  const lit = layer(p.x0, p.y0, p.x1, p.y1), lg = lit.g;
  g.beginPath(); g.roundRect(p.x0 + 2, p.y1, p.x1 - p.x0 - 4, p.y0 - p.y1 - 2, [0, 0, 22, 22]);
  const bg = g.createLinearGradient(0, p.y0, 0, p.y1); bg.addColorStop(0, '#e2e1ee'); bg.addColorStop(1, '#d6d6e5');
  g.fillStyle = bg; g.fill();
  g.save(); g.clip();
  for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(0, 0, R + 44 + i * 72, 0, Math.PI * 2); g.lineWidth = 34; g.strokeStyle = 'rgba(160,164,196,.22)'; g.stroke(); }
  for (let i = 0; i < 40; i++) { const x = p.x0 + rand() * (p.x1 - p.x0), y = p.y1 + rand() * (p.y0 - p.y1); if (Math.hypot(x, y) > R + 22) star(g, x, y, 2.5 + rand() * 4, 0.9); }
  g.restore();
  for (const sx of [-1, 1]) {
    const x = sx * 262, y = 330, rg = g.createRadialGradient(x - 6, y + 6, 2, x, y, 25);
    rg.addColorStop(0, '#ffffff'); rg.addColorStop(1, '#dfe0ec');
    g.beginPath(); g.arc(x, y, 25, 0, Math.PI * 2); g.fillStyle = rg; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(140,142,170,.55)'; g.stroke();
  }
  g.beginPath(); g.arc(0, 0, R + 9, 0, Math.PI * 2); g.lineWidth = 12; g.strokeStyle = '#c7c9da'; g.stroke();
  g.beginPath(); g.arc(0, 0, R + 1, 0, Math.PI * 2); g.lineWidth = 6; g.strokeStyle = '#151c3a'; g.stroke();
  g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, 0, R - 1.5, 0, Math.PI * 2); g.fill(); g.restore();
  lg.fillStyle = '#000'; lg.fillRect(p.x0, p.y1, p.x1 - p.x0, p.y0 - p.y1);
  const tg = lg.createRadialGradient(0, 0, R - 2, 0, 0, R + 50); tg.addColorStop(0, 'rgb(45,18,0)'); tg.addColorStop(1, 'rgb(0,0,0)');
  lg.beginPath(); lg.arc(0, 0, R + 50, 0, Math.PI * 2); lg.fillStyle = tg; lg.fill();
  return { tex: L, lit };
}

// ───────────────────────────── printed board seen through the clear side plates ─────────────────────────────
function bowHalf(g, s) {
  g.beginPath();
  g.moveTo(0, -584);
  g.bezierCurveTo(s * -70, -584, s * -150, -606, s * -205, -648);
  g.bezierCurveTo(s * -232, -668, s * -246, -690, s * -238, -700);
  g.bezierCurveTo(s * -230, -708, s * -214, -700, s * -206, -690);
  g.bezierCurveTo(s * -160, -652, s * -88, -662, 0, -664);
  g.closePath();
}
export function drawBoard() {
  const b = BOARD, L = layer(b.x0, b.y0, b.x1, b.y1), g = L.g, rand = rng(23);
  const lit = layer(b.x0, b.y0, b.x1, b.y1), lg = lit.g;
  const outline = gg => {          // top edge curves under the wheel like the plates
    const xa = Math.sqrt(PLATES.arcR ** 2 - PLATES.top ** 2);
    gg.beginPath(); gg.moveTo(b.x0, b.y1 + 14); gg.lineTo(b.x0, PLATES.top); gg.lineTo(-xa, PLATES.top);
    gg.arc(0, 0, PLATES.arcR, Math.atan2(PLATES.top, -xa), Math.atan2(PLATES.top, xa), false);
    gg.lineTo(b.x1, PLATES.top); gg.lineTo(b.x1, b.y1 + 14); gg.arcTo(b.x1, b.y1, b.x1 - 14, b.y1, 14);
    gg.lineTo(b.x0 + 14, b.y1); gg.arcTo(b.x0, b.y1, b.x0, b.y1 + 14, 14); gg.closePath();
  };
  outline(g); g.fillStyle = '#e3e2ee'; g.fill();
  g.save(); outline(g); g.clip();
  for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(0, 0, 380 + i * 64, 0, Math.PI * 2); g.lineWidth = 30; g.strokeStyle = 'rgba(160,164,196,.24)'; g.stroke(); }
  for (let i = 0; i < 34; i++) { const x = b.x0 + rand() * (b.x1 - b.x0), y = b.y1 + rand() * (PLATES.top - b.y1); if (Math.abs(x) > CHANNEL.half + 6) star(g, x, y, 2.5 + rand() * 4, 0.95); }
  g.fillStyle = 'rgba(236,241,250,.95)'; g.fillRect(-CHANNEL.half, b.y1, CHANNEL.half * 2, b.y0 - b.y1);
  for (const [x, c] of [[-40, '#b5c1d3'], [40, '#b5c1d3'], [-18, '#c3cddb'], [18, '#c3cddb']]) { g.fillStyle = c; g.fillRect(x - 1.5, b.y1, 3, b.y0 - b.y1); }
  g.restore();
  for (const s of [-1, 1]) {
    bowHalf(g, s);
    const bgd = g.createLinearGradient(0, -584, 0, -700); bgd.addColorStop(0, '#b23a3f'); bgd.addColorStop(0.6, '#86232a'); bgd.addColorStop(1, '#5e151b');
    g.fillStyle = bgd; g.fill(); g.lineJoin = 'round'; g.lineWidth = 3.5; g.strokeStyle = '#3f0b10'; g.stroke();
    g.beginPath(); g.arc(s * 240, -702, 12, 0, Math.PI * 2); g.fillStyle = '#7fcdf0'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#2b2d55'; g.stroke();
    g.beginPath(); g.arc(s * 236, -697, 4.5, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,.8)'; g.fill();
  }
  g.beginPath(); g.roundRect(-58, -668, 116, 90, 10);
  const gg = g.createLinearGradient(-58, 0, 58, 0); gg.addColorStop(0, '#e9761a'); gg.addColorStop(0.5, '#ffa23a'); gg.addColorStop(1, '#e9761a');
  g.fillStyle = gg; g.fill(); g.lineWidth = 3; g.strokeStyle = '#8a3a06'; g.stroke();
  for (const y of [-596, -650]) { g.beginPath(); g.moveTo(-56, y); g.lineTo(56, y); g.lineWidth = 2.5; g.strokeStyle = 'rgba(138,58,6,.6)'; g.stroke(); }
  lg.fillStyle = '#000'; lg.fillRect(b.x0, b.y1, b.w, b.h);
  outline(lg); lg.fillStyle = 'rgb(40,0,0)'; lg.fill();
  lg.fillStyle = 'rgb(130,90,0)'; lg.fillRect(-CHANNEL.half, b.y1, CHANNEL.half * 2, b.y0 - b.y1);
  for (const s of [-1, 1]) { bowHalf(lg, s); lg.fillStyle = 'rgb(15,0,0)'; lg.fill(); }
  lg.fillStyle = 'rgb(15,0,0)'; lg.fillRect(-58, -668, 116, 90);
  return { tex: L, lit: blur(lit, 4) };
}

// ───────────────────────────── sticker printed inside the arrow acrylic (straight edges, clear windows) ─────────────────────────────
export function drawArrowSticker() {
  const a = ARROW, L = layer(-a.acrHalf, a.acrTip + 2, a.acrHalf, a.acrBottom - 2, 4), g = L.g;
  g.lineJoin = 'miter';
  const head = [[0, a.tip], [a.headHalf, a.headCorner], [a.headHalf, a.headBar], [-a.headHalf, a.headBar], [-a.headHalf, a.headCorner]];
  const win = [[0, -364], [28, -391.5], [8, -387], [0, -414], [-8, -387], [-28, -391.5]];
  const hg = g.createLinearGradient(0, a.tip, 0, a.headBar); hg.addColorStop(0, '#a4302a'); hg.addColorStop(1, '#6e1a1a');
  poly(g, head); g.fillStyle = hg; g.fill(); g.lineWidth = 3; g.strokeStyle = '#2e0909'; g.stroke();
  g.save(); g.globalCompositeOperation = 'destination-out'; poly(g, win); g.fill(); g.restore();
  poly(g, win); g.lineWidth = 2; g.strokeStyle = 'rgba(255,240,225,.9)'; g.stroke();
  g.lineWidth = 3.5; g.strokeStyle = '#2e0909'; g.strokeRect(-a.shaftHalf, a.shaftEnd, a.shaftHalf * 2, a.headBar - a.shaftEnd);
  g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(-a.shaftHalf + 2, a.shaftEnd + 2, a.shaftHalf * 2 - 4, a.headBar - a.shaftEnd - 4);
  for (const y of [a.headBar - 22, a.headBar - 62]) { g.beginPath(); g.arc(0, y, 4.5, 0, Math.PI * 2); g.fillStyle = '#8d96a8'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#4a5060'; g.stroke(); }
  for (const s of [-1, 1]) {
    const pts = [[s * a.shaftHalf, a.fletchTop], [s * a.fletchOut, a.fletchTop - 32], [s * a.fletchOut, a.fletchBottom], [s * a.shaftHalf, a.fletchBottom + 26]];
    poly(g, pts); g.fillStyle = '#b72e27'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#2e0909'; g.stroke();
    for (let i = 0; i < 3; i++) {
      const y = a.fletchTop - 18 - i * 22; g.beginPath(); g.moveTo(s * (a.shaftHalf + 4), y); g.lineTo(s * (a.fletchOut - 5), y - 28);
      g.lineWidth = 3; g.strokeStyle = '#f5c84a'; g.stroke();
    }
  }
  return L;
}

function blur(L, px) {
  const c = document.createElement('canvas'); c.width = L.c.width; c.height = L.c.height;
  const g = c.getContext('2d'); g.filter = `blur(${px * L.px}px)`; g.drawImage(L.c, 0, 0);
  return { ...L, c };
}

export function buildMachine() {
  return { wheel: drawWheel(), face: drawFace(), board: drawBoard(), sticker: drawArrowSticker(),
    badges: TARGETS.map((t, k) => drawBadge(t, [1, 4, 7].includes(k))),
    arrowGlow: drawEdgeGlow(arrowOutline()), plateGlowL: drawEdgeGlow(plateOutline(-1)), plateGlowR: drawEdgeGlow(plateOutline(1)) };
}

// ───────────────────────────── glow along a cut acrylic edge (edge-lit acrylic shows its cut as a bright line) ─────────────────────────────
export function drawEdgeGlow(points, pad = 16) {
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const L = layer(Math.min(...xs) - pad, Math.max(...ys) + pad, Math.max(...xs) + pad, Math.min(...ys) - pad, 3), g = L.g;
  g.lineJoin = 'miter'; g.miterLimit = 6;
  g.save(); g.filter = `blur(${4 * L.px}px)`; poly(g, points); g.lineWidth = 7; g.strokeStyle = 'rgba(255,255,255,.55)'; g.stroke(); g.restore();
  poly(g, points); g.lineWidth = 2.2; g.strokeStyle = 'rgba(255,255,255,.95)'; g.stroke();
  return L;
}

// ───────────────────────────── one raised target badge (its own disc; glyph upright, top = towards the wheel centre) ─────────────────────────────
export function drawBadge(t, screw) {
  const r = BADGE_R, L = layer(-r, r, r, -r, 4), g = L.g;
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fillStyle = '#eef1f8'; g.fill();
  g.beginPath(); g.arc(0, 0, r - 5, 0, Math.PI * 2); g.fillStyle = '#c9cfdd'; g.fill();
  g.beginPath(); g.arc(0, 0, r - 8, 0, Math.PI * 2); g.fillStyle = t.rim; g.fill();
  const bg = g.createRadialGradient(-12, 14, 4, 0, 0, r - 11);
  bg.addColorStop(0, shade(t.fill, 0.22)); bg.addColorStop(1, t.fill);
  g.beginPath(); g.arc(0, 0, r - 11, 0, Math.PI * 2); g.fillStyle = bg; g.fill();
  g.beginPath(); g.arc(0, 0, r - 17, 0, Math.PI * 2); g.lineWidth = 2.2; g.strokeStyle = 'rgba(255,255,255,.55)'; g.stroke();
  glyph(g, t.label, 0, -2, 0, 66, t.glyph, '#14162c');
  if (screw) { g.beginPath(); g.arc(0, r - 4, 5, 0, Math.PI * 2); g.fillStyle = '#a3abbd'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#4a5268'; g.stroke(); }
  return L;
}
