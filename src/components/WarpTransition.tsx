import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface WarpTransitionProps {
  active: boolean;
  onComplete: () => void;
}

export default function WarpTransition({ active, onComplete }: WarpTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active || reducedMotion) {
      if (active && reducedMotion) onComplete();
      return;
    }

    const container = containerRef.current;
    const lines = linesRef.current;
    if (!container || !lines) return;

    gsap.set(container, { opacity: 1 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(container, { opacity: 0, duration: 0.5, onComplete });
      },
    });

    // Phase 1: Stretch effect
    tl.to(container, {
      scaleX: 2,
      scaleY: 0.3,
      duration: 0.3,
      ease: 'power3.in',
    });

    // Phase 2: Light speed streaks
    tl.to(lines.children, {
      x: () => gsap.utils.random(-200, 200),
      opacity: 1,
      duration: 0.4,
      stagger: 0.02,
      ease: 'power2.out',
    });

    // Phase 3: Flash
    tl.to(container, {
      backgroundColor: 'rgba(0,229,255,0.3)',
      duration: 0.1,
    });

    // Phase 4: Jump
    tl.to(container, {
      scaleX: 0.5,
      scaleY: 3,
      duration: 0.2,
      ease: 'power3.out',
    });

    // Phase 5: Normalize
    tl.to(container, {
      scaleX: 1,
      scaleY: 1,
      backgroundColor: 'rgba(0,0,0,0)',
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
    });

    // Phase 6: Show destination text
    tl.to('.warp-text', {
      opacity: 1,
      scale: 1,
      duration: 0.3,
      ease: 'back.out(1.5)',
    }, '+=0.1');

    tl.to('.warp-text', {
      opacity: 0,
      duration: 0.3,
      delay: 0.6,
    });

    return () => {
      tl.kill();
    };
  }, [active, reducedMotion, onComplete]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[95] flex items-center justify-center pointer-events-none"
      style={{ opacity: 0, backgroundColor: 'transparent' }}
    >
      {/* Light speed lines */}
      <div ref={linesRef} className="absolute inset-0 overflow-hidden flex items-center justify-center">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-px bg-gradient-to-b from-transparent via-[#00e5ff] to-transparent opacity-0"
            style={{
              height: `${50 + Math.random() * 200}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              rotate: `${Math.random() * 30 - 15}deg`,
            }}
          />
        ))}
      </div>

      {/* Warp text */}
      <p
        className="warp-text text-3xl font-mono font-bold text-[#00e5ff] opacity-0 scale-150 z-10"
        style={{ textShadow: '0 0 40px rgba(0,229,255,0.8), 0 0 80px rgba(179,136,255,0.4)' }}
      >
        WARP JUMP
      </p>

      {/* Particle burst */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={`p-${i}`}
          className="warp-particle absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-[#00e5ff]"
          style={{ opacity: 0 }}
        />
      ))}
    </div>
  );
}
