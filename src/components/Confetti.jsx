import { useEffect, useRef } from 'react';

const COLORS = ['#ff3b5c', '#ffd23f', '#3bd4ff', '#7cff4f', '#b45cff', '#ff8a1f', '#ffffff'];

// Full-screen confetti burst. Call the returned fire() via the `fireRef`.
export default function Confetti({ fireRef }) {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current, g = c.getContext('2d');
    let parts = [], raf = 0, last = 0;
    const resize = () => { c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; };
    resize(); addEventListener('resize', resize);
    const tick = ts => {
      const dt = Math.min(0.033, (ts - (last || ts)) / 1000); last = ts;
      g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      g.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter(p => p.y < innerHeight + 40 && p.life > 0);
      for (const p of parts) {
        p.vy += 900 * dt; p.vx *= 1 - 0.9 * dt; p.vy *= 1 - 0.6 * dt;
        p.x += (p.vx + Math.sin(p.wob += dt * p.ws) * 40) * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt; p.life -= dt;
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, Math.cos(p.rot * 1.7));
        g.globalAlpha = Math.min(1, p.life * 1.5); g.fillStyle = p.color;
        if (p.shape) g.fillRect(-p.s, -p.s * 0.45, p.s * 2, p.s * 0.9); else { g.beginPath(); g.arc(0, 0, p.s * 0.7, 0, Math.PI * 2); g.fill(); }
        g.restore();
      }
      raf = parts.length ? requestAnimationFrame(tick) : 0;
      if (!raf) { last = 0; g.clearRect(0, 0, innerWidth, innerHeight); }
    };
    fireRef.current = (x = innerWidth / 2, y = innerHeight * 0.35) => {
      for (let i = 0; i < 260; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3, v = 450 + Math.random() * 850;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: 4 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
          wob: Math.random() * 6, ws: 3 + Math.random() * 5, life: 3 + Math.random() * 1.5, shape: Math.random() < 0.7, color: COLORS[(Math.random() * COLORS.length) | 0] });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
  }, [fireRef]);
  return <canvas ref={ref} className="confetti" />;
}
