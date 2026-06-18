import { useState, useEffect } from 'react';
import { PlanetData, SystemStatus } from '../data/types';
import { PLANETS, TERMINAL_LOGS } from '../data/planets';
import { Crosshair, Gauge } from 'lucide-react';
import { FlightState } from './GalaxyViewport';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface CockpitHUDProps {
  flightState: FlightState;
  nearbyPlanet: PlanetData | null;
  nearbyDistance: number;
  systemStatus: SystemStatus;
}

// ---- Angular HUD panel (shared) ----
function HUDPanel({ children, glowColor = '#00e5ff', className = '' }: {
  children: React.ReactNode;
  glowColor?: string;
  className?: string;
}) {
  return (
    <div className={className} style={{
      background: `linear-gradient(135deg, rgba(2,5,16,0.85) 0%, rgba(10,14,39,0.7) 50%, rgba(2,5,16,0.85) 100%)`,
      border: `1px solid ${glowColor}25`,
      borderTop: `1px solid ${glowColor}40`,
      borderLeft: `1px solid ${glowColor}30`,
      boxShadow: `inset 0 0 30px rgba(0,0,0,0.5), 0 0 15px ${glowColor}08`,
      clipPath: 'polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)',
      position: 'relative',
    }}>
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
  flightState, nearbyPlanet, nearbyDistance, systemStatus,
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

  // Terminal
  useEffect(() => {
    if (reducedMotion) return;
    const i = setInterval(() => setTerminalIdx(prev => (prev + 1) % TERMINAL_LOGS.length), 2500);
    return () => clearInterval(i);
  }, [reducedMotion]);

  // Coordinates
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

  const isScanning = systemStatus === 'scanning';
  const isWarping = systemStatus === 'warping';
  const statusColor = isScanning ? '#ffd740' : isWarping ? '#ff4081' : '#00e5ff';
  // Dynamic proximity: bigger planets have wider detection range
  const proximityThreshold = nearbyPlanet ? nearbyPlanet.size * 2.5 : 5;
  const isInRange = nearbyDistance < proximityThreshold;
  const isProximity = nearbyDistance < proximityThreshold * 1.5;

  return (
    <>
      {/* ===== CENTER CROSSHAIR ===== */}
      <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center">
        <div className="relative">
          {/* Crosshair */}
          <div className="w-8 h-8 relative">
            <div className="absolute top-1/2 left-0 right-0 h-[1px]" style={{ background: 'rgba(0,229,255,0.4)' }} />
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px]" style={{ background: 'rgba(0,229,255,0.4)' }} />
          </div>
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#00e5ff]" />
          {/* Range brackets */}
          {isProximity && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ color: isInRange ? '#ffd740' : '#00e5ff' }}>
              <svg width="60" height="60" viewBox="0 0 60 60" className="animate-pulse">
                <line x1="18" y1="30" x2="23" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                <line x1="37" y1="30" x2="42" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                <line x1="30" y1="18" x2="30" y2="23" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                <line x1="30" y1="37" x2="30" y2="42" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* ===== TOP-LEFT: NAV DATA ===== */}
      <div className="fixed top-3 left-3 z-30 pointer-events-none">
        <HUDPanel glowColor="#00e5ff">
          <div className="px-3 py-2 font-mono text-[9px] space-y-1 w-56">
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
              <span className="text-white/25">HDG</span>
              <span className="text-white/50">{((flightState.heading * 180 / Math.PI) % 360).toFixed(0)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/25">PITCH</span>
              <span className="text-white/50">{((flightState.pitch * 180 / Math.PI) % 360).toFixed(0)}°</span>
            </div>
          </div>
        </HUDPanel>
      </div>

      {/* ===== TOP-RIGHT: SYS STATUS ===== */}
      <div className="fixed top-3 right-3 z-30 pointer-events-none">
        <HUDPanel glowColor={statusColor}>
          <div className="px-3 py-2 font-mono text-[9px] space-y-1 w-44">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/30 text-[8px] tracking-[0.2em]">SYS STATUS</span>
              <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
            </div>
            <div className="text-white/50" style={{ color: statusColor }}>
              {systemStatus.toUpperCase()}
            </div>
            <div className="flex items-center gap-2 text-white/35">
              <Gauge size={10} />
              <span>THRUST {flightState.isBoosting ? 'BOOST' : 'NOMINAL'}</span>
            </div>
            <div className="border-t border-white/5 pt-1 mt-1 text-[8px] text-white/20">
              {time}
            </div>
          </div>
        </HUDPanel>
      </div>

      {/* ===== LEFT: PROXIMITY MONITOR ===== */}
      <div className="fixed left-3 top-1/2 -translate-y-1/2 z-30 pointer-events-none" style={{ marginTop: -40 }}>
        <HUDPanel glowColor={isInRange ? '#ffd740' : '#00e5ff'}>
          <div className="px-3 py-2 w-44">
            <div className="text-[8px] font-mono text-white/25 tracking-[0.2em] text-center mb-2">
              PROXIMITY SCAN
            </div>
            {/* Planet proximity list */}
            <div className="space-y-1">
              {PLANETS.map(p => (
                <ProximityBar
                  key={p.id}
                  planet={p}
                  distance={p.id === nearbyPlanet?.id ? nearbyDistance : Infinity}
                />
              ))}
            </div>
            {/* Distance readout */}
            {nearbyPlanet && (
              <div className="mt-2 pt-2 border-t border-white/5 text-center">
                <div className="text-[8px] text-white/20">NEAREST: {nearbyPlanet.name}</div>
                <div className="font-mono text-[10px] font-bold mt-0.5" style={{
                  color: isInRange ? '#ffd740' : '#00e5ff',
                  textShadow: isInRange ? '0 0 8px rgba(255,215,64,0.4)' : 'none',
                }}>
                  {nearbyDistance.toFixed(1)} AU
                </div>
                {isInRange && (
                  <div className="text-[7px] text-[#ffd740] animate-pulse mt-0.5 tracking-wider">
                    PRESS [E] TO SCAN
                  </div>
                )}
              </div>
            )}
          </div>
        </HUDPanel>
      </div>

      {/* ===== RIGHT: TARGET INFO (when in range) ===== */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-30 pointer-events-none" style={{ marginTop: -40 }}>
        {nearbyPlanet && isProximity ? (
          <HUDPanel glowColor={nearbyPlanet.glowColor}>
            <div className="px-3 py-3 w-64 space-y-2">
              <div className="flex items-center gap-2">
                <Crosshair size={14} style={{ color: nearbyPlanet.glowColor }} />
                <div>
                  <div className="font-mono text-xs font-bold tracking-[0.1em]" style={{
                    color: nearbyPlanet.glowColor,
                    textShadow: `0 0 8px ${nearbyPlanet.glowColor}40`,
                  }}>
                    {nearbyPlanet.name}
                  </div>
                  <div className="font-mono text-[8px] text-white/30">{nearbyPlanet.classification}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  ['GRAVITY', nearbyPlanet.gravity],
                  ['TEMP', nearbyPlanet.temperature],
                  ['ORBIT', nearbyPlanet.orbitalPeriod],
                  ['THREAT', nearbyPlanet.threatLevel],
                ].map(([label, value]) => (
                  <div key={label} className="px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="font-mono text-[6px] text-white/25">{label}</div>
                    <div className="font-mono text-[8px] text-white/55 truncate">{value}</div>
                  </div>
                ))}
              </div>
              {isScanning && (
                <div className="text-[8px] font-mono text-[#ffd740] animate-pulse tracking-wider text-center">
                  SCANNING...
                </div>
              )}
            </div>
          </HUDPanel>
        ) : (
          <HUDPanel glowColor="#00e5ff">
            <div className="px-4 py-4 w-48 text-center">
              <svg width="32" height="32" viewBox="0 0 32 32" className="mx-auto mb-2 opacity-15">
                <circle cx="16" cy="16" r="14" fill="none" stroke="#00e5ff" strokeWidth="1" />
                <circle cx="16" cy="16" r="6" fill="none" stroke="#00e5ff" strokeWidth="0.5" />
                <circle cx="16" cy="16" r="2" fill="#00e5ff" opacity="0.3" />
              </svg>
              <p className="font-mono text-[10px] text-white/20">APPROACH A PLANET</p>
              <p className="font-mono text-[8px] text-white/10 mt-1">TO VIEW DETAILS</p>
            </div>
          </HUDPanel>
        )}
      </div>

      {/* ===== BOTTOM-LEFT: TERMINAL ===== */}
      <div className="fixed bottom-3 left-3 z-30 pointer-events-none">
        <HUDPanel glowColor="#00e5ff">
          <div className="px-3 py-1.5 font-mono w-52">
            <div className="text-[7px] text-white/20 tracking-[0.15em] mb-0.5">TERMINAL // SECTOR-7G</div>
            <div className="text-[9px] text-[#00e5ff]/45 h-3.5 overflow-hidden" key={terminalIdx}>
              {TERMINAL_LOGS[terminalIdx]}
            </div>
          </div>
        </HUDPanel>
      </div>

      {/* ===== BOTTOM-RIGHT: RADAR ===== */}
      <div className="fixed bottom-3 right-3 z-30 pointer-events-none">
        <RadarMinimap planets={PLANETS} nearbyPlanetId={nearbyPlanet?.id ?? null} heading={flightState.heading} />
      </div>

      {/* ===== BOTTOM: SPEED & PITCH LADDER (centered, very subtle) ===== */}
      <SpeedIndicator speed={flightState.speed} isBoosting={flightState.isBoosting} maxSpeed={30} boostMult={2.5} />
    </>
  );
}

// ---- Proximity bar for each planet ----
function ProximityBar({ planet, distance }: { planet: PlanetData; distance: number }) {
  const maxDist = 30;
  const proxThreshold = planet.size * 2.5;
  const pct = Math.max(0, Math.min(100, ((maxDist - distance) / maxDist) * 100));
  const isClose = distance < proxThreshold;

  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
        backgroundColor: planet.glowColor,
        boxShadow: isClose ? `0 0 6px ${planet.glowColor}` : 'none',
      }} />
      <span className="font-mono text-[8px] w-20 truncate text-white/40">{planet.name}</span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="h-full rounded-full transition-all duration-300" style={{
          width: `${isClose ? pct : Math.max(0, pct * 0.3)}%`,
          background: isClose ? planet.glowColor : `${planet.glowColor}40`,
          boxShadow: isClose ? `0 0 4px ${planet.glowColor}60` : 'none',
        }} />
      </div>
    </div>
  );
}

// ---- Speed Indicator ----
function SpeedIndicator({ speed, isBoosting, maxSpeed, boostMult }: {
  speed: number; isBoosting: boolean; maxSpeed: number; boostMult: number;
}) {
  const effectiveMax = maxSpeed * boostMult;
  const pct = Math.min(100, (speed / effectiveMax) * 100);
  const color = isBoosting ? '#ff4081' : '#00e5ff';

  return (
    <div className="fixed bottom-[4.5rem] left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="flex items-center gap-2">
        <div className="flex items-end h-8 gap-[1px]">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-1 rounded-t transition-all duration-100" style={{
              height: `${4 + Math.random() * 0.1}px`,
              background: pct > i * 5 ? color : 'rgba(255,255,255,0.06)',
              boxShadow: pct > i * 5 ? `0 0 4px ${color}80` : 'none',
            }} />
          ))}
        </div>
        <div className="text-right">
          <div className="font-mono text-[11px] font-bold" style={{ color }}>{speed.toFixed(1)}</div>
          <div className="font-mono text-[7px] text-white/20">M.U./s</div>
        </div>
      </div>
    </div>
  );
}

// ---- Radar Minimap ----
function RadarMinimap({ planets, nearbyPlanetId, heading }: {
  planets: PlanetData[];
  nearbyPlanetId: string | null;
  heading: number;
}) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = PLANETS.reduce((max, p) => Math.max(max, p.orbitRadius), 0);

  return (
    <HUDPanel glowColor="#00e5ff">
      <div className="px-2 py-2">
        <div className="text-[8px] font-mono text-white/20 tracking-[0.15em] text-center mb-1">RADAR</div>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {[0.33, 0.66, 1.0].map(r => (
            <circle key={r} cx={cx} cy={cy} r={cx * r} fill="none" stroke="rgba(0,229,255,0.06)" strokeWidth="0.5" />
          ))}
          <line x1={cx} y1={0} x2={cx} y2={size} stroke="rgba(0,229,255,0.04)" strokeWidth="0.5" />
          <line x1={0} y1={cy} x2={size} y2={cy} stroke="rgba(0,229,255,0.04)" strokeWidth="0.5" />

          {/* Heading indicator */}
          <g transform={`rotate(${(-heading * 180 / Math.PI) % 360}, ${cx}, ${cy})`}>
            <line x1={cx} y1={cy} x2={cx} y2={cy - cx * 0.9} stroke="#00e5ff" strokeWidth="0.6" opacity="0.3" />
          </g>

          {/* Planets */}
          {planets.map(p => {
            const angle = (Date.now() * 0.001 * p.orbitSpeed * 0.5) % (Math.PI * 2);
            const r = (p.orbitRadius / maxR) * cx * 0.85;
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            const isNearby = nearbyPlanetId === p.id;

            return (
              <g key={p.id}>
                {isNearby && (
                  <>
                    <circle cx={px} cy={py} r={5} fill="none" stroke={p.glowColor} strokeWidth="0.6" opacity="0.5">
                      <animate attributeName="r" from="5" to="8" dur="0.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.5" to="0" dur="0.8s" repeatCount="indefinite" />
                    </circle>
                    <line x1={cx} y1={cy} x2={px} y2={py} stroke={p.glowColor} strokeWidth="0.4" opacity="0.3" />
                  </>
                )}
                <circle cx={px} cy={py} r={isNearby ? 3.5 : 1.8} fill={p.glowColor} opacity={isNearby ? 0.9 : 0.4} />
              </g>
            );
          })}

          <circle cx={cx} cy={cy} r={2.5} fill="#00e5ff" opacity="0.7" />
        </svg>
      </div>
    </HUDPanel>
  );
}
