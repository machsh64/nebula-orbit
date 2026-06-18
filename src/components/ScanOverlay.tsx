import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface ScanOverlayProps {
  active: boolean;
  onComplete: () => void;
}

export default function ScanOverlay({ active, onComplete }: ScanOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active || reducedMotion) {
      if (active && reducedMotion) onComplete();
      return;
    }

    const container = containerRef.current;
    const ring = ringRef.current;
    if (!container || !ring) return;

    // Show overlay
    gsap.set(container, { opacity: 1 });

    // Radar ring expansion
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(container, { opacity: 0, duration: 0.3, onComplete });
      },
    });

    // 3 rings propagating outward
    for (let i = 0; i < 3; i++) {
      const r = document.createElement('div');
      r.className = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00e5ff]/30';
      r.style.width = '10px';
      r.style.height = '10px';
      ring.appendChild(r);

      tl.to(
        r,
        {
          width: '200vmax',
          height: '200vmax',
          opacity: 0,
          duration: 1.5,
          ease: 'power2.out',
        },
        i * 0.4
      );
    }

    // Scan text
    tl.to(
      '.scan-text',
      {
        opacity: 1,
        duration: 0.3,
      },
      0
    );

    // Data readout flicker
    tl.to(
      '.scan-data',
      {
        opacity: 1,
        y: 0,
        duration: 0.2,
        stagger: 0.1,
      },
      0.5
    );

    return () => {
      tl.kill();
    };
  }, [active, reducedMotion, onComplete]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none"
      style={{ opacity: 0 }}
    >
      {/* Ring container */}
      <div ref={ringRef} className="absolute inset-0 overflow-hidden" />

      {/* Center HUD elements */}
      <div className="text-center z-10">
        <p className="scan-text text-xl font-mono font-bold text-[#00e5ff] opacity-0"
          style={{ textShadow: '0 0 20px rgba(0,229,255,0.6)' }}>
          DEEP SCAN ACTIVE
        </p>
        <div className="mt-4 space-y-1">
          {['ANALYZING ATMOSPHERIC COMPOSITION...', 'MAPPING GRAVITATIONAL FIELD...', 'SCANNING FOR BIOSIGNATURES...', 'CALCULATING ORBITAL PARAMETERS...'].map(
            (text, i) => (
              <p
                key={text}
                className="scan-data text-[10px] font-mono text-[#00e5ff]/50 opacity-0 translate-y-2"
              >
                {text}
              </p>
            )
          )}
        </div>

        {/* Decorative hex grid overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <svg width="400" height="400" viewBox="0 0 200 200">
            <pattern id="hex" width="20" height="34.64" patternUnits="userSpaceOnUse">
              <path d="M10 0 L20 5.77 L20 17.32 L10 23.09 L0 17.32 L0 5.77 Z"
                fill="none" stroke="#00e5ff" strokeWidth="0.5" />
              <path d="M10 34.64 L20 40.41 L20 51.96 L10 57.73 L0 51.96 L0 40.41 Z"
                fill="none" stroke="#00e5ff" strokeWidth="0.5" />
            </pattern>
            <rect width="200" height="200" fill="url(#hex)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
