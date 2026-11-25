// Native model of the machine. Units ≈ 1 px of the 1080×1920 video frame ≈ 1 mm.
// World coordinates: origin = wheel centre, x right, y up. Every number here was measured from IMG_3465.MOV.

// ───────────── wheel (acrylic, print goes right to the cut edges) ─────────────
export const R = 325;                 // visible wheel radius (dark rim of the window)
export const RW = R + 6;              // real disc radius, the outer edge hides behind the cabinet face
export const TARGET_R = 190;          // badge centres (measured on the frame overlay)
export const BADGE_R = 59;            // badges are separate raised discs on the wheel's face: they overlap the slot points
export const BADGE_T = 4;             // how far they stick out
export const CENTER_R = 102;

// Slot (cut-out) under each target, traced in polar coordinates over all 8 slots of the frame
// (median of 8, unwarped): [half-angle°, radius]. A shallow point, flaring sides, then two
// steps where the spoke ends flare (they hold the arrowhead's corners when it seats).
export const OPENING = [
  [0, 230], [11, 252],                      // pointed roof
  [16.1, 298.6],                            // straight flaring side
  [15.25, 299.4], [15.2, 309.4],            // first step
  [12.8, 311.2], [12.6, 314],               // second step, then parallel to the rim
];
export const OPENING_RIM_HALF = 12.6; // from r 314 out to the rim the slot keeps this half-angle

export const TARGETS = [            // clockwise from B (B straight above the arrow at rotation 0)
  { label: 'B', fill: '#c9302a', rim: '#7a1512', glyph: '#f7c51c' },
  { label: '3', fill: '#c4195e', rim: '#6b0c33', glyph: '#ffffff' },
  { label: '2', fill: '#5b2d8e', rim: '#2c1352', glyph: '#ffffff' },
  { label: '1', fill: '#22305f', rim: '#0f1634', glyph: '#ffffff' },
  { label: 'A', fill: '#2f78d6', rim: '#163f83', glyph: '#f7c51c' },
  { label: '6', fill: '#9dc43c', rim: '#4c6a12', glyph: '#ffffff' },
  { label: '5', fill: '#ebb823', rim: '#8a6408', glyph: '#ffffff' },
  { label: '4', fill: '#f18b1e', rim: '#8f4a06', glyph: '#ffffff' },
];
export const LABELS = TARGETS.map(t => t.label);
export const HOLE_B_DEG = 90;
export const ARROW_ALIGN_DEG = 90;

// ───────────── arrow (acrylic with a printed sticker inside) ─────────────
export const ARROW = {
  // printed sticker (straight edges)
  tip: -355, headCorner: -406, headBar: -414, headHalf: 61,
  shaftHalf: 15, shaftEnd: -712,
  fletchTop: -586, fletchBottom: -690, fletchOut: 48,
  // acrylic piece around it: stepped head edges from 13 above the printed tip to the printed corners
  acrTip: -342, acrHalf: 61, acrSteps: 9, acrBottom: -724,
};
export const ARROW_TRAVEL = 79;       // tip 1018 → 939 px: where the missed arrow sat in the video
export const ARROW_SEAT = 109.5;      // full stroke: acrylic tip 2.5 short of the slot's point when lined up
export const ARROW_DRIVE_S = 1.10;    // rest → full stroke (rise measured: 79 px in ~0.8 s)

// ───────────── panels ─────────────
export const PANEL_TOP = { x0: -360, y0: 402, x1: 360, y1: -304 };   // printed cabinet face around the window
export const CHANNEL = { half: 64, bottom: -806 };                    // gap between the clear side plates
export const PLATES = { x: 352, top: -304, bottom: -806, arcR: R + 8 }; // clear acrylic side plates
export const BOARD = { x0: -352, y0: -290, x1: 352, y1: -806 };      // printed board behind the clear plates

// ───────────── motion & timing ─────────────
export const SPIN_DEG_PER_S = 28.29;  // mean of 1431 clean frames (0.943°/frame) → 12.73 s / turn, clockwise
export const STOP_COAST_S = 0.18;     // last ~5 frames before every stop at ~0.86× speed, then dead stop
export const STOP_COAST_SPEED = 0.86;
export const SPINUP_S = 0.35;
export const ARROW_RISE_DELAY = 0.35;
export const JUDGE_AT = 5.88;         // lights change 5.9 s after the stop (both recorded cycles)
export const RED_HOLD = 4.45;
export const ARROW_DOWN_AT = 10.15;
export const CHASE_S = 0.55;
export const CHANNEL_HUE_PERIOD = 2.4; // green→cyan→blue→purple→red→orange→yellow→green

// ───────────── light colours (sRGB) ─────────────
export const LIME = [112, 250, 38];
export const RED = [245, 27, 94];

// ───────────── 3D layout ─────────────
export const T = 8;                   // acrylic thickness (wheel, arrow and side plates share one plane)
export const DEPTH = { backlight: -48, board: -26, acrylic: 0, face: T + 1 };
export const VIEW = { cx: 0, cy: -202, w: 720, h: 1212 };
export const CAMERA = { fov: 26, maxYaw: 22, maxPitch: 15 };
