import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { BOOT_SEQUENCE_STEPS } from '../data/planets';
import { ART_DIRECTION } from '../data/artDirection';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface BootSequenceProps {
  onComplete: () => void;
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      onComplete();
    }
  }, [reducedMotion, onComplete]);

  useEffect(() => {
    if (reducedMotion) return;

    const tl = gsap.timeline({ delay: 0.3 });

    // Type out each boot step
    BOOT_SEQUENCE_STEPS.forEach((step, i) => {
      tl.call(() => setCurrentStep(i), undefined, i * 0.5);
      if (i < BOOT_SEQUENCE_STEPS.length - 1) {
        tl.to({}, { duration: 0.5 });
      }
    });

    // Show progress bar
    tl.call(() => setShowProgress(true));
    tl.to(
      { p: 0 },
      {
        p: 100,
        duration: 1.2,
        ease: 'power2.inOut',
        onUpdate: function () {
          setProgress(Math.round((this.targets()[0] as any).p));
        },
      }
    );

    // Fade out
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in',
      onComplete,
    }, '+=0.3');

    return () => {
      tl.kill();
    };
  }, [reducedMotion, onComplete]);

  if (reducedMotion) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-[#020510] flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 opacity-70" style={{
        background: 'radial-gradient(circle at 50% 42%, rgba(0,229,255,0.16), transparent 30%), linear-gradient(120deg, rgba(255,215,64,0.05), transparent 36%, rgba(255,64,129,0.06))',
      }} />
      <div className="absolute inset-x-0 top-1/2 h-px opacity-30" style={{ background: 'linear-gradient(90deg, transparent, #00e5ff, #ffd740, #ff4081, transparent)' }} />

      {/* Central logo */}
      <div className="relative z-10 mb-12 text-center">
        <div className="w-28 h-28 mx-auto mb-6 rounded-full border border-white/10 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: 'radial-gradient(circle, #00e5ff, transparent)' }} />
          <div className="absolute -inset-5 rounded-full opacity-40" style={{ border: `1px solid ${ART_DIRECTION.palette.amber}55` }} />
          <div className="absolute -inset-9 rounded-full opacity-25" style={{ border: `1px solid ${ART_DIRECTION.palette.magenta}55`, transform: 'rotate(18deg) scaleX(1.18)' }} />
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#00e5ff" strokeWidth="1" fill="none" opacity="0.6" />
            <circle cx="16" cy="16" r="8" stroke="#b388ff" strokeWidth="0.8" fill="none" opacity="0.4" />
            <path d="M6 17C10 9 21 8 26 15" stroke="#ffd740" strokeWidth="0.7" opacity="0.7" />
            <circle cx="16" cy="16" r="3" fill="#f6f0ff" opacity="0.9" />
          </svg>
        </div>
        <h1 className="text-2xl font-mono font-bold tracking-[0.3em] text-glow-cyan mb-2">
          NEBULA ORBIT
        </h1>
        <p className="text-[10px] font-mono text-white/30 tracking-[0.4em] uppercase">
          {ART_DIRECTION.callsign}
        </p>
      </div>

      {/* Boot log */}
      <div ref={logRef} className="relative z-10 w-96 max-w-[calc(100vw-2rem)] space-y-2 font-mono text-xs">
        {BOOT_SEQUENCE_STEPS.map((step, i) => {
          const isVisible = i <= currentStep;
          const isComplete = i < currentStep;
          const isLast = i === BOOT_SEQUENCE_STEPS.length - 1;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 transition-all duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isComplete
                ? 'bg-[#69f0ae]'
                : isLast && i === currentStep
                  ? 'bg-[#00e5ff]'
                  : i === currentStep
                    ? 'bg-[#ffd740] animate-pulse'
                    : 'bg-white/10'
                }`} />
              <span
                className={
                  isComplete
                    ? 'text-[#69f0ae]/60'
                    : i === currentStep
                      ? 'text-[#00e5ff]'
                      : 'text-white/20'
                }
              >
                {step}
              </span>
              {isComplete && <span className="text-[#69f0ae]/40 text-[10px]">OK</span>}
              {i === currentStep && !isComplete && <span className="text-[#ffd740]/60 text-[10px] animate-pulse">...</span>}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className={`relative z-10 mt-8 w-64 transition-opacity duration-300 ${showProgress ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-100 rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #00e5ff, #b388ff)',
              boxShadow: '0 0 10px rgba(0,229,255,0.5)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] font-mono text-white/20">BOOT SEQ 7G-A</span>
          <span className="text-[8px] font-mono text-white/20">{progress}%</span>
        </div>
      </div>

      {/* Scan line decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-full h-[1px] opacity-20"
          style={{
            background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)',
            animation: 'scan-line 4s linear infinite',
          }}
        />
      </div>
    </div>
  );
}
