# Arrow Wheel

A playable 3D model of the arrow-and-wheel prize machine. Everything is drawn in code (no photos or video frames). The sizes, angles, speed, timings and light colours were measured from `IMG_3465.MOV`.

## Play

**Online:** https://samialsubhi.github.io/arrow-wheel-game/

**Offline:** run `npm install && npm run build`, then double-click **`dist/index.html`**. It's a single self-contained file.

| Control | Action |
|---|---|
| **SHOOT** button · Space · click the machine | stop the wheel, then the arrow fires |
| **VIEW** joystick | drag to look from left / right / above / below (it stays put) · tap to straighten · arrow keys / C also work |
| **RESET** button · R | reset the game (scores, wheel, camera) |
| **MUSIC** button · M | music on / off (the music and all sounds are synthesised live, no audio files) |
| H | stats: last target, how far off, where the arrow jammed |

## How it's built

- **Acrylic plane:** the wheel, the arrow and the two clear side plates are 8 mm acrylic in one plane, as real 3D shapes. Their edges glow with the LED colour and their faces reflect the room, so they react to the camera.
- **Behind:** the backlit panel shows through the wheel's slots, and the printed board (bow, arcs, stars) is seen through the clear plates.
- **In front:** the printed cabinet face with the round window.
- **Slot outline:** traced from the video (median of all 8 slots): a pointed roof, flaring sides, and two steps near the rim where the arrowhead's corners sit.
- **Arrow:** the acrylic has stepped edges on its pointed head, with the printed sticker inside it with a small margin.

## How hit / miss works

There's no hit tolerance. After the wheel stops, the arrow is driven upward until its head touches the wheel. The check runs against the exact slot outlines (the same polygons that are cut out of the drawn wheel), to 0.05 units:
- If the head seats down in the slot, it's in: rainbow lights, a fanfare and confetti.
- If it's misaligned, the head jams against the slot's slanted roof, the slot edge or a spoke, stops right there, and the lights go red as on the real machine.

With the traced shapes the arrow goes in when the slot is within about ±1.2° of the arrow, a window of roughly 85 ms at the measured 28.29°/s. About 2° off, the head corners catch on the rim steps and the arrow jams around 74, which matches the miss in the video (79).

## Develop

```bash
npm install
npm run dev      # live dev server
npm run build    # rebuild dist/index.html
```

- `src/game/constants.js`: measurements, geometry, timings, colours, layer depths
- `src/game/geometry.js`: slot and arrowhead shapes, collision test
- `src/game/draw.js`: native drawing of the wheel, cabinet face, lit panel, bow and arrow
- `src/game/logic.js`: stop, arrow drive and light timeline
- `src/game/audio.js`: synthesised music and sound effects
- `src/components/`: React Three Fiber scene and camera, arcade buttons and joystick, confetti
- `.github/workflows/pages.yml`: builds and publishes to GitHub Pages on every push to `main`
