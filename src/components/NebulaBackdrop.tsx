import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface NebulaBlob {
  x: number;
  y: number;
  radius: number;
  color1: string;
  color2: string;
  alpha: number;
  speedX: number;
  speedY: number;
}

export default function NebulaBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobsRef = useRef<NebulaBlob[]>([]);
  const animRef = useRef<number>(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initBlobs();
    };

    const initBlobs = () => {
      const w = canvas.width;
      const h = canvas.height;
      blobsRef.current = [
        {
          x: w * 0.25, y: h * 0.3, radius: Math.min(w, h) * 0.35,
          color1: '#1a1040', color2: '#0a0e27',
          alpha: 0.4, speedX: 0.1, speedY: -0.05,
        },
        {
          x: w * 0.7, y: h * 0.6, radius: Math.min(w, h) * 0.4,
          color1: '#2d1b69', color2: '#020510',
          alpha: 0.35, speedX: -0.08, speedY: 0.06,
        },
        {
          x: w * 0.5, y: h * 0.2, radius: Math.min(w, h) * 0.3,
          color1: '#0d1b3e', color2: '#1a1040',
          alpha: 0.3, speedX: 0.05, speedY: 0.08,
        },
        {
          x: w * 0.15, y: h * 0.7, radius: Math.min(w, h) * 0.25,
          color1: '#311b92', color2: '#0a0e27',
          alpha: 0.25, speedX: 0.07, speedY: -0.04,
        },
        {
          x: w * 0.85, y: h * 0.25, radius: Math.min(w, h) * 0.28,
          color1: '#1a1040', color2: '#2d1b69',
          alpha: 0.3, speedX: -0.06, speedY: -0.07,
        },
      ];
    };

    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    const animate = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const blob of blobsRef.current) {
        if (!reducedMotion) {
          blob.x += Math.sin(time * 0.001 + blob.speedX) * 0.3;
          blob.y += Math.cos(time * 0.001 + blob.speedY) * 0.3;
        }

        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.radius
        );
        gradient.addColorStop(0, blob.color1);
        gradient.addColorStop(0.5, blob.color1);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = blob.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      // Add subtle noise grain overlay
      if (time % 3 === 0) {
        ctx.fillStyle = 'rgba(2, 5, 16, 0.02)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
