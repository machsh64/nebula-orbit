import { useEffect, useRef } from 'react';
import { PlanetData } from '../data/types';
import gsap from 'gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface TargetLockOverlayProps {
  active: boolean;
  planet: PlanetData | null;
  onComplete: () => void;
}

export default function TargetLockOverlay({ active, planet, onComplete }: TargetLockOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active || !planet) return;
    if (reducedMotion) { onComplete(); return; }

    const container = containerRef.current;
    if (!container) return;

    gsap.set(container, { opacity: 1 });

    const tl = gsap.timeline({ onComplete });

    // Lock brackets animate in
    tl.fromTo('.lock-bracket', { opacity: 0, scale: 0.5 }, {
      opacity: 1, scale: 1, duration: 0.3, stagger: 0.08, ease: 'back.out(2)',
    });

    // Lock text
    tl.fromTo('.lock-text', { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: 0.3, ease: 'power2.out',
    }, 0.2);

    // Hold and fade
    tl.to(container, { opacity: 0, duration: 0.4, delay: 0.8 });

    return () => { tl.kill(); };
  }, [active, planet, reducedMotion, onComplete]);

  if (!active || !planet) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[70] pointer-events-none flex items-center justify-center" style={{ opacity: 0 }}>
      {/* Corner brackets */}
      {['tl', 'tr', 'bl', 'br'].map(corner => {
        const isLeft = corner.includes('l');
        const isTop = corner.includes('t');
        return (
          <div
            key={corner}
            className="lock-bracket absolute w-12 h-12"
            style={{
              [isTop ? 'top' : 'bottom']: 'calc(50% - 80px)',
              [isLeft ? 'left' : 'right']: 'calc(50% - 80px)',
              borderTop: isTop ? `2px solid ${planet.glowColor}` : 'none',
              borderBottom: isTop ? 'none' : `2px solid ${planet.glowColor}`,
              borderLeft: isLeft ? `2px solid ${planet.glowColor}` : 'none',
              borderRight: isLeft ? 'none' : `2px solid ${planet.glowColor}`,
            }}
          />
        );
      })}

      {/* Lock text */}
      <div className="lock-text text-center">
        <p className="font-mono text-lg font-bold tracking-[0.2em]" style={{
          color: planet.glowColor,
          textShadow: `0 0 15px ${planet.glowColor}80`,
        }}>
          TARGET LOCKED
        </p>
        <p className="font-mono text-xs text-white/40 tracking-[0.3em] mt-1">
          {planet.name}
        </p>
        <p className="font-mono text-[9px] text-[#69f0ae] mt-2 tracking-wider">
          ORBITAL LOCK ESTABLISHED
        </p>
      </div>

      {/* Scanning beam lines - horizontal + vertical crossing */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-0 right-0 h-[1px] top-1/2"
          style={{
            background: `linear-gradient(90deg, transparent 30%, ${planet.glowColor}40 45%, ${planet.glowColor}80 50%, ${planet.glowColor}40 55%, transparent 70%)`,
            opacity: 0.4,
          }}
        />
        <div className="absolute top-0 bottom-0 w-[1px] left-1/2"
          style={{
            background: `linear-gradient(0deg, transparent 30%, ${planet.glowColor}40 45%, ${planet.glowColor}80 50%, ${planet.glowColor}40 55%, transparent 70%)`,
            opacity: 0.4,
          }}
        />
      </div>
    </div>
  );
}
