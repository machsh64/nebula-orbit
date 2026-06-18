import { useEffect, useRef, useState } from 'react';
import { PlanetData } from '../data/types';
import gsap from 'gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface DeepScanSystemProps {
  active: boolean;
  planet: PlanetData | null;
  onComplete: () => void;
}

export default function DeepScanSystem({ active, planet, onComplete }: DeepScanSystemProps) {
  const [scanStage, setScanStage] = useState(0);
  const [revealedParams, setRevealedParams] = useState<number>(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active || !planet) {
      setScanStage(0);
      setRevealedParams(0);
      return;
    }
    if (reducedMotion) { onComplete(); return; }

    const params = planet.scanParams || [];
    const tl = gsap.timeline({ onComplete });

    // Stage 1: Initiating scan
    tl.call(() => setScanStage(1));
    tl.to({}, { duration: 0.6 });

    // Stage 2: Scan beams active, reveal params one by one
    tl.call(() => setScanStage(2));
    params.forEach((_, i) => {
      tl.call(() => setRevealedParams(i + 1));
      tl.to({}, { duration: 0.35 });
    });

    // Stage 3: Scan complete
    tl.call(() => setScanStage(3));
    tl.to({}, { duration: 1.5 });

    return () => { tl.kill(); };
  }, [active, planet, reducedMotion, onComplete]);

  if (!active || !planet) return null;

  const params = planet.scanParams || [];

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[80] pointer-events-none flex items-center justify-center">
      {/* Scan rings around planet position */}
      {scanStage >= 2 && (
        <div ref={ringRef} className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="absolute rounded-full animate-ping"
              style={{
                width: '100px',
                height: '100px',
                border: `1px solid ${planet.glowColor}`,
                opacity: 0.3,
                animationDuration: `${1.5 + i * 0.4}s`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Scan beam line */}
      {scanStage >= 2 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute left-0 right-0 h-[1px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${planet.glowColor}, transparent)`,
              top: '50%',
              animation: 'scan-line 0.5s linear infinite',
              opacity: 0.4,
            }}
          />
        </div>
      )}

      {/* Scan data readout */}
      <div className="absolute right-[min(380px,28vw)] top-1/2 -translate-y-1/2 z-10 max-w-[23rem]">
        <div className="space-y-1.5">
          {scanStage >= 1 && (
            <p className="font-mono text-xs font-bold tracking-[0.2em]" style={{
              color: planet.glowColor,
              textShadow: `0 0 10px ${planet.glowColor}60`,
            }}>
              {scanStage < 3 ? 'SCANNING...' : 'SCAN COMPLETE'}
            </p>
          )}

          {params.slice(0, revealedParams).map((param, i) => (
            <div
              key={param.label}
              className="flex items-center gap-2 font-mono"
              style={{ opacity: revealedParams > i ? 1 : 0 }}
            >
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: planet.glowColor }} />
              <span className="text-[8px] text-white/30">{param.label}</span>
              <span className="text-[9px] font-bold" style={{ color: planet.glowColor }}>{param.value}</span>
              {i === revealedParams - 1 && scanStage < 3 && (
                <span className="text-[8px] animate-pulse" style={{ color: '#ffd740' }}>▌</span>
              )}
            </div>
          ))}

          {scanStage === 3 && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <div className="mb-2 h-px w-full" style={{
                background: `linear-gradient(90deg, transparent, ${planet.glowColor}, #ffd740, transparent)`,
              }} />
              <p className="max-w-xs text-[10px] leading-relaxed text-white/45">
                {planet.description}
              </p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[8px]" style={{ color: planet.glowColor }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: planet.glowColor, boxShadow: `0 0 8px ${planet.glowColor}` }} />
                ARCHIVE PLATE SEALED
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stage indicator */}
      {scanStage === 1 && (
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 text-center">
          <p className="font-mono text-[#ffd740] text-xs animate-pulse tracking-[0.15em]">
            INITIATING DEEP SCAN...
          </p>
          <p className="font-mono text-white/15 text-[9px] mt-1 tracking-wider">
            TARGET: {planet.name}
          </p>
        </div>
      )}

      {scanStage === 3 && (
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 text-center">
          <p className="font-mono text-[#69f0ae] text-sm font-bold tracking-[0.15em]">
            SCAN COMPLETE
          </p>
          <p className="font-mono text-white/20 text-[9px] mt-1">
            {params.length} PARAMETERS ANALYZED
          </p>
        </div>
      )}
    </div>
  );
}
