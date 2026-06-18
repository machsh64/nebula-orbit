import { PlanetData, SystemStatus } from '../data/types';
import { Scan, Zap, Crosshair } from 'lucide-react';
import { FlightState } from './GalaxyViewport';

interface CommandDeckProps {
  nearbyPlanet: PlanetData | null;
  nearbyDistance: number;
  systemStatus: SystemStatus;
  onDeepScan: () => void;
  onWarpJump: () => void;
  flightState: FlightState;
}

export default function CommandDeck({
  nearbyPlanet, nearbyDistance, systemStatus,
  onDeepScan, onWarpJump, flightState,
}: CommandDeckProps) {
  const isScanning = systemStatus === 'scanning';
  const isWarping = systemStatus === 'warping';
  const proximityThreshold = nearbyPlanet ? nearbyPlanet.size * 2.5 : 5;
  const isInRange = nearbyDistance < proximityThreshold;

  return (
    <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="flex items-center gap-2 px-4 py-2" style={{
        background: 'linear-gradient(180deg, rgba(10,14,39,0.9) 0%, rgba(2,5,16,0.95) 100%)',
        border: '1px solid rgba(0,229,255,0.12)',
        borderBottom: '1px solid rgba(0,229,255,0.2)',
        boxShadow: '0 0 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,229,255,0.05)',
        clipPath: 'polygon(6px 0%, 100% 0%, 100% 100%, calc(100% - 6px) 100%, 0% 100%, 0% 6px)',
      }}>
        {/* Proximity status */}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{
            backgroundColor: isInRange ? '#ffd740' : '#00e5ff',
          }} />
          <span className="font-mono text-[9px] text-white/40">
            {isInRange ? 'IN RANGE' : isWarping ? 'JUMPING' : 'CRUISING'}
          </span>
        </div>

        <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Nearby planet */}
        {nearbyPlanet && (
          <>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{
              background: `${nearbyPlanet.glowColor}10`,
              border: `1px solid ${nearbyPlanet.glowColor}20`,
            }}>
              <Crosshair size={11} style={{ color: nearbyPlanet.glowColor }} />
              <span className="font-mono text-[9px] tracking-wider" style={{ color: nearbyPlanet.glowColor }}>
                {nearbyPlanet.name}
              </span>
              <span className="font-mono text-[8px] text-white/20 ml-1">{nearbyDistance.toFixed(1)} AU</span>
            </div>
            <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </>
        )}

        {/* Scan button */}
        <button
          onClick={onDeepScan}
          disabled={isScanning || isWarping || !isInRange}
          className="flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[9px] font-bold transition-all"
          style={{
            background: isScanning ? 'rgba(179,136,255,0.2)' : 'rgba(179,136,255,0.08)',
            border: `1px solid ${isScanning ? 'rgba(179,136,255,0.5)' : 'rgba(179,136,255,0.2)'}`,
            color: isScanning ? '#b388ff' : 'rgba(179,136,255,0.7)',
            opacity: (!isInRange || isWarping) ? 0.3 : 1,
          }}
          data-hoverable
        >
          <Scan size={11} />
          [E] SCAN
        </button>

        {/* Warp button */}
        <button
          onClick={onWarpJump}
          disabled={isWarping || isScanning}
          className="flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[9px] font-bold transition-all"
          style={{
            background: isWarping ? 'rgba(255,64,129,0.2)' : 'rgba(255,64,129,0.08)',
            border: `1px solid ${isWarping ? 'rgba(255,64,129,0.5)' : 'rgba(255,64,129,0.2)'}`,
            color: isWarping ? '#ff4081' : 'rgba(255,64,129,0.7)',
            opacity: isScanning ? 0.3 : 1,
          }}
          data-hoverable
        >
          <Zap size={11} />
          [F] WARP
        </button>

        {/* Boost indicator */}
        <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

        <span className="font-mono text-[8px] text-white/20">
          SHIFT:BOOST · Q/E:UP/DN · SPACE:BRAKE · CLICK TO STEER
        </span>
      </div>
    </div>
  );
}
