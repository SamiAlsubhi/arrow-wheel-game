import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { buildMachine } from './game/draw.js';
import { createGame } from './game/logic.js';
import { CAMERA, VIEW, JUDGE_AT, ARROW_RISE_DELAY } from './game/constants.js';
import { cam, setCam } from './game/camera.js';
import { unlock, setMusic, isMusicOn, sfx } from './game/audio.js';
import Machine, { CameraRig } from './components/Machine.jsx';
import Buttons from './components/Buttons.jsx';
import Confetti from './components/Confetti.jsx';

// test hook: lets the game be stepped by hand when the page is in a background tab
function TestHook({ game }) {
  const { advance } = useThree();
  useEffect(() => {
    window.__game = game; window.__setCam = setCam;
    window.__step = sec => {
      window.__manual = true;
      for (let i = 0; i < Math.round(sec * 60); i++) game.update(1 / 60);
      advance(performance.now());
      return game.st.mode;
    };
  }, [game, advance]);
  return null;
}

export default function App() {
  const parts = useMemo(() => buildMachine(), []);
  const game = useMemo(() => createGame(), []);
  const stageRef = useRef(), fireRef = useRef(() => {});
  const [hudHidden, setHudHidden] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState('');
  const [ready, setReady] = useState(true);
  const [musicOn, setMusicOn] = useState(isMusicOn());

  const shoot = () => { unlock(); setHudHidden(true); game.press(); };
  const resetGame = () => { unlock(); sfx.button(); game.reset(); setCam(0, 0); };
  const resetView = () => { unlock(); sfx.button(); setCam(0, 0); };
  const toggleMusic = () => { unlock(); const on = !isMusicOn(); setMusic(on); setMusicOn(on); sfx.button(); };

  useEffect(() => {
    const onKey = e => {
      unlock();
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); shoot(); }
      else if (e.key === 'h' || e.key === 'H') setShowStats(s => !s);
      else if (e.key === 'r' || e.key === 'R') resetGame();
      else if (e.key === 'c' || e.key === 'C') resetView();
      else if (e.key === 'm' || e.key === 'M') toggleMusic();
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = 0.15;
        setCam(cam.tx + (e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0),
               cam.ty + (e.key === 'ArrowDown' ? -step : e.key === 'ArrowUp' ? step : 0));
      }
    };
    addEventListener('keydown', onKey);
    addEventListener('pointerdown', unlock);
    window.__press = shoot;
    return () => { removeEventListener('keydown', onKey); removeEventListener('pointerdown', unlock); };
  }, []);

  // watch the game for sounds, confetti and the SHOOT button glow
  useEffect(() => {
    let raf, prev = { mode: game.st.mode, hitId: game.st.hitId, jamAt: -1, slot: Math.floor(game.st.phi / 22.5), fired: false, judged: false };
    const loop = () => {
      const s = game.st;
      if (s.mode === 'spin' || s.mode === 'coast') {
        const slot = Math.floor(s.phi / 22.5);
        if (slot !== prev.slot) { sfx.tick(); prev.slot = slot; }
      }
      if (s.mode === 'stopped' && prev.mode !== 'stopped') { sfx.stop(); prev.fired = false; prev.judged = false; }
      if (s.mode === 'stopped') {
        const t = s.now - s.stopAt;
        if (!prev.fired && t >= ARROW_RISE_DELAY) { sfx.fire(); prev.fired = true; }
        if (!s.win && !prev.judged && t >= JUDGE_AT) { sfx.miss(); prev.judged = true; }
      }
      if (s.jamAt > 0 && s.jamAt !== prev.jamAt) { sfx.jam(); prev.jamAt = s.jamAt; }
      if (s.hitId !== prev.hitId) {
        prev.hitId = s.hitId; sfx.win();
        const r = stageRef.current.getBoundingClientRect();
        fireRef.current(r.left + r.width / 2, r.top + r.height * (0.5 - (0 - VIEW.cy) / VIEW.h));
      }
      prev.mode = s.mode;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const id = setInterval(() => {
      const s = game.st;
      setReady(s.mode === 'spin');
      if (showStats) setStats(`plays ${s.plays} · wins ${s.wins}\nlast: ${s.plays ? `${s.label} ${s.offset >= 0 ? '+' : ''}${s.offset.toFixed(2)}° ${s.win ? 'IN THE SLOT' : `jammed at ${s.contact.toFixed(1)}`}` : '-'}`);
    }, 80);
    return () => { cancelAnimationFrame(raf); clearInterval(id); };
  }, [game, showStats]);

  return (
    <>
      <div className="bg" />
      <div className="stage" ref={stageRef} onPointerDown={shoot}>
        <Canvas flat dpr={[1, 2]} gl={{ antialias: true, alpha: true }} camera={{ fov: CAMERA.fov, position: [0, 0, 5000], near: 100, far: 20000 }}>
          <CameraRig />
          <Machine parts={parts} game={game} />
          <TestHook game={game} />
        </Canvas>
      </div>
      <Buttons onShoot={shoot} onReset={resetGame} onView={resetView} onMusic={toggleMusic} musicOn={musicOn} ready={ready} />
      <Confetti fireRef={fireRef} />
      <div className={'hud' + (hudHidden ? ' hide' : '')}>
        Hit <b>SHOOT</b> (or Space) to stop the wheel · line a target up with the arrow · drag the <b>VIEW</b> joystick to look around
      </div>
      {showStats && <div className="stats">{stats}</div>}
    </>
  );
}
