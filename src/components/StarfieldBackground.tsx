import { useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Star {
  x: number;
  y: number;
  radius: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  depth: number; // 0-1, 0=near 1=far
  color: string;
}

export default function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const reducedMotion = useReducedMotion();

  const initStars = useCallback((width: number, height: number) => {
    const stars: Star[] = [];
    const count = 800;
    for (let i = 0; i < count; i++) {
      const depth = Math.random();
      const colors = ['#ffffff', '#aaccff', '#ffccff', '#ccffff', '#ffffcc'];
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.3,
        brightness: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        depth,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    starsRef.current = stars;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener('mousemove', handleMouse);

    let time = 0;
    const animate = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x * (reducedMotion ? 0 : 15);
      const my = mouseRef.current.y * (reducedMotion ? 0 : 15);

      for (const star of starsRef.current) {
        // Parallax shift based on depth (closer stars move more)
        const parallaxX = mx * (1 - star.depth);
        const parallaxY = my * (1 - star.depth);

        let sx = star.x + parallaxX;
        let sy = star.y + parallaxY;

        // Wrap around edges
        if (sx < -10) sx += canvas.width + 20;
        if (sx > canvas.width + 10) sx -= canvas.width + 20;
        if (sy < -10) sy += canvas.height + 20;
        if (sy > canvas.height + 10) sy -= canvas.height + 20;

        // Twinkle
        const twinkle =
          reducedMotion
            ? star.brightness
            : star.brightness * (0.6 + 0.4 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset));

        ctx.beginPath();
        ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = twinkle;
        ctx.fill();

        // Glow for brighter/larger stars
        if (star.radius > 1.2 && twinkle > 0.7) {
          ctx.beginPath();
          ctx.arc(sx, sy, star.radius * 3, 0, Math.PI * 2);
          const glow = ctx.createRadialGradient(sx, sy, star.radius * 0.5, sx, sy, star.radius * 3);
          glow.addColorStop(0, star.color);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.globalAlpha = twinkle * 0.3;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initStars, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ pointerEvents: 'none' }}
    />
  );
}
