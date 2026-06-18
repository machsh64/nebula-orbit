import { PlanetData } from '../data/types';
import { PLANETS } from '../data/planets';
import { ChevronLeft, ChevronRight, Play, Pause, Scan, Zap, Crosshair } from 'lucide-react';

interface CommandDeckProps {
  selectedPlanet: PlanetData | null;
  lockedPlanet: PlanetData | null;
  systemStatus: string;
  autoOrbit: boolean;
  onSelectPlanet: (p: PlanetData) => void;
  onDeepScan: () => void;
  onWarpJump: () => void;
  onToggleAutoOrbit: () => void;
  onUnlock: () => void;
}

export default function CommandDeck({
  selectedPlanet,
  lockedPlanet,
  systemStatus,
  autoOrbit,
  onSelectPlanet,
  onDeepScan,
  onWarpJump,
  onToggleAutoOrbit,
  onUnlock,
}: CommandDeckProps) {
  const currentIdx = PLANETS.findIndex(p => p.id === (selectedPlanet?.id ?? 'kepler-7x'));

  const nav = (dir: number) => {
    const idx = (currentIdx + dir + PLANETS.length) % PLANETS.length;
    onSelectPlanet(PLANETS[idx]);
  };

  const activePlanet = lockedPlanet || selectedPlanet || PLANETS[0];
  const isScanning = systemStatus === 'scanning';
  const isWarping = systemStatus === 'warping';
  const isLocked = systemStatus === 'locked';

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          background: 'linear-gradient(180deg, rgba(10,14,39,0.9) 0%, rgba(2,5,16,0.95) 100%)',
          border: '1px solid rgba(0,229,255,0.15)',
          borderBottom: '1px solid rgba(0,229,255,0.25)',
          boxShadow: '0 0 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,229,255,0.05)',
          clipPath: 'polygon(6px 0%, 100% 0%, 100% 100%, calc(100% - 6px) 100%, 0% 100%, 0% 6px)',
        }}
      >
        {/* ← Planet Nav → */}
        <button
          onClick={() => nav(-1)}
          className="w-7 h-7 flex items-center justify-center hover:bg-white/5 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
          data-hoverable
        >
          <ChevronLeft size={14} />
        </button>

        <div className="flex items-center gap-1 px-2">
          {PLANETS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => onSelectPlanet(p)}
              className="w-2.5 h-2.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i === currentIdx ? p.glowColor : 'rgba(255,255,255,0.12)',
                boxShadow: i === currentIdx ? `0 0 6px ${p.glowColor}` : 'none',
                transform: i === currentIdx ? 'scale(1.2)' : 'scale(1)',
              }}
              data-hoverable
            />
          ))}
        </div>

        <button
          onClick={() => nav(1)}
          className="w-7 h-7 flex items-center justify-center hover:bg-white/5 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
          data-hoverable
        >
          <ChevronRight size={14} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Lock indicator */}
        {isLocked && (
          <>
            <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: `${activePlanet.glowColor}10`, border: `1px solid ${activePlanet.glowColor}20` }}>
              <Crosshair size={12} style={{ color: activePlanet.glowColor }} />
              <span className="font-mono text-[9px] tracking-wider" style={{ color: activePlanet.glowColor }}>
                LOCKED
              </span>
            </div>
            <button
              onClick={onUnlock}
              className="px-2 py-1 rounded font-mono text-[9px] text-white/30 hover:text-white/50 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              data-hoverable
            >
              ESC
            </button>
            <div className="w-px h-6 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </>
        )}

        {/* Auto Orbit */}
        <button
          onClick={onToggleAutoOrbit}
          className="flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] font-bold transition-all"
          style={{
            background: autoOrbit ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${autoOrbit ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
            color: autoOrbit ? '#00e5ff' : 'rgba(255,255,255,0.3)',
          }}
          data-hoverable
        >
          {autoOrbit ? <Pause size={11} /> : <Play size={11} />}
          AUTO
        </button>

        {/* Deep Scan */}
        <button
          onClick={onDeepScan}
          disabled={isScanning || isWarping || !lockedPlanet}
          className="flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] font-bold transition-all"
          style={{
            background: isScanning ? 'rgba(179,136,255,0.2)' : 'rgba(179,136,255,0.08)',
            border: `1px solid ${isScanning ? 'rgba(179,136,255,0.5)' : 'rgba(179,136,255,0.2)'}`,
            color: isScanning ? '#b388ff' : 'rgba(179,136,255,0.7)',
            opacity: (!lockedPlanet || isWarping) ? 0.3 : 1,
          }}
          data-hoverable
        >
          <Scan size={11} />
          SCAN
        </button>

        {/* Warp */}
        <button
          onClick={onWarpJump}
          disabled={isWarping || isScanning}
          className="flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] font-bold transition-all"
          style={{
            background: isWarping ? 'rgba(255,64,129,0.2)' : 'rgba(255,64,129,0.08)',
            border: `1px solid ${isWarping ? 'rgba(255,64,129,0.5)' : 'rgba(255,64,129,0.2)'}`,
            color: isWarping ? '#ff4081' : 'rgba(255,64,129,0.7)',
            opacity: isScanning ? 0.3 : 1,
          }}
          data-hoverable
        >
          <Zap size={11} />
          WARP
        </button>

        {/* Current target name */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: activePlanet.glowColor }} />
          <span className="font-mono text-[9px] text-white/25 tracking-wider">
            {activePlanet.name}
          </span>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="flex justify-center gap-3 mt-1.5">
        {[
          ['← →', 'TARGET'],
          ['SPACE', 'SCAN'],
          ['W', 'WARP'],
          ['ESC', 'UNLOCK'],
        ].map(([key, label]) => (
          <div key={key} className="text-center">
            <span className="font-mono text-[7px] text-white/10 px-1 py-0.5 rounded" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              {key}
            </span>
            <span className="font-mono text-[7px] text-white/15 ml-1">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
