import { useState, useEffect, useCallback, useRef } from 'react';
import { PlanetData, SystemStatus } from '../data/types';
import { PLANETS } from '../data/planets';
import { useReducedMotion } from '../hooks/useReducedMotion';
import StarfieldBackground from './StarfieldBackground';
import NebulaBackdrop from './NebulaBackdrop';
import GalaxyViewport from './GalaxyViewport';
import CockpitHUD from './CockpitHUD';
import CommandDeck from './CommandDeck';
import BootSequence from './BootSequence';
import CustomCursor from './CustomCursor';
import DeepScanSystem from './DeepScanSystem';
import WarpJumpSystem from './WarpJumpSystem';
import TargetLockOverlay from './TargetLockOverlay';
import gsap from 'gsap';

export default function SpaceShowcasePage() {
  const [bootComplete, setBootComplete] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData>(PLANETS[0]);
  const [lockedPlanet, setLockedPlanet] = useState<PlanetData | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetData | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('idle');
  const [autoOrbit, setAutoOrbit] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [warpActive, setWarpActive] = useState(false);
  const [lockAnimActive, setLockAnimActive] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(18);
  const controlsRef = useRef<any>(null);
  const zoomRef = useRef(18);
  const reducedMotion = useReducedMotion();

  // === Planet Selection / Lock ===
  const handleSelectPlanet = useCallback((planet: PlanetData) => {
    setSelectedPlanet(planet);
    if (lockedPlanet) {
      // If already locked on something, transition to new lock
      setLockedPlanet(null);
      setSystemStatus('idle');
      setTimeout(() => {
        setLockedPlanet(planet);
        setSystemStatus('locked');
        setLockAnimActive(true);
      }, 400);
    } else {
      setLockedPlanet(planet);
      setSystemStatus('locked');
      setLockAnimActive(true);
    }
  }, [lockedPlanet]);

  const handleUnlock = useCallback(() => {
    setLockedPlanet(null);
    setSystemStatus('idle');
  }, []);

  // === Deep Scan ===
  const handleDeepScan = useCallback(() => {
    if (!lockedPlanet || systemStatus === 'scanning' || systemStatus === 'warping') return;
    setSystemStatus('scanning');
    setScanActive(true);
  }, [lockedPlanet, systemStatus]);

  const handleScanComplete = useCallback(() => {
    setScanActive(false);
    setSystemStatus('locked');
  }, []);

  // === Warp Jump ===
  const handleWarpJump = useCallback(() => {
    if (systemStatus === 'warping' || systemStatus === 'scanning') return;
    setSystemStatus('warping');
    setWarpActive(true);
  }, [systemStatus]);

  const handleWarpComplete = useCallback((target: PlanetData) => {
    setWarpActive(false);
    setSelectedPlanet(target);
    // Auto-lock on warp arrival
    setTimeout(() => {
      setLockedPlanet(target);
      setSystemStatus('locked');
      setLockAnimActive(true);
    }, 600);
  }, []);

  // === Auto Orbit ===
  useEffect(() => {
    if (!autoOrbit || !bootComplete) return;
    const interval = setInterval(() => {
      const currentIdx = PLANETS.findIndex(p => p.id === (lockedPlanet?.id ?? selectedPlanet?.id));
      const nextIdx = (currentIdx + 1) % PLANETS.length;
      const next = PLANETS[nextIdx];
      setSelectedPlanet(next);
      setLockedPlanet(next);
      setSystemStatus('locked');
      setLockAnimActive(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoOrbit, bootComplete, lockedPlanet, selectedPlanet]);

  // === Keyboard Shortcuts ===
  useEffect(() => {
    if (!bootComplete) return;

    const handleKey = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      const currentIdx = PLANETS.findIndex(p => p.id === (lockedPlanet?.id ?? selectedPlanet?.id));

      switch (e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft': {
          const prev = (currentIdx - 1 + PLANETS.length) % PLANETS.length;
          handleSelectPlanet(PLANETS[prev]);
          break;
        }
        case 'd':
        case 'arrowright': {
          const next = (currentIdx + 1) % PLANETS.length;
          handleSelectPlanet(PLANETS[next]);
          break;
        }
        case ' ': {
          e.preventDefault();
          handleDeepScan();
          break;
        }
        case 'w': {
          handleWarpJump();
          break;
        }
        case 'escape': {
          handleUnlock();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [bootComplete, lockedPlanet, selectedPlanet, handleSelectPlanet, handleDeepScan, handleWarpJump, handleUnlock]);

  // === Boot Complete Handler ===
  const handleBootComplete = useCallback(() => {
    setBootComplete(true);
    if (!reducedMotion) {
      gsap.fromTo('.cockpit-fade-in', { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out', delay: 0.2 });
    }
  }, [reducedMotion]);

  const activePlanet = lockedPlanet || selectedPlanet;

  return (
    <div className="relative w-screen h-screen bg-[#020510] overflow-hidden">
      {/* Boot Sequence */}
      {!bootComplete && <BootSequence onComplete={handleBootComplete} />}

      {/* Background layers */}
      <StarfieldBackground />
      <NebulaBackdrop />

      {/* Scan line overlay */}
      <div className="scan-line-overlay" />

      {/* Main cockpit container — fades in after boot */}
      <div className={`cockpit-fade-in w-full h-full ${bootComplete ? 'opacity-100' : 'opacity-0'}`}>
        {/* === CENTER: 3D Galaxy Viewport === */}
        <GalaxyViewport
          lockedPlanetId={lockedPlanet?.id ?? null}
          scanningPlanetId={scanActive ? lockedPlanet?.id ?? null : null}
          targetedPlanetId={hoveredPlanet?.id ?? null}
          onPlanetClick={handleSelectPlanet}
          onPlanetHover={setHoveredPlanet}
          onCameraMove={setCameraZoom}
          controlsRef={controlsRef}
          zoomRef={zoomRef}
        />

        {/* === HUD OVERLAY === */}
        <CockpitHUD
          lockedPlanet={lockedPlanet}
          targetedPlanet={hoveredPlanet}
          hoveredPlanet={hoveredPlanet}
          systemStatus={systemStatus}
          cameraZoom={cameraZoom}
          onSelectPlanet={handleSelectPlanet}
          onDeepScan={handleDeepScan}
          onWarpJump={handleWarpJump}
          onUnlock={handleUnlock}
        />

        {/* === BOTTOM: Command Deck === */}
        <CommandDeck
          selectedPlanet={selectedPlanet}
          lockedPlanet={lockedPlanet}
          systemStatus={systemStatus}
          autoOrbit={autoOrbit}
          onSelectPlanet={handleSelectPlanet}
          onDeepScan={handleDeepScan}
          onWarpJump={handleWarpJump}
          onToggleAutoOrbit={() => setAutoOrbit(prev => !prev)}
          onUnlock={handleUnlock}
        />

        {/* === EFFECTS OVERLAYS === */}
        <TargetLockOverlay
          active={lockAnimActive}
          planet={lockedPlanet}
          onComplete={() => setLockAnimActive(false)}
        />
        <DeepScanSystem
          active={scanActive}
          planet={lockedPlanet}
          onComplete={handleScanComplete}
        />
        <WarpJumpSystem
          active={warpActive}
          currentPlanet={activePlanet}
          onComplete={handleWarpComplete}
        />
      </div>

      {/* Custom Cursor */}
      <CustomCursor />
    </div>
  );
}
