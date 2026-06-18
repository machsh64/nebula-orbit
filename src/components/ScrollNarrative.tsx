import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NARRATIVE_SECTIONS } from '../data/planets';
import { Navigation, Crosshair, Radar, Archive, Rocket } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Navigation,
  Crosshair,
  Radar,
  Archive,
  Rocket,
};

export default function ScrollNarrative() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      // Each narrative card animates in
      NARRATIVE_SECTIONS.forEach((_, i) => {
        const card = document.querySelector(`.narrative-card-${i}`);
        if (!card) return;

        gsap.fromTo(
          card,
          { opacity: 0, y: 80, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              end: 'top 50%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // Parallax numbers
      NARRATIVE_SECTIONS.forEach((_, i) => {
        const num = document.querySelector(`.narrative-num-${i}`);
        if (!num) return;

        gsap.fromTo(
          num,
          { y: 100, opacity: 0 },
          {
            y: -50,
            opacity: 0.15,
            ease: 'none',
            scrollTrigger: {
              trigger: `.narrative-card-${i}`,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.5,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <div ref={sectionRef} className="relative z-10 py-32 px-8 max-w-5xl mx-auto">
      {/* Section header */}
      <div className="text-center mb-24">
        <p className="text-[10px] font-mono text-[#00e5ff]/50 tracking-[0.4em] uppercase mb-4">
          Mission Briefing
        </p>
        <h2 className="text-3xl font-mono font-bold text-glow-cyan tracking-[0.15em]">
          STARSHIP LOG
        </h2>
        <div className="w-24 h-px mx-auto mt-6 bg-gradient-to-r from-transparent via-[#00e5ff]/30 to-transparent" />
      </div>

      {/* Narrative cards */}
      <div className="space-y-40">
        {NARRATIVE_SECTIONS.map((section, i) => {
          const Icon = ICON_MAP[section.icon] || Navigation;
          const isRight = i % 2 === 1;

          return (
            <div
              key={section.id}
              className={`narrative-card-${i} relative flex items-center gap-12 ${isRight ? 'flex-row-reverse' : ''
                }`}
            >
              {/* Big background number */}
              <div
                className={`narrative-num-${i} absolute ${isRight ? 'right-0' : 'left-0'
                  } -top-16 text-[180px] font-mono font-bold text-[#00e5ff] leading-none select-none opacity-0`}
                style={{ textShadow: '0 0 80px rgba(0,229,255,0.1)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>

              {/* Icon badge */}
              <div className="flex-shrink-0 relative z-10">
                <div className="w-16 h-16 rounded-lg glass-panel flex items-center justify-center">
                  <Icon size={28} className="text-[#00e5ff]" />
                </div>
                {/* Connecting line */}
                {i < NARRATIVE_SECTIONS.length - 1 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-40 bg-gradient-to-b from-[#00e5ff]/20 to-transparent" />
                )}
              </div>

              {/* Content card */}
              <div className="flex-1 relative z-10">
                <div className="glass-panel-hover p-8 rounded-lg max-w-xl">
                  <p className="text-[10px] font-mono text-[#b388ff] tracking-[0.3em] uppercase mb-2">
                    {section.subtitle}
                  </p>
                  <h3 className="text-xl font-mono font-bold text-white/90 tracking-[0.1em] mb-4">
                    {section.title}
                  </h3>
                  <p className="text-sm font-mono text-white/50 leading-relaxed">
                    {section.text}
                  </p>

                  {/* Data decoration */}
                  <div className="mt-4 pt-4 border-t border-white/5 flex gap-6">
                    <div className="text-[9px] font-mono">
                      <span className="text-white/30">MISSION ID: </span>
                      <span className="text-[#00e5ff]/60">NX-{String(i + 1).padStart(3, '0')}</span>
                    </div>
                    <div className="text-[9px] font-mono">
                      <span className="text-white/30">STATUS: </span>
                      <span className="text-[#69f0ae]/60">{i < NARRATIVE_SECTIONS.length - 1 ? 'ACTIVE' : 'AWAITING CMD'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
