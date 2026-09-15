import { useEffect, useRef } from 'react';
import type { Phase } from '../shared/protocol';

export function Presence({ phase, visitors }: { phase: Phase; visitors: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const params = useRef({ phase, visitors });
  params.current = { phase, visitors };
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    let frame = 0;
    let width = 500;
    let height = 500;
    let running = true;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = media.matches;
    const points = Array.from({ length: 780 }, (_, i) => {
      const y = 1 - (i / 779) * 2;
      const r = Math.sqrt(1 - y * y);
      const angle = i * Math.PI * (3 - Math.sqrt(5));
      return { x: Math.cos(angle) * r, y, z: Math.sin(angle) * r, seed: i };
    });
    const resize = () => {
      const box = el.getBoundingClientRect(); width = box.width; height = box.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.floor(width * dpr); el.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    function draw(time: number) {
      if (!ctx || !running) return;
      const t = reduced ? 3 : time / 1000;
      const alive = params.current.phase === 'thinking' ? 1 : params.current.phase === 'resting' ? 0.72 : 0.36;
      const radius = Math.min(width, height) * (0.285 + (reduced ? 0 : 0.009 * Math.sin(t * 0.8)));
      const cx = width / 2, cy = height / 2;
      ctx.clearRect(0, 0, width, height);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.6);
      glow.addColorStop(0, `rgba(192,211,142,${0.06 + alive * 0.075})`);
      glow.addColorStop(0.55, 'rgba(166,184,117,0.025)'); glow.addColorStop(1, 'rgba(166,184,117,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
      for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath(); ctx.ellipse(cx, cy, radius * (1.31 + ring * 0.14), radius * (1.31 + ring * 0.14), 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(206,220,165,${0.07 - ring * 0.017})`; ctx.lineWidth = 0.6; ctx.stroke();
      }
      const rot = t * 0.065;
      const projected = points.map(p => {
        const x = p.x * Math.cos(rot) + p.z * Math.sin(rot);
        const z = -p.x * Math.sin(rot) + p.z * Math.cos(rot);
        const ripple = 1 + 0.048 * Math.sin(p.y * 7 + t * 0.6) + 0.035 * Math.cos(x * 8 - t * 0.35);
        return { x: cx + x * radius * ripple, y: cy + p.y * radius * ripple, z, seed: p.seed };
      }).sort((a, b) => a.z - b.z);
      for (const p of projected) {
        const depth = (p.z + 1) / 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, 0.65 + depth * 0.95, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(214,230,173,${(0.10 + depth * 0.67) * (0.45 + alive * 0.55)})`; ctx.fill();
      }
      const n = Math.min(12, Math.max(0, params.current.visitors));
      for (let i = 0; i < n; i++) {
        const a = i * Math.PI * 2 / Math.max(n, 3) - Math.PI / 2 + t * 0.025;
        const x = cx + Math.cos(a) * radius * 1.46, y = cy + Math.sin(a) * radius * 1.46;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fillStyle = '#c6d79a'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(198,215,154,0.20)'; ctx.stroke();
      }
      if (!reduced && !document.hidden) frame = requestAnimationFrame(draw);
    }
    const restart = () => { cancelAnimationFrame(frame); if (!document.hidden) frame = requestAnimationFrame(draw); };
    const motion = () => { reduced = media.matches; restart(); };
    media.addEventListener('change', motion); document.addEventListener('visibilitychange', restart);
    frame = requestAnimationFrame(draw);
    return () => { running = false; cancelAnimationFrame(frame); observer.disconnect(); media.removeEventListener('change', motion); document.removeEventListener('visibilitychange', restart); };
  }, []);
  return <canvas ref={canvas} className="presence-canvas" role="img" aria-label={`A softly moving sphere of points. ${visitors} ${visitors === 1 ? 'person is' : 'people are'} in the room.`} />;
}
