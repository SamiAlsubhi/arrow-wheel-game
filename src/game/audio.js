// All sound is synthesised live with the Web Audio API — no audio files.
let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
let musicOn = true, musicTimer = 0, nextNote = 0, step = 0;

function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = 0.22; musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
// only one copy of the game makes sound: the tab you last played in; hidden tabs go quiet
const tabId = Math.random().toString(36).slice(2);
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('arrow-wheel-audio') : null;
let owner = false;
function quiet() { owner = false; if (ctx) { stopMusic(); ctx.suspend(); } }
if (channel) channel.onmessage = e => { if (e.data !== tabId) quiet(); };
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) { stopMusic(); ctx.suspend(); }
  else if (owner) { ctx.resume(); if (musicOn && !musicTimer) startMusic(); }
});

// browsers only allow sound after a click / key press
export function unlock() {
  init();
  if (!owner) { owner = true; channel?.postMessage(tabId); }
  if (ctx.state === 'suspended') ctx.resume();
  if (musicOn && !musicTimer) startMusic();
}

function tone(type, freq, t, dur, gain, bus = sfxBus, freqEnd) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
}
function noise(t, dur, gain, filterType = 'highpass', f0 = 6000, f1, bus = sfxBus) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = filterType; f.frequency.setValueAtTime(f0, t);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t + dur + 0.02);
}

// ───────── music: bouncy arcade loop (C – G – Am – F), 128 bpm ─────────
const BPM = 128, S16 = 60 / BPM / 4;
const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
const CHORDS = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
const BASS = [36, 43, 45, 41];
const LEAD = [72, -1, 76, 79, -1, 76, 74, -1, 72, 74, 76, -1, 79, -1, 81, 79,
              74, -1, 79, 83, -1, 79, 77, -1, 74, 76, 77, -1, 79, -1, 74, -1,
              76, -1, 81, 84, -1, 81, 79, -1, 76, 77, 79, -1, 81, -1, 79, 76,
              77, -1, 81, 84, -1, 81, 79, 77, 76, -1, 74, -1, 72, -1, -1, -1];
function scheduleStep(i, t) {
  const bar = Math.floor(i / 16) % 4, s = i % 16, ch = CHORDS[bar];
  if (s % 4 === 0) { tone('sine', 160, t, 0.18, 0.55, musicBus, 45); }                       // kick
  if (s % 4 === 2) noise(t, 0.05, 0.18, 'highpass', 7000, null, musicBus);                     // hat
  if (s === 4 || s === 12) noise(t, 0.14, 0.25, 'bandpass', 1800, 900, musicBus);              // snare
  if (s % 2 === 0) tone('triangle', mtof(BASS[bar] + (s % 8 === 6 ? 12 : 0)), t, S16 * 1.8, 0.35, musicBus);
  tone('square', mtof(ch[s % 3] + 12), t, S16 * 0.8, 0.05, musicBus);                          // arpeggio
  const n = LEAD[(i % 64)];
  if (n > 0) { tone('square', mtof(n), t, S16 * 1.7, 0.07, musicBus); tone('triangle', mtof(n + 12), t, S16 * 1.2, 0.03, musicBus); }
}
function startMusic() {
  nextNote = ctx.currentTime + 0.1;
  musicTimer = setInterval(() => {
    while (nextNote < ctx.currentTime + 0.25) { scheduleStep(step++, nextNote); nextNote += S16; }
  }, 50);
}
function stopMusic() { clearInterval(musicTimer); musicTimer = 0; }
export function setMusic(on) { musicOn = on; if (!ctx) return; if (on && !musicTimer) startMusic(); if (!on) stopMusic(); }
export const isMusicOn = () => musicOn;

// ───────── sound effects ─────────
const now = () => (ctx ? ctx.currentTime : 0);
export const sfx = {
  tick() { if (!ctx) return; const t = now(); tone('square', 2400, t, 0.018, 0.08); },
  stop() { if (!ctx) return; const t = now(); tone('sine', 140, t, 0.22, 0.7, sfxBus, 50); noise(t, 0.08, 0.3, 'lowpass', 900); },
  fire() { if (!ctx) return; const t = now(); noise(t, 0.7, 0.35, 'bandpass', 400, 3200); tone('sawtooth', 180, t, 0.6, 0.06, sfxBus, 700); },
  jam() { if (!ctx) return; const t = now(); tone('sine', 110, t, 0.3, 0.8, sfxBus, 40); noise(t, 0.12, 0.45, 'lowpass', 1500); tone('square', 70, t, 0.12, 0.12); },
  miss() { if (!ctx) return; const t = now(); for (let i = 0; i < 2; i++) { tone('sawtooth', 220, t + i * 0.32, 0.26, 0.16, sfxBus, 160); tone('square', 110, t + i * 0.32, 0.26, 0.1); } },
  win() {
    if (!ctx) return; const t = now();
    [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => { tone('square', mtof(n), t + i * 0.09, 0.22, 0.12); tone('triangle', mtof(n - 12), t + i * 0.09, 0.22, 0.12); });
    for (let i = 0; i < 14; i++) tone('sine', 1800 + Math.random() * 2200, t + 0.6 + i * 0.05, 0.12, 0.05);
  },
  button() { if (!ctx) return; const t = now(); tone('square', 660, t, 0.05, 0.08, sfxBus, 990); },
};
