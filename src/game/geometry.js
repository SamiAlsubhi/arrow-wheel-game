// Exact outlines shared by the drawing, the 3D acrylic pieces and the collision test.
import { R, RW, SLOT, ARROW, PLATES, CHANNEL } from './constants.js';

const D2R = Math.PI / 180;
// screen angle θ (clockwise from +x, as seen) + radius → world point (y up)
export const P = (deg, r) => [r * Math.cos(-deg * D2R), r * Math.sin(-deg * D2R)];

// point on slot k's own axes: t along the axis (outwards), h across it (+h = screen-clockwise side)
export function slotPt(deg, h, t) { const [ax, ay] = P(deg, 1), [nx, ny] = P(deg + 90, 1); return [ax * t + nx * h, ay * t + ny * h]; }
const RIM_T = r => Math.sqrt(r * r - SLOT.gateH * SLOT.gateH);
// one slot, from the rim on its anticlockwise side, in to the (hidden) point, back out
function slotProfile(deg, rOut) {
  const S = SLOT, tOut = RIM_T(rOut);
  const side = [[S.gateH, tOut], [S.gateH, S.gateT], [S.shoulderH, S.shoulderT], [S.roofH, S.roofT]];
  return [...side.map(([h, t]) => slotPt(deg, -h, t)), slotPt(deg, 0, S.apexT), ...side.reverse().map(([h, t]) => slotPt(deg, h, t))];
}
export const SLOT_RIM_HALF_DEG = Math.asin(SLOT.gateH / RW) * 180 / Math.PI;
// closed slot polygon (extends past the rim) for collision and printing
export function slotPolygon(k, phi = 0) { return slotProfile(90 + 45 * k + phi, RW + 30); }

// outline of the acrylic wheel (rotation 0): the disc edge with the 8 slots cut in from the rim
export function wheelOutline() {
  const pts = [];
  for (let k = 0; k < 8; k++) {
    const deg = 90 + 45 * k;
    pts.push(...slotProfile(deg, RW));
    for (let a = deg + SLOT_RIM_HALF_DEG + 1; a < deg + 45 - SLOT_RIM_HALF_DEG; a += 1) pts.push(P(a, RW));
  }
  return pts;   // screen-clockwise = world clockwise
}

// acrylic arrow outline at rest: stepped head, straight sides
export function arrowOutline() {
  const a = ARROW, n = a.acrSteps, h = a.headCorner - a.acrTip, pts = [];
  const right = [];
  for (let i = 1; i <= n; i++) {
    const x = (a.acrHalf * i) / n, yPrev = a.acrTip + (h * (i - 1)) / n, y = a.acrTip + (h * i) / n;
    right.push([x, yPrev], [x, y]);
  }
  pts.push([0, a.acrTip], ...right, [a.acrHalf, a.acrBottom + 6], [a.acrHalf - 6, a.acrBottom],
    [-a.acrHalf + 6, a.acrBottom], [-a.acrHalf, a.acrBottom + 6], ...right.map(([x, y]) => [-x, y]).reverse());
  return pts;
}

// clear side plates (left one; mirror for the right): top edge curves around the wheel
export function plateOutline(side) {
  const s = side, x0 = s * (CHANNEL.half + 2), x1 = s * PLATES.x, pts = [];
  const xa = Math.sqrt(PLATES.arcR ** 2 - PLATES.top ** 2);
  pts.push([x1, PLATES.bottom + 12], [x1, PLATES.top]);
  if (Math.abs(x0) < xa) {
    pts.push([s * xa, PLATES.top]);
    for (let x = s * xa; Math.abs(x) > Math.abs(x0); x -= s * 4) pts.push([x, -Math.sqrt(PLATES.arcR ** 2 - x * x)]);
    pts.push([x0, -Math.sqrt(PLATES.arcR ** 2 - x0 * x0)]);
  }
  pts.push([x0, PLATES.bottom], [x1 - s * 12, PLATES.bottom]);
  return s > 0 ? pts : pts;
}

function inside(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// the acrylic outline above the bottom of the head, sampled densely (this is what can hit the wheel)
const HEAD_SAMPLES = (() => {
  const o = arrowOutline().filter(([, y]) => y >= ARROW.headCorner - 160), pts = [];
  for (let i = 0; i < o.length - 1; i++) {
    const [x1, y1] = o[i], [x2, y2] = o[i + 1], len = Math.hypot(x2 - x1, y2 - y1);
    for (let t = 0; t <= len; t += 0.4) pts.push([x1 + ((x2 - x1) * t) / len, y1 + ((y2 - y1) * t) / len]);
  }
  return pts;
})();

export function touches(phi, d) {
  const polys = []; for (let k = 0; k < 8; k++) polys.push(slotPolygon(k, phi));
  for (const [x, y0] of HEAD_SAMPLES) {
    const y = y0 + d;
    if (x * x + y * y >= RW * RW) continue;           // not over the wheel
    let free = false;
    for (const p of polys) if (inside(p, x, y)) { free = true; break; }
    if (!free) return true;
  }
  return false;
}
// how far the arrow can rise (up to maxD) before the acrylic touches the wheel, to 0.05 units
export function contactTravel(phi, maxD) {
  for (let d = 0; d <= maxD; d += 1) if (touches(phi, d)) {
    let lo = Math.max(0, d - 1), hi = d;
    while (hi - lo > 0.05) { const m = (lo + hi) / 2; if (touches(phi, m)) hi = m; else lo = m; }
    return lo;
  }
  return maxD;
}
export { R };
