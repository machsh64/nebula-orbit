import { useState, useEffect, useCallback, useRef } from 'react';
import { PlanetData } from '../data/types';
import { PLANETS, TERMINAL_LOGS } from '../data/planets';
import { useMouseParallax } from '../hooks/useMouseParallax';
import { useReducedMotion } from '../hooks/useReducedMotion';
import StarfieldBackground from './StarfieldBackground';
import NebulaBackdrop from './NebulaBackdrop';
import PlanetCanvas from './PlanetCanvas';
import PlanetHUD from './PlanetHUD';
import CommandConsole from './CommandConsole';
import BootSequence from './BootSequence';
import ScanOverlay from './ScanOverlay';
import WarpTransition from './WarpTransition';
import CustomCursor from './CustomCursor';
import ScrollNarrative from './ScrollNarrative';
import gsap from 'gsap';

function CornerHUD() {
  const [coords, setCoords] = useState({ ra: '18h 36m 56s', dec: '+38° 47′ 12″', signal: '98.7' });
  const [terminalIdx, setTerminalIdx] = useState(0);
  const reducedMotion = useReducedMotion();

  // Cycle terminal logs
  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setTerminalIdx(prev => (prev + 1) % TERMINAL_LOGS.length);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  // Random coordinate flicker
  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setCoords({
        ra: `18h ${36 + Math.floor(Math.random() * 2)}m ${50 + Math.floor(Math.random() * 10)}s`,
        dec: `+38° ${47 + Math.floor(Math.random() * 2)}′ ${Math.floor(Math.random() * 60)}″`,
        signal: `${(95 + Math.random() * 5).toFixed(1)}`,
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  return (
    <>
      {/* Top-left: Coordinates */}
      <div className="fixed top-4 left-4 z-30 pointer-events-none">
        <div className="glass-panel px-3 py-2 rounded font-mono text-[9px] space-y-[2px]">
          <div className="text-white/30">
            <span className="text-[#00e5ff]/50">RA </span>
            <span className="text-white/60">{coords.ra}</span>
          </div>
          <div className="text-white/30">
            <span className="text-[#00e5ff]/50">DEC</span>
            <span className="text-white/60"> {coords.dec}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#00e5ff]/50">SIGNAL</span>
            <span className="text-[#69f0ae]">{coords.signal}%</span>
            <div className="w-1 h-1 rounded-full bg-[#69f0ae] animate-pulse ml-1" />
          </div>
        </div>
      </div>

      {/* Top-right: System status */}
      <div className="fixed top-4 right-4 z-30 pointer-events-none">
        <div className="glass-panel px-3 py-2 rounded font-mono text-[9px] space-y-[2px]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#69f0ae]" />
            <span className="text-white/40">SYS NOMINAL</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse" />
            <span className="text-white/40">UPLINK ACTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#b388ff]" />
            <span className="text-white/40">Q-ENTANGLEMENT</span>
          </div>
        </div>
      </div>

      {/* Bottom-left: Terminal log */}
      <div className="fixed bottom-4 left-4 z-30 pointer-events-none max-w-[200px]">
        <div className="glass-panel px-3 py-2 rounded font-mono">
          <p className="text-[8px] text-white/20 uppercase mb-1 tracking-wider">TERMINAL</p>
          <p
            className="text-[9px] text-[#00e5ff]/50 transition-all duration-300"
            key={terminalIdx}
          >
            {TERMINAL_LOGS[terminalIdx]}
          </p>
        </div>
      </div>
    </>
  );
}

export default function SpaceShowcasePage() {
  const [bootComplete, setBootComplete] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetData | null>(null);
  const [viewMode, setViewMode] = useState<'orbit' | 'detail' | 'archive'>('orbit');
  const [autoOrbit, setAutoOrbit] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [warpActive, setWarpActive] = useState(false);
  const [showPlanetHUD, setShowPlanetHUD] = useState(false);
  const parallax = useMouseParallax(0.015);
  const reducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);

  const handleBootComplete = useCallback(() => {
    setBootComplete(true);
    // Hero entrance animation
    if (!reducedMotion) {
      gsap.fromTo(
        '.hero-title',
        { opacity: 0, y: 40, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo(
        '.hero-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out', delay: 0.6 }
      );
      gsap.fromTo(
        '.hero-decoration',
        { opacity: 0 },
        { opacity: 1, duration: 0.8, delay: 1 }
      );
    }
  }, [reducedMotion]);

  const handleSelectPlanet = useCallback((planet: PlanetData | null) => {
    if (!planet) {
      setShowPlanetHUD(false);
      setTimeout(() => setSelectedPlanet(null), 300);
      return;
    }
    setSelectedPlanet(planet);
    setShowPlanetHUD(true);
    if (viewMode === 'orbit') setViewMode('detail');
  }, [viewMode]);

  const handleDeepScan = useCallback(() => {
    setScanActive(true);
  }, []);

  const handleWarpJump = useCallback(() => {
    setWarpActive(true);
  }, []);

  // Auto orbit: cycle through planets
  useEffect(() => {
    if (!autoOrbit || !bootComplete) return;
    const interval = setInterval(() => {
      const currentIdx = PLANETS.findIndex(p => p.id === selectedPlanet?.id);
      const nextIdx = (currentIdx + 1) % PLANETS.length;
      handleSelectPlanet(PLANETS[nextIdx]);
    }, 3000);
    return () => clearInterval(interval);
  }, [autoOrbit, bootComplete, selectedPlanet, handleSelectPlanet]);

  return (
    <div className="relative min-h-screen bg-[#020510] overflow-x-hidden">
      {/* Boot sequence */}
      {!bootComplete && <BootSequence onComplete={handleBootComplete} />}

      {/* Background layers */}
      <StarfieldBackground />
      <NebulaBackdrop />

      {/* Scan line overlay */}
      <div className="scan-line-overlay" />

      {/* Main content */}
      <div className={`transition-opacity duration-1000 ${bootComplete ? 'opacity-100' : 'opacity-0'}`}>
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="relative z-10 min-h-screen flex flex-col items-center justify-center"
        >
          {/* Planet system canvas */}
          <PlanetCanvas
            selectedPlanet={selectedPlanet}
            onSelectPlanet={handleSelectPlanet}
            onHoverPlanet={setHoveredPlanet}
            hoveredPlanet={hoveredPlanet}
          />

          {/* Hero text */}
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 text-center pointer-events-none z-[3]">
            <h1
              className="hero-title text-5xl md:text-7xl font-mono font-bold tracking-[0.12em] text-glow-cyan mb-4"
              style={{
                transform: reducedMotion ? 'none' : `translate(${parallax.x * 100}px, ${parallax.y * 100}px)`,
              }}
            >
              NEBULA ORBIT
            </h1>
            <p className="hero-subtitle text-xs md:text-sm font-mono text-[#b388ff]/60 tracking-[0.5em] uppercase">
              Interstellar Planetary Archive
            </p>
            <div className="hero-decoration mt-8 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse" />
                <span className="text-[8px] font-mono text-white/20">DEEP SPACE NETWORK</span>
              </div>
              <div className="w-8 h-px bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#69f0ae]" />
                <span className="text-[8px] font-mono text-white/20">ORBITAL LENS CALIBRATED</span>
              </div>
              <div className="w-8 h-px bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#b388ff]" />
                <span className="text-[8px] font-mono text-white/20">Q-UPLINK ESTABLISHED</span>
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 pointer-events-none z-[3] text-center">
            <p className="text-[9px] font-mono text-white/15 tracking-[0.3em] uppercase mb-3">
              Scroll to Explore
            </p>
            <div className="w-[2px] h-8 mx-auto bg-gradient-to-b from-white/20 to-transparent rounded" />
          </div>
        </section>

        {/* Planet HUD */}
        {(selectedPlanet || hoveredPlanet) && (
          <PlanetHUD
            planet={selectedPlanet || hoveredPlanet}
            visible={showPlanetHUD || (hoveredPlanet !== null && selectedPlanet === null)}
          />
        )}

        {/* Scroll Narrative section */}
        <ScrollNarrative />

        {/* Footer spacer */}
        <div className="h-32" />
      </div>

      {/* Command Console */}
      <CommandConsole
        selectedPlanet={selectedPlanet}
        onSelectPlanet={handleSelectPlanet}
        onDeepScan={handleDeepScan}
        onWarpJump={handleWarpJump}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        autoOrbit={autoOrbit}
        onAutoOrbitToggle={() => setAutoOrbit(prev => !prev)}
      />

      {/* Corner HUD */}
      <CornerHUD />

      {/* Custom cursor */}
      <CustomCursor />

      {/* Effects overlays */}
      <ScanOverlay active={scanActive} onComplete={() => setScanActive(false)} />
      <WarpTransition active={warpActive} onComplete={() => setWarpActive(false)} />
    </div>
  );
}
