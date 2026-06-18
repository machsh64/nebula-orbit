import { useEffect, useRef } from 'react';
import { ART_DIRECTION } from '../data/artDirection';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface NebulaRibbon {
  y: number;
  height: number;
  colorA: string;
  colorB: string;
  alpha: number;
  drift: number;
  phase: number;
}

const RIBBONS: NebulaRibbon[] = [
  { y: 0.18, height: 0.34, colorA: '#00e5ff', colorB: '#ffd740', alpha: 0.18, drift: 0.00032, phase: 0.4 },
  { y: 0.48, height: 0.42, colorA: '#b388ff', colorB: '#ff4081', alpha: 0.16, drift: -0.00024, phase: 2.1 },
  { y: 0.74, height: 0.28, colorA: '#69f0ae', colorB: '#2979ff', alpha: 0.12, drift: 0.00018, phase: 3.5 },
];

export default function NebulaBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    const drawRibbon = (ribbon: NebulaRibbon, width: number, height: number) => {
      const y = height * ribbon.y;
      const ribbonHeight = height * ribbon.height;
      const drift = reducedMotion ? 0 : Math.sin(time * ribbon.drift + ribbon.phase) * width * 0.08;

      const gradient = ctx.createLinearGradient(0, y - ribbonHeight * 0.5, width, y + ribbonHeight * 0.5);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.22, ribbon.colorA);
      gradient.addColorStop(0.52, ribbon.colorB);
      gradient.addColorStop(0.8, ART_DIRECTION.palette.cyan);
      gradient.addColorStop(1, 'transparent');

      ctx.save();
      ctx.globalAlpha = ribbon.alpha;
      ctx.filter = 'blur(32px)';
      ctx.beginPath();
      ctx.moveTo(-width * 0.1, y + Math.sin(time * 0.001 + ribbon.phase) * 18);
      ctx.bezierCurveTo(
        width * 0.2 + drift,
        y - ribbonHeight * 0.65,
        width * 0.55 - drift,
        y + ribbonHeight * 0.8,
        width * 1.1,
        y - ribbonHeight * 0.2
      );
      ctx.lineTo(width * 1.1, y + ribbonHeight * 0.6);
      ctx.bezierCurveTo(
        width * 0.55 - drift,
        y + ribbonHeight * 1.15,
        width * 0.2 + drift,
        y - ribbonHeight * 0.18,
        -width * 0.1,
        y + ribbonHeight * 0.52
      );
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      time += reducedMotion ? 0.25 : 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(2, 5, 16, 0.72)';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'screen';
      RIBBONS.forEach(ribbon => drawRibbon(ribbon, width, height));

      // Fine grain keeps the canvas feeling tactile without becoming noisy.
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 80; i++) {
        const x = (i * 137.5 + time * 0.12) % width;
        const y = (i * 53.2 + time * 0.08) % height;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 215, 64, 0.025)' : 'rgba(246, 240, 255, 0.018)';
        ctx.fillRect(x, y, 1, 1);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1]"
      style={{ pointerEvents: 'none', mixBlendMode: 'screen' }}
    />
  );
}
