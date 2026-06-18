import { useState, useEffect, useCallback, useRef } from 'react';
import { PlanetData, SystemStatus } from '../data/types';
import { useReducedMotion } from '../hooks/useReducedMotion';
import StarfieldBackground from './StarfieldBackground';
import NebulaBackdrop from './NebulaBackdrop';
import GalaxyViewport, { FlightState } from './GalaxyViewport';
import CockpitHUD from './CockpitHUD';
import CommandDeck from './CommandDeck';
import BootSequence from './BootSequence';
import CustomCursor from './CustomCursor';
import DeepScanSystem from './DeepScanSystem';
import WarpJumpSystem from './WarpJumpSystem';
import CinematicVeil from './CinematicVeil';
import gsap from 'gsap';

export default function SpaceShowcasePage() {
  const [bootComplete, setBootComplete] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('idle');
  const [scanActive, setScanActive] = useState(false);
  const [warpActive, setWarpActive] = useState(false);
  const [nearbyPlanet, setNearbyPlanet] = useState<PlanetData | null>(null);
  const [nearbyDistance, setNearbyDistance] = useState(Infinity);
  const [flightState, setFlightState] = useState<FlightState>({
    velocity: { x: 0, y: 0, z: 0 } as any,
    speed: 0,
    heading: 0,
    pitch: 0,
    isBoosting: false,
  });

  const reducedMotion = useReducedMotion();
  const inputRef = useRef<{
    keys: Set<string>;
    mouse: { dx: number; dy: number };
  }>({ keys: new Set(), mouse: { dx: 0, dy: 0 } });
  const warpTargetRef = useRef<string | null>(null);

  // Dynamic proximity threshold based on current nearest planet
  const proximityThreshold = nearbyPlanet ? nearbyPlanet.size * 2.5 : 5;
  const isInRange = nearbyDistance < proximityThreshold;

  // ---- Keyboard Input Handler ----
  useEffect(() => {
    if (!bootComplete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      inputRef.current.keys.add(e.code);

      // WASD/Arrows are handled by flight system
      // E = interact/scan when in range
      if (e.code === 'KeyE' && isInRange && nearbyPlanet && systemStatus !== 'scanning' && systemStatus !== 'warping') {
        handleDeepScan();
      }
      // F = warp when in range (or always)
      if (e.code === 'KeyF' && systemStatus !== 'warping' && systemStatus !== 'scanning') {
        handleWarpJump();
      }
      // Shift = boost (handled in flight system)
      // Space = brake (handled in flight system)
      // Q = down, R = up (handled in flight system)
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      inputRef.current.keys.delete(e.code);
    };

    // Mouse movement for looking
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        inputRef.current.mouse.dx += e.movementX;
        inputRef.current.mouse.dy += e.movementY;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [bootComplete, isInRange, nearbyPlanet, systemStatus]);

  // ---- Actions ----

  const handleDeepScan = useCallback(() => {
    if (!nearbyPlanet || systemStatus === 'scanning' || systemStatus === 'warping') return;
    setSystemStatus('scanning');
    setScanActive(true);
  }, [nearbyPlanet, systemStatus]);

  const handleScanComplete = useCallback(() => {
    setScanActive(false);
    setSystemStatus('idle');
  }, []);

  const handleWarpJump = useCallback(() => {
    if (systemStatus === 'warping' || systemStatus === 'scanning') return;
    setSystemStatus('warping');
    setWarpActive(true);
  }, [systemStatus]);

  const handleWarpComplete = useCallback((target: PlanetData) => {
    setWarpActive(false);
    setSystemStatus('idle');
    warpTargetRef.current = target.id;
  }, []);

  // ---- Boot ----
  const handleBootComplete = useCallback(() => {
    setBootComplete(true);
    if (!reducedMotion) {
      gsap.fromTo('.cockpit-fade-in', { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out', delay: 0.2 });
    }
  }, [reducedMotion]);

  return (
    <div className="relative w-screen h-screen bg-[#020510] overflow-hidden">
      {!bootComplete && <BootSequence onComplete={handleBootComplete} />}

      <StarfieldBackground />
      <NebulaBackdrop />
      <div className="scan-line-overlay" />

      <div className={`cockpit-fade-in w-full h-full ${bootComplete ? 'opacity-100' : 'opacity-0'}`}>
        {/* === CENTER: 3D First-Person Galaxy === */}
        <GalaxyViewport
          onFlightUpdate={setFlightState}
          onNearbyPlanet={(p, d) => {
            setNearbyPlanet(p);
            setNearbyDistance(d);
          }}
          scanningPlanetId={scanActive ? nearbyPlanet?.id ?? null : null}
          inputRef={inputRef}
          warpTargetRef={warpTargetRef}
        />

        {/* === HUD OVERLAY: Flight Instruments === */}
        <CockpitHUD
          flightState={flightState}
          nearbyPlanet={nearbyPlanet}
          nearbyDistance={nearbyDistance}
          systemStatus={systemStatus}
        />

        <CinematicVeil
          systemStatus={systemStatus}
          nearbyPlanet={nearbyPlanet}
          flightState={flightState}
        />

        {/* === BOTTOM: Simplified Command Deck === */}
        <CommandDeck
          nearbyPlanet={nearbyPlanet}
          nearbyDistance={nearbyDistance}
          systemStatus={systemStatus}
          onDeepScan={handleDeepScan}
          onWarpJump={handleWarpJump}
          flightState={flightState}
        />

        {/* === EFFECTS === */}
        <DeepScanSystem
          active={scanActive}
          planet={nearbyPlanet}
          onComplete={handleScanComplete}
        />
        <WarpJumpSystem
          active={warpActive}
          currentPlanet={nearbyPlanet}
          onComplete={handleWarpComplete}
        />
      </div>

      <CustomCursor />
    </div>
  );
}
