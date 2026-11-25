// Shared camera target, written by the pad / keyboard, read every frame by the camera rig.
// x: -1 (look from the left) … 1 (from the right); y: -1 (from below) … 1 (from above)
export const cam = { tx: 0, ty: 0, x: 0, y: 0, listeners: new Set() };

export function setCam(x, y) {
  const r = Math.hypot(x, y);
  if (r > 1) { x /= r; y /= r; }
  cam.tx = x; cam.ty = y;
  cam.listeners.forEach(fn => fn(x, y));
}
