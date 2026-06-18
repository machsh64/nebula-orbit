import { useState, useRef, useEffect } from 'react';
import { PlanetData } from '../data/types';
import { PLANETS } from '../data/planets';
import { ChevronLeft, ChevronRight, Play, Pause, Scan, Zap, Eye, Orbit, Archive } from 'lucide-react';
import gsap from 'gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface CommandConsoleProps {
  selectedPlanet: PlanetData | null;
  onSelectPlanet: (planet: PlanetData) => void;
  onDeepScan: () => void;
  onWarpJump: () => void;
  viewMode: 'orbit' | 'detail' | 'archive';
  onViewModeChange: (mode: 'orbit' | 'detail' | 'archive') => void;
  autoOrbit: boolean;
  onAutoOrbitToggle: () => void;
}

export default function CommandConsole({
  selectedPlanet,
  onSelectPlanet,
  onDeepScan,
  onWarpJump,
  viewMode,
  onViewModeChange,
  autoOrbit,
  onAutoOrbitToggle,
}: CommandConsoleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (selectedPlanet) {
      const idx = PLANETS.findIndex(p => p.id === selectedPlanet.id);
      if (idx >= 0) setCurrentIdx(idx);
    }
  }, [selectedPlanet]);

  const navigatePlanet = (dir: number) => {
    const newIdx = (currentIdx + dir + PLANETS.length) % PLANETS.length;
    setCurrentIdx(newIdx);
    onSelectPlanet(PLANETS[newIdx]);
  };

  const triggerButton = (id: string, action?: () => void) => {
    if (reducedMotion) {
      action?.();
      return;
    }
    setActiveBtn(id);

    // Energy pulse animation
    const btn = document.getElementById(`cmd-${id}`);
    if (btn) {
      gsap.fromTo(btn,
        { boxShadow: '0 0 0px rgba(0,229,255,0)' },
        {
          boxShadow: '0 0 40px rgba(0,229,255,0.8)',
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            setActiveBtn(null);
            action?.();
          },
        }
      );
    } else {
      setTimeout(() => {
        setActiveBtn(null);
        action?.();
      }, 400);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30"
    >
      <div className="glass-panel rounded-lg px-6 py-3 flex items-center gap-4">
        {/* Planet Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigatePlanet(-1)}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
            data-hoverable
          >
            <ChevronLeft size={16} className="text-white/60" />
          </button>

          <div className="flex gap-1">
            {PLANETS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { setCurrentIdx(i); onSelectPlanet(p); }}
                className="w-3 h-3 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i === currentIdx ? p.glowColor : 'rgba(255,255,255,0.15)',
                  boxShadow: i === currentIdx ? `0 0 8px ${p.glowColor}` : 'none',
                  transform: i === currentIdx ? 'scale(1.3)' : 'scale(1)',
                }}
                data-hoverable
              />
            ))}
          </div>

          <button
            onClick={() => navigatePlanet(1)}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
            data-hoverable
          >
            <ChevronRight size={16} className="text-white/60" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* View mode */}
        <div className="flex items-center gap-1">
          {([
            { mode: 'orbit' as const, Icon: Orbit, label: 'ORBIT' },
            { mode: 'detail' as const, Icon: Eye, label: 'DETAIL' },
            { mode: 'archive' as const, Icon: Archive, label: 'ARCHIVE' },
          ]).map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono transition-all"
              style={{
                backgroundColor: viewMode === mode ? 'rgba(0,229,255,0.1)' : 'transparent',
                color: viewMode === mode ? '#00e5ff' : 'rgba(255,255,255,0.4)',
              }}
              data-hoverable
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-white/10" />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Auto Orbit */}
          <button
            id="cmd-auto-orbit"
            onClick={() => onAutoOrbitToggle()}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-mono font-bold transition-all ${autoOrbit
              ? 'bg-[#00e5ff]/15 text-[#00e5ff]'
              : 'bg-white/5 text-white/40'
              }`}
            data-hoverable
          >
            {autoOrbit ? <Pause size={12} /> : <Play size={12} />}
            AUTO ORBIT
          </button>

          {/* Deep Scan */}
          <button
            id="cmd-deep-scan"
            onClick={() => triggerButton('deep-scan', onDeepScan)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-mono font-bold bg-[#b388ff]/10 text-[#b388ff] hover:bg-[#b388ff]/20 transition-all"
            data-hoverable
          >
            <Scan size={12} />
            DEEP SCAN
          </button>

          {/* Warp Jump */}
          <button
            id="cmd-warp"
            onClick={() => triggerButton('warp', onWarpJump)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-mono font-bold bg-[#ff4081]/10 text-[#ff4081] hover:bg-[#ff4081]/20 transition-all"
            data-hoverable
          >
            <Zap size={12} />
            WARP JUMP
          </button>
        </div>

        {/* Current planet indicator */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: PLANETS[currentIdx]?.glowColor }} />
          <span className="text-[9px] font-mono text-white/30">
            {PLANETS[currentIdx]?.name || 'NO TARGET'}
          </span>
        </div>
      </div>
    </div>
  );
}
