// Native model of the machine. Units ≈ 1 px of the 1080×1920 video frame ≈ 1 mm.
// World coordinates: origin = wheel centre, x right, y up. Every number here was measured from IMG_3465.MOV.

// ───────────── wheel (acrylic, print goes right to the cut edges) ─────────────
export const R = 325;                 // visible wheel radius (dark rim of the window)
export const RW = R + 6;              // real disc radius, the outer edge hides behind the cabinet face
export const TARGET_R = 188;          // badge centres (measured on the unwarped frame)
export const BADGE_R = 63;            // badges are separate raised discs on the wheel's face: they overlap the slot points
export const BADGE_T = 4;             // how far they stick out
export const CENTER_R = 102;

// Slot (cut-out) under each target. Measured on B's slot — the one in the same part of the video frame as
// the arrow, so both are measured with the same camera perspective (base-frame px ÷ 0.974 for the camera's
// horizontal squash). t = distance from the wheel centre along the slot axis, h = half-width:
//  - roof: straight lines (t 276 → ±67, t 288 → ±80) meeting under the badge, so the point is hidden
//  - shoulder: widest part, ±81 around t 290–296
//  - hammer-head: the spoke ends flare in to the ±69.3 gate at t 306, then straight out to the rim
// The arrow's acrylic head is ±65 (63.5 px), so the gate leaves ~4 per side: about ±0.75° of wheel rotation.
// In the video a stop 0.9° off missed, which this reproduces.
export const SLOT = { apexT: 211, roofT: 290, roofH: 81, shoulderT: 296, shoulderH: 81, gateT: 306, gateH: 69.3 };

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
  tip: -355, headCorner: -406, headBar: -414, headHalf: 62.7,   // printed head: 405–528 px wide
  shaftHalf: 15, shaftEnd: -712,
  fletchTop: -586, fletchBottom: -690, fletchOut: 48,
  // acrylic piece around it: stepped head edges from 13 above the printed tip to the printed corners
  acrTip: -342, acrHalf: 65, acrSteps: 9, acrBottom: -724,      // acrylic: 403–530 px wide (outermost steps)
};
export const ARROW_TRAVEL = 79;       // tip 1018 → 939 px: where the missed arrow sat in the video
export const ARROW_SEAT = 150;        // full stroke if nothing stops it (a lined-up head slides up into the roof's V)
export const ARROW_WIN_AT = 120;      // past the rim gate and seated in the V = in
export const ARROW_DRIVE_S = 1.50;    // rest → full stroke (rise speed measured: 79 px in ~0.8 s)

// ───────────── panels ─────────────
export const PANEL_TOP = { x0: -360, y0: 402, x1: 360, y1: -304 };   // printed cabinet face around the window
export const CHANNEL = { half: 68, bottom: -806 };                    // gap between the clear side plates
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
