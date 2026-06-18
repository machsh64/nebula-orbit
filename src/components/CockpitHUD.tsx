import { useState, useEffect } from 'react';
import { PlanetData } from '../data/types';
import { PLANETS, TERMINAL_LOGS } from '../data/planets';
import { Crosshair, Radio, Wifi, Activity, Zap } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface CockpitHUDProps {
  lockedPlanet: PlanetData | null;
  targetedPlanet: PlanetData | null;
  hoveredPlanet: PlanetData | null;
  systemStatus: string;
  cameraZoom: number;
  onSelectPlanet: (planet: PlanetData) => void;
  onDeepScan: () => void;
  onWarpJump: () => void;
  onUnlock: () => void;
}

function CornerFrame({ position, children }: { position: string; children: React.ReactNode }) {
  const posClass = position === 'tl' ? 'top-3 left-3' :
    position === 'tr' ? 'top-3 right-3' :
    position === 'bl' ? 'bottom-3 left-3' :
    'bottom-3 right-3';

  return (
    <div className={`fixed ${posClass} z-30 pointer-events-none`}>
      {children}
    </div>
  );
}

// Angular HUD panel with scanlines and mechanical borders
function HUDPanel({
  children,
  className = '',
  glowColor = '#00e5ff',
  pointerEvents = false,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  pointerEvents?: boolean;
}) {
  return (
    <div
      className={`${pointerEvents ? 'pointer-events-auto' : ''} ${className}`}
      style={{
        background: `linear-gradient(135deg, rgba(2,5,16,0.85) 0%, rgba(10,14,39,0.7) 50%, rgba(2,5,16,0.85) 100%)`,
        border: `1px solid ${glowColor}25`,
        borderTop: `1px solid ${glowColor}40`,
        borderLeft: `1px solid ${glowColor}30`,
        boxShadow: `inset 0 0 30px rgba(0,0,0,0.5), 0 0 15px ${glowColor}08`,
        clipPath: `polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)`,
        position: 'relative',
      }}
    >
      {/* Corner accent lines */}
      <div className="absolute top-0 left-2 w-4 h-[1px]" style={{ background: glowColor, opacity: 0.5 }} />
      <div className="absolute top-2 left-0 w-[1px] h-4" style={{ background: glowColor, opacity: 0.5 }} />
      <div className="absolute top-0 right-2 w-4 h-[1px]" style={{ background: glowColor, opacity: 0.5 }} />
      <div className="absolute top-2 right-0 w-[1px] h-4" style={{ background: glowColor, opacity: 0.5 }} />
      <div className="absolute bottom-0 left-2 w-4 h-[1px]" style={{ background: glowColor, opacity: 0.5 }} />
      <div className="absolute bottom-2 left-0 w-[1px] h-4" style={{ background: glowColor, opacity: 0.5 }} />
      <div className="absolute bottom-0 right-2 w-4 h-[1px]" style={{ background: glowColor, opacity: 0.5 }} />
      <div className="absolute bottom-2 right-0 w-[1px] h-4" style={{ background: glowColor, opacity: 0.5 }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function CockpitHUD({
  lockedPlanet,
  targetedPlanet,
  hoveredPlanet,
  systemStatus,
  cameraZoom,
  onSelectPlanet,
  onDeepScan,
  onWarpJump,
  onUnlock,
}: CockpitHUDProps) {
  const [coords, setCoords] = useState({ ra: '18h 36m 56s', dec: '+38° 47′ 12″', signal: '98.7' });
  const [terminalIdx, setTerminalIdx] = useState(0);
  const [time, setTime] = useState('');
  const reducedMotion = useReducedMotion();

  // Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  // Terminal log cycling
  useEffect(() => {
    if (reducedMotion) return;
    const i = setInterval(() => setTerminalIdx(prev => (prev + 1) % TERMINAL_LOGS.length), 2500);
    return () => clearInterval(i);
  }, [reducedMotion]);

  // Coordinate flicker
  useEffect(() => {
    if (reducedMotion) return;
    const i = setInterval(() => {
      setCoords({
        ra: `18h ${36 + Math.floor(Math.random() * 3)}m ${50 + Math.floor(Math.random() * 10)}s`,
        dec: `+38° ${47 + Math.floor(Math.random() * 3)}′ ${Math.floor(Math.random() * 60)}″`,
        signal: `${(95 + Math.random() * 5).toFixed(1)}`,
      });
    }, 1200);
    return () => clearInterval(i);
  }, [reducedMotion]);

  const statusColor =
    systemStatus === 'scanning' ? '#ffd740' :
    systemStatus === 'locked' ? '#69f0ae' :
    systemStatus === 'warping' ? '#ff4081' :
    '#00e5ff';

  return (
    <>
      {/* ===== TOP-LEFT: Coordinates & Status ===== */}
      <CornerFrame position="tl">
        <HUDPanel glowColor="#00e5ff">
          <div className="px-3 py-2 font-mono text-[9px] space-y-1 w-52">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/30 text-[8px] tracking-[0.2em]">NAV DATA</span>
              <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: '#00e5ff' }} />
            </div>
            <div className="flex justify-between">
              <span className="text-white/25">RA</span>
              <span className="text-white/55">{coords.ra}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/25">DEC</span>
              <span className="text-white/55">{coords.dec}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/25">SIG</span>
              <span className="text-[#69f0ae]">{coords.signal}%</span>
            </div>
            <div className="border-t border-white/5 pt-1 mt-1 flex justify-between">
              <span className="text-white/25">Z</span>
              <span className="text-white/45">{cameraZoom.toFixed(1)} AU</span>
            </div>
          </div>
        </HUDPanel>
      </CornerFrame>

      {/* ===== TOP-RIGHT: System Status ===== */}
      <CornerFrame position="tr">
        <HUDPanel glowColor={statusColor}>
          <div className="px-3 py-2 font-mono text-[9px] space-y-1 w-48">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/30 text-[8px] tracking-[0.2em]">SYS STATUS</span>
              <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
            </div>
            <div className="flex items-center gap-2">
              <Wifi size={10} style={{ color: statusColor }} />
              <span className="text-white/50">{systemStatus.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Radio size={10} className="text-white/30" />
              <span className="text-white/35">UPLINK NOMINAL</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={10} className="text-white/30" />
              <span className="text-white/35">Q-ENTANGLEMENT</span>
            </div>
            <div className="border-t border-white/5 pt-1 mt-1 text-[8px] text-white/20">
              {time}
            </div>
          </div>
        </HUDPanel>
      </CornerFrame>

      {/* ===== LEFT: Target List ===== */}
      <div className="fixed left-3 top-1/2 -translate-y-1/2 z-30 pointer-events-auto" style={{ marginTop: -40 }}>
        <HUDPanel glowColor="#b388ff" pointerEvents>
          <div className="px-2 py-2 w-40">
            <div className="text-[8px] font-mono text-white/25 tracking-[0.2em] mb-2 text-center">TARGET LIST</div>
            <div className="space-y-[2px]">
              {PLANETS.map(p => {
                const isActive = lockedPlanet?.id === p.id || targetedPlanet?.id === p.id;
                const isHover = hoveredPlanet?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPlanet(p)}
                    className="w-full text-left px-2 py-1 flex items-center gap-2 group transition-all"
                    style={{
                      background: isActive ? `${p.glowColor}15` : isHover ? `${p.glowColor}08` : 'transparent',
                      borderLeft: isActive ? `2px solid ${p.glowColor}` : '2px solid transparent',
                    }}
                    data-hoverable
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                      backgroundColor: p.glowColor,
                      boxShadow: isActive ? `0 0 6px ${p.glowColor}` : 'none',
                    }} />
                    <span className="font-mono text-[9px] truncate" style={{
                      color: isActive ? p.glowColor : 'rgba(255,255,255,0.45)',
                    }}>
                      {p.name}
                    </span>
                    {isActive && (
                      <Crosshair size={10} style={{ color: p.glowColor }} className="ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </HUDPanel>
      </div>

      {/* ===== RIGHT: Planet Inspector Panel ===== */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-30 pointer-events-auto" style={{ marginTop: -40 }}>
        {lockedPlanet ? (
          <PlanetInspector
            planet={lockedPlanet}
            onUnlock={onUnlock}
            onDeepScan={onDeepScan}
          />
        ) : (
          <HUDPanel glowColor="#00e5ff">
            <div className="px-4 py-4 w-64 text-center">
              <Crosshair size={20} className="text-white/15 mx-auto mb-2" />
              <p className="font-mono text-[10px] text-white/25">NO TARGET LOCKED</p>
              <p className="font-mono text-[8px] text-white/15 mt-1">CLICK A PLANET TO LOCK</p>
            </div>
          </HUDPanel>
        )}
      </div>

      {/* ===== BOTTOM-LEFT: Terminal ===== */}
      <CornerFrame position="bl">
        <HUDPanel glowColor="#00e5ff">
          <div className="px-3 py-2 font-mono w-48">
            <div className="text-[8px] text-white/20 tracking-[0.15em] mb-1">TERMINAL // SECTOR-7G</div>
            <div className="text-[9px] text-[#00e5ff]/45 h-4 overflow-hidden" key={terminalIdx}>
              {TERMINAL_LOGS[terminalIdx]}
            </div>
          </div>
        </HUDPanel>
      </CornerFrame>

      {/* ===== BOTTOM-RIGHT: Minimap ===== */}
      <CornerFrame position="br">
        <RadarMinimap planets={PLANETS} lockedPlanetId={lockedPlanet?.id ?? null} />
      </CornerFrame>
    </>
  );
}

// ---- Sub-components ----

function PlanetInspector({ planet, onUnlock, onDeepScan }: {
  planet: PlanetData;
  onUnlock: () => void;
  onDeepScan: () => void;
}) {
  return (
    <HUDPanel glowColor={planet.glowColor} pointerEvents>
      <div className="px-4 py-3 w-72 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-sm font-bold tracking-[0.1em]" style={{
              color: planet.glowColor,
              textShadow: `0 0 10px ${planet.glowColor}40`,
            }}>
              {planet.name}
            </div>
            <div className="font-mono text-[8px] text-white/30 tracking-wider">{planet.classification}</div>
          </div>
          <button
            onClick={onUnlock}
            className="w-6 h-6 flex items-center justify-center rounded"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}
            data-hoverable
          >
            ✕
          </button>
        </div>

        {/* Target lock indicator */}
        <div className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: `${planet.glowColor}10`, border: `1px solid ${planet.glowColor}20` }}>
          <Crosshair size={12} style={{ color: planet.glowColor }} />
          <span className="font-mono text-[9px] tracking-wider" style={{ color: planet.glowColor }}>
            ORBITAL LOCK ESTABLISHED
          </span>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            ['GRAVITY', planet.gravity],
            ['TEMP', planet.temperature],
            ['ORBIT', planet.orbitalPeriod],
            ['STATUS', planet.discoveryStatus],
          ].map(([label, value]) => (
            <div key={label} className="px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="font-mono text-[7px] text-white/25">{label}</div>
              <div className="font-mono text-[9px] text-white/60 truncate">{value}</div>
            </div>
          ))}
        </div>

        {/* Threat level */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded" style={{
          background: planet.threatLevel === 'EXTREME' ? '#ff408120' :
            planet.threatLevel === 'HIGH' ? '#ff910020' : 'rgba(105,240,174,0.08)',
          border: `1px solid ${planet.threatLevel === 'EXTREME' ? '#ff408140' :
            planet.threatLevel === 'HIGH' ? '#ff910040' : '#69f0ae20'}`
        }}>
          <span className="font-mono text-[9px] text-white/40">THREAT LEVEL</span>
          <span className="font-mono text-[10px] font-bold" style={{
            color: planet.threatLevel === 'EXTREME' ? '#ff4081' :
              planet.threatLevel === 'HIGH' ? '#ff9100' : '#69f0ae'
          }}>
            {planet.threatLevel}
          </span>
        </div>

        {/* Description */}
        <p className="font-mono text-[9px] text-white/35 leading-relaxed">{planet.description}</p>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onDeepScan}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded font-mono text-[9px] font-bold tracking-wider transition-all"
            style={{
              background: `${planet.glowColor}15`,
              border: `1px solid ${planet.glowColor}30`,
              color: planet.glowColor,
            }}
            data-hoverable
          >
            <Zap size={11} />
            DEEP SCAN
          </button>
        </div>
      </div>
    </HUDPanel>
  );
}

function RadarMinimap({ planets, lockedPlanetId }: { planets: PlanetData[]; lockedPlanetId: string | null }) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = PLANETS.reduce((max, p) => Math.max(max, p.orbitRadius), 0);

  return (
    <HUDPanel glowColor="#00e5ff">
      <div className="px-2 py-2">
        <div className="text-[8px] font-mono text-white/20 tracking-[0.15em] text-center mb-1">RADAR</div>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Grid circles */}
          {[0.33, 0.66, 1.0].map(r => (
            <circle key={r} cx={cx} cy={cy} r={cx * r} fill="none" stroke="rgba(0,229,255,0.08)" strokeWidth="0.5" />
          ))}
          {/* Cross */}
          <line x1={cx} y1={0} x2={cx} y2={size} stroke="rgba(0,229,255,0.06)" strokeWidth="0.5" />
          <line x1={0} y1={cy} x2={size} y2={cy} stroke="rgba(0,229,255,0.06)" strokeWidth="0.5" />

          {/* Planet dots */}
          {planets.map(p => {
            const angle = (Date.now() * 0.001 * p.orbitSpeed * 0.5) % (Math.PI * 2);
            const r = (p.orbitRadius / maxR) * cx * 0.85;
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            const isLocked = lockedPlanetId === p.id;

            return (
              <g key={p.id}>
                {isLocked && (
                  <>
                    <circle cx={px} cy={py} r={6} fill="none" stroke={p.glowColor} strokeWidth="0.8" opacity="0.6">
                      <animate attributeName="r" from="6" to="10" dur="1s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="1s" repeatCount="indefinite" />
                    </circle>
                    <line x1={cx} y1={cy} x2={px} y2={py} stroke={p.glowColor} strokeWidth="0.5" opacity="0.4" />
                  </>
                )}
                <circle cx={px} cy={py} r={isLocked ? 4 : 2} fill={p.glowColor} opacity={isLocked ? 0.9 : 0.5} />
              </g>
            );
          })}

          {/* Central core */}
          <circle cx={cx} cy={cy} r={2.5} fill="#00e5ff" opacity="0.8" />
          <circle cx={cx} cy={cy} r={5} fill="none" stroke="#00e5ff" strokeWidth="0.4" opacity="0.3" />
        </svg>
      </div>
    </HUDPanel>
  );
}
