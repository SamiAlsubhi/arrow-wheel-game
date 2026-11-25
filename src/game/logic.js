// Game timing and rules, driven by the timeline measured from the video.
// Hit or miss is decided physically: the arrow is driven up until its head touches the wheel.
import {
  SPIN_DEG_PER_S, STOP_COAST_S, STOP_COAST_SPEED, SPINUP_S, ARROW_SEAT, ARROW_DRIVE_S,
  ARROW_RISE_DELAY, JUDGE_AT, RED_HOLD, ARROW_DOWN_AT, CHASE_S, CHANNEL_HUE_PERIOD,
  HOLE_B_DEG, LABELS, ARROW_ALIGN_DEG, LIME, RED,
} from './constants.js';
import { contactTravel } from './geometry.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export function hsv(h, s = 1, v = 1) {
  h = (((h % 360) + 360) % 360) / 60; const i = Math.floor(h), f = h - i, p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f));
  return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6].map(x => x * 255);
}
// arrow drive: eased start, constant push, stops dead on contact
const drive = s => { const t = clamp(s / ARROW_DRIVE_S, 0, 1); return ARROW_SEAT * (t < 0.25 ? 2 * t * t : t - 0.125) / 0.875; };

export function createGame() {
  const st = {
    phi: -150 + Math.random() * 300,     // wheel rotation (deg, clockwise); 0 = B straight above the arrow
    mode: 'spin', t0: 0, now: 0, stopAt: 0, spinStart: -10, hueClock: 0,
    arrow: 0, contact: ARROW_SEAT, win: false, label: '', offset: 0, plays: 0, wins: 0,
    seatedAt: -1, jamAt: -1, hitId: 0,
  };

  function nearestSlot(phi) {
    let best = null;
    for (let k = 0; k < 8; k++) {
      const diff = (((HOLE_B_DEG + k * 45 + phi - ARROW_ALIGN_DEG) % 360) + 540) % 360 - 180;
      if (!best || Math.abs(diff) < Math.abs(best.diff)) best = { k, diff };
    }
    return best;
  }

  function press() {
    if (st.mode === 'spin' && st.now - st.spinStart > SPINUP_S) { st.mode = 'coast'; st.t0 = st.now; return true; }
    return false;
  }
  function reset() {
    Object.assign(st, { mode: 'spin', spinStart: st.now, arrow: 0, win: false, label: '', offset: 0, plays: 0, wins: 0, seatedAt: -1, jamAt: -1 });
  }

  function update(dt) {
    st.now += dt; st.hueClock += dt;
    const t = st.now;
    if (st.mode === 'spin') {
      st.phi += SPIN_DEG_PER_S * clamp((t - st.spinStart) / SPINUP_S, 0, 1) * dt;
    } else if (st.mode === 'coast') {
      st.phi += SPIN_DEG_PER_S * STOP_COAST_SPEED * dt;
      if (t - st.t0 >= STOP_COAST_S) {
        st.mode = 'stopped'; st.stopAt = t; st.plays++; st.seatedAt = -1; st.jamAt = -1;
        const h = nearestSlot(st.phi); st.offset = h.diff; st.label = LABELS[h.k];
        st.contact = contactTravel(st.phi, ARROW_SEAT);            // real collision against the slot / spoke outlines
        st.win = st.contact >= ARROW_SEAT - 3;                     // head seated down in the slot
        if (st.win) st.wins++;
      }
    } else if (st.mode === 'stopped') {
      const s = t - st.stopAt;
      if (s < ARROW_DOWN_AT) {
        const want = drive(Math.max(0, s - ARROW_RISE_DELAY));
        if (want >= st.contact) {
          if (st.win && st.seatedAt < 0) { st.seatedAt = t; st.hitId++; }
          if (!st.win && st.jamAt < 0) st.jamAt = t;
          const k = st.jamAt > 0 ? t - st.jamAt : 1;                 // tiny recoil when the head jams
          st.arrow = st.contact - (st.win ? 0 : 1.6 * Math.exp(-k * 18) * Math.sin(k * 60));
        } else st.arrow = want;
      } else st.arrow = Math.max(0, st.arrow - dt * 900);
      if (s >= ARROW_DOWN_AT + 0.25 + CHASE_S - 0.03) { st.mode = 'spin'; st.spinStart = t; }
    }
  }

  // light colours for this moment: ring = wheel backlight, channel = arrow-channel LEDs
  function lights() {
    const s = st.mode === 'stopped' ? st.now - st.stopAt : -1;
    let ring = { chase: 0, color: LIME, speed: 0 }, channel = hsv(120 + (360 * st.hueClock) / CHANNEL_HUE_PERIOD);
    if (st.win && st.seatedAt > 0 && s < JUDGE_AT + RED_HOLD) { ring = { chase: 1, speed: 1.6 }; channel = hsv(st.now * 420); }
    else if (s >= JUDGE_AT && s < JUDGE_AT + 0.04) ring = { chase: 0, color: [150, 255, 40] };       // one-frame flash (33.7 s)
    else if (s >= JUDGE_AT + 0.04 && s < JUDGE_AT + RED_HOLD) { ring = { chase: 0, color: RED }; channel = RED; }
    else if (s >= ARROW_DOWN_AT + 0.25 && s < ARROW_DOWN_AT + 0.25 + CHASE_S) ring = { chase: 1, speed: 2.0 };
    return { ring, channel };
  }

  return { st, press, reset, update, lights };
}
