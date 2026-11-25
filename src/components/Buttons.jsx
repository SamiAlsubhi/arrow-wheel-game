import { useEffect, useRef, useState } from 'react';
import { cam, setCam } from '../game/camera.js';

// Chunky arcade push button.
function ArcadeButton({ color, size = 76, label, sub, onPress, glow, lit = true }) {
  const [down, setDown] = useState(false);
  return (
    <div className="abtn-wrap">
      <button
        className={'abtn' + (down ? ' down' : '') + (glow ? ' glow' : '') + (lit ? '' : ' off')}
        style={{ '--c': color, '--s': `${size}px` }}
        onPointerDown={e => { e.stopPropagation(); setDown(true); onPress(); }}
        onPointerUp={() => setDown(false)}
        onPointerLeave={() => setDown(false)}
        aria-label={label}
      >
        <span className="cap"><span className="shine" /></span>
      </button>
      <div className="abtn-label">{label}{sub && <small>{sub}</small>}</div>
    </div>
  );
}

// Arcade joystick: drag to tilt the camera (it stays where you leave it), tap to straighten it.
function Joystick({ onTap }) {
  const baseRef = useRef(), drag = useRef(null);
  const [pos, setPos] = useState({ x: cam.tx, y: cam.ty });
  const [active, setActive] = useState(false);
  const MAX = 26;
  useEffect(() => { const fn = (x, y) => setPos({ x, y }); cam.listeners.add(fn); return () => cam.listeners.delete(fn); }, []);
  const move = e => {
    const r = baseRef.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y) > 4) drag.current.moved = true;
    if (drag.current.moved) setCam(dx / MAX, -dy / MAX);
  };
  const ball = { x: pos.x * MAX, y: -pos.y * MAX };
  return (
    <div className="abtn-wrap">
      <div
        ref={baseRef}
        className={'joy' + (active ? ' active' : '')}
        onPointerDown={e => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false }; setActive(true); }}
        onPointerMove={e => drag.current && move(e)}
        onPointerUp={() => { const d = drag.current; drag.current = null; setActive(false); if (d && !d.moved && performance.now() - d.t < 350) onTap(); }}
        onPointerCancel={() => { drag.current = null; setActive(false); }}
        title="Drag to change the view · tap to straighten"
      >
        <div className="joy-shaft" style={{ width: Math.hypot(ball.x, ball.y) + 6, transform: `rotate(${Math.atan2(ball.y, ball.x)}rad)` }} />
        <div className="joy-ball" style={{ transform: `translate(${ball.x}px, ${ball.y}px)` }}><span className="shine" /></div>
      </div>
      <div className="abtn-label">VIEW<small>DRAG · TAP</small></div>
    </div>
  );
}

export default function Buttons({ onShoot, onReset, onView, onMusic, musicOn, ready }) {
  return (
    <div className="buttons" onPointerDown={e => e.stopPropagation()}>
      <ArcadeButton color="#ffd23f" size={58} label="RESET" sub="R" onPress={onReset} />
      <ArcadeButton color="#ff2d55" size={92} label="SHOOT" sub="SPACE" onPress={onShoot} glow={ready} />
      <Joystick onTap={onView} />
      <button
        className={'music-mini' + (musicOn ? '' : ' off')}
        onPointerDown={e => { e.stopPropagation(); onMusic(); }}
        title={musicOn ? 'Music on (M)' : 'Music off (M)'}
        aria-label="Music"
      >
        <span>{musicOn ? '♪' : '♪̸'}</span>
      </button>
    </div>
  );
}
