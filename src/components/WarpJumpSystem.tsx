import { useEffect, useRef } from 'react';
import { PlanetData } from '../data/types';
import { PLANETS } from '../data/planets';
import gsap from 'gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface WarpJumpSystemProps {
  active: boolean;
  currentPlanet: PlanetData | null;
  onComplete: (targetPlanet: PlanetData) => void;
}

// Pre-computed stable streaks
const STREAKS = Array.from({ length: 40 }).map((_, i) => ({
  left: 5 + Math.random() * 90,
  top: Math.random() * 100,
  color: i % 3 === 0 ? '#b388ff' : '#00e5ff',
}));

// Pre-computed stable particles
const PARTICLES = Array.from({ length: 50 }).map(() => ({
  tx: (Math.random() - 0.5) * 600,
  ty: (Math.random() - 0.5) * 600,
  delay: Math.random() * 0.3,
  color: Math.random() > 0.5 ? '#00e5ff' : '#b388ff',
  duration: 0.5 + Math.random() * 0.5,
}));

export default function WarpJumpSystem({ active, currentPlanet, onComplete }: WarpJumpSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active || !currentPlanet) return;
    if (reducedMotion) {
      const others = PLANETS.filter(p => p.id !== currentPlanet.id);
      const target = others[Math.floor(Math.random() * others.length)];
      onComplete(target);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const others = PLANETS.filter(p => p.id !== currentPlanet.id);
    const target = others[Math.floor(Math.random() * others.length)];

    gsap.set(container, { opacity: 1 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(container, { opacity: 0, duration: 0.5 });
        onComplete(target);
      },
    });

    tl.to(container, { scaleY: 0.3, scaleX: 1.2, duration: 0.25, ease: 'power3.in' });

    const streaks = container.querySelectorAll('.warp-streak');
    tl.to(streaks, { scaleY: 100, opacity: 0.8, duration: 0.3, stagger: 0.02, ease: 'power2.out' }, 0);

    tl.to(container, { backgroundColor: 'rgba(0,229,255,0.25)', duration: 0.1 });
    tl.to(container, { scaleY: 1.5, scaleX: 0.6, duration: 0.2, ease: 'power3.out' });
    tl.to(container, {
      scaleY: 1, scaleX: 1,
      backgroundColor: 'rgba(0,0,0,0)', opacity: 0,
      duration: 0.5, ease: 'power2.out',
    });

    tl.to('.warp-dest', { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.5)' }, '-=0.1');
    tl.to('.warp-dest', { opacity: 0, duration: 0.3, delay: 1 });

    // Particle burst
    PARTICLES.forEach((p, i) => {
      const el = document.getElementById(`wp-${i}`);
      if (el) {
        gsap.fromTo(el,
          { x: 0, y: 0, scale: 0, opacity: 1 },
          { x: p.tx, y: p.ty, scale: 1, opacity: 0, duration: p.duration, delay: p.delay, ease: 'power2.out' }
        );
      }
    });

    return () => { tl.kill(); };
  }, [active, currentPlanet, reducedMotion, onComplete]);

  if (!active) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[95] pointer-events-none" style={{ opacity: 0 }}>
      {/* Light speed streaks */}
      {STREAKS.map((s, i) => (
        <div key={`ws-${i}`} className="warp-streak absolute w-[1px]"
          style={{
            background: `linear-gradient(to bottom, transparent, ${s.color}, transparent)`,
            height: '4px', left: `${s.left}%`, top: `${s.top}%`,
            opacity: 0, transformOrigin: 'center center',
          }}
        />
      ))}

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="warp-dest text-2xl font-mono font-bold opacity-0 scale-150"
          style={{ color: '#00e5ff', textShadow: '0 0 30px rgba(0,229,255,0.8), 0 0 60px rgba(179,136,255,0.4)' }}>
          WARP JUMP
        </p>
      </div>

      {/* Particle burst */}
      {PARTICLES.map((p, i) => (
        <div key={`wp-${i}`} id={`wp-${i}`}
          className="absolute top-1/2 left-1/2 w-[2px] h-[2px] rounded-full"
          style={{ backgroundColor: p.color, opacity: 0 }}
        />
      ))}
    </div>
  );
}
