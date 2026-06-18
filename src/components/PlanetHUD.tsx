import { useEffect, useRef, useState } from 'react';
import { PlanetData } from '../data/types';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Shield, Gauge, Thermometer, Clock, Radio, AlertTriangle, Activity } from 'lucide-react';
import gsap from 'gsap';

interface PlanetHUDProps {
  planet: PlanetData | null;
  visible: boolean;
}

function StatBar({ label, value, max, color, Icon }: {
  label: string;
  value: number;
  max: number;
  color: string;
  Icon: React.ComponentType<any>;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => setDisplayValue(Math.round(obj.val)),
    });
  }, [value, reducedMotion]);

  const pct = (displayValue / max) * 100;
  const bars = 12;

  return (
    <div className="flex items-center gap-3">
      <Icon size={14} style={{ color }} />
      <span className="text-[10px] text-white/50 w-16 font-mono uppercase tracking-wider">{label}</span>
      <div className="flex-1 flex gap-[2px] items-center">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className="h-2 flex-1 rounded-[1px] transition-all duration-300"
            style={{
              backgroundColor: i < (pct / 100) * bars ? color : 'rgba(255,255,255,0.08)',
              boxShadow: i < (pct / 100) * bars ? `0 0 4px ${color}60` : 'none',
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono w-8 text-right" style={{ color }}>{displayValue}</span>
    </div>
  );
}

function CircularMeter({ value, max, label, color, size = 52 }: {
  value: number;
  max: number;
  label: string;
  color: string;
  size?: number;
}) {
  const pct = (value / max) * 100;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${color}80)`,
            transition: 'stroke-dashoffset 1s ease-out',
          }}
        />
      </svg>
      <span className="text-[10px] font-mono text-white/50">{label}</span>
      <span className="text-xs font-mono" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function PlanetHUD({ planet, visible }: PlanetHUDProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!panelRef.current) return;
    if (visible && planet) {
      gsap.fromTo(panelRef.current,
        { opacity: 0, x: 60, scale: 0.95 },
        {
          opacity: 1, x: 0, scale: 1,
          duration: reducedMotion ? 0 : 0.5,
          ease: 'power3.out',
        }
      );
    } else if (!visible) {
      gsap.to(panelRef.current, {
        opacity: 0, x: 40, scale: 0.95,
        duration: reducedMotion ? 0 : 0.3,
        ease: 'power2.in',
      });
    }
  }, [visible, planet, reducedMotion]);

  if (!planet) {
    return (
      <div ref={panelRef} className={`absolute top-1/2 right-8 -translate-y-1/2 z-20 transition-opacity ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="glass-panel p-6 rounded-lg w-64 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full border border-white/10 flex items-center justify-center">
            <Radio size={24} className="text-white/20" />
          </div>
          <p className="text-xs font-mono text-white/30 uppercase tracking-[0.2em]">
            SELECT A PLANET<br />TO VIEW DETAILS
          </p>
        </div>
      </div>
    );
  }

  const threatColor = {
    LOW: '#69f0ae',
    MODERATE: '#ffd740',
    HIGH: '#ff9100',
    EXTREME: '#ff4081',
  }[planet.threatLevel];

  return (
    <div
      ref={panelRef}
      className={`absolute top-1/2 right-8 -translate-y-1/2 z-20 transition-opacity ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="glass-panel-hover p-6 rounded-lg w-80 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-xl font-mono font-bold tracking-[0.15em]"
              style={{ color: planet.glowColor, textShadow: `0 0 15px ${planet.glowColor}60` }}
            >
              {planet.name}
            </h2>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{planet.classification}</p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle, ${planet.primaryColor}, ${planet.secondaryColor})`,
              boxShadow: `0 0 15px ${planet.glowColor}50`,
            }}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Parameters */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-white/40">ATMOSPHERE</span>
            <span className="text-white/80">{planet.atmosphere}</span>
          </div>
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-white/40">GRAVITY</span>
            <span className="text-white/80">{planet.gravity}</span>
          </div>
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-white/40">TEMP</span>
            <span className="text-white/80">{planet.temperature}</span>
          </div>
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-white/40">ORBIT</span>
            <span className="text-white/80">{planet.orbitalPeriod}</span>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Discovery & Threat */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={12} className="text-white/40" />
            <span className="text-[10px] font-mono text-white/60">{planet.discoveryStatus}</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: threatColor }}>
            <AlertTriangle size={12} />
            <span className="text-[10px] font-mono font-bold">{planet.threatLevel}</span>
          </div>
        </div>

        {/* Circular meters */}
        <div className="flex justify-around pt-2">
          <CircularMeter value={planet.resourceSignal} max={100} label="RESOURCE" color={planet.glowColor} />
          <CircularMeter value={planet.explorationProgress} max={100} label="EXPLORE" color={planet.ringColor} />
        </div>

        {/* Stat bars */}
        <div className="space-y-2 pt-1">
          <StatBar label="SIGNAL" value={planet.resourceSignal} max={100} color={planet.glowColor} Icon={Activity} />
          <StatBar label="PROGRESS" value={planet.explorationProgress} max={100} color={planet.ringColor} Icon={Gauge} />
        </div>

        {/* Description */}
        <p className="text-[10px] leading-relaxed text-white/40 font-mono">
          {planet.description}
        </p>

        {/* Scan indicator */}
        <div className="flex items-center gap-2 pt-1">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: planet.glowColor }} />
          <span className="text-[9px] font-mono text-white/30">QUANTUM LOCK ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
