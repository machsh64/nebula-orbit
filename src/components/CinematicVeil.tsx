import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { PlanetData, SystemStatus } from '../data/types';
import { ART_DIRECTION, CONSTELLATION_VERSES } from '../data/artDirection';
import { FlightState } from './GalaxyViewport';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface CinematicVeilProps {
  systemStatus: SystemStatus;
  nearbyPlanet: PlanetData | null;
  flightState: FlightState;
}

export default function CinematicVeil({ systemStatus, nearbyPlanet, flightState }: CinematicVeilProps) {
  const [verseIndex, setVerseIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setVerseIndex(index => (index + 1) % CONSTELLATION_VERSES.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const verse = useMemo(() => {
    if (systemStatus === 'warping') return CONSTELLATION_VERSES[4];
    if (systemStatus === 'scanning') return CONSTELLATION_VERSES[2];
    if (nearbyPlanet) {
      const index = nearbyPlanet.resourceSignal > 88 ? 3 : nearbyPlanet.threatLevel === 'EXTREME' ? 4 : 1;
      return CONSTELLATION_VERSES[index];
    }
    return CONSTELLATION_VERSES[verseIndex];
  }, [nearbyPlanet, systemStatus, verseIndex]);

  const speedTone = Math.min(1, flightState.speed / 75);
  const accent = nearbyPlanet?.glowColor ?? verse.accent;

  return (
    <div
      className={`cinematic-veil status-${systemStatus}`}
      style={{
        '--veil-accent': accent,
        '--speed-tone': speedTone,
      } as CSSProperties}
      aria-hidden="true"
    >
      <div className="lens-vignette" />
      <div className="chromatic-rim chromatic-rim-left" />
      <div className="chromatic-rim chromatic-rim-right" />
      <div className="aurora-wash aurora-wash-a" />
      <div className="aurora-wash aurora-wash-b" />

      <div className="atelier-title">
        <span>{ART_DIRECTION.callsign}</span>
        <span>{nearbyPlanet ? nearbyPlanet.name : 'NEBULA ORBIT'}</span>
      </div>

      <div className="verse-plate">
        <span className="verse-mark">NO.{String(verseIndex + 1).padStart(2, '0')}</span>
        <span className="verse-text">{verse.text}</span>
      </div>

      <div className="spectral-readout">
        {[ART_DIRECTION.palette.cyan, ART_DIRECTION.palette.amber, ART_DIRECTION.palette.magenta, ART_DIRECTION.palette.aurora, ART_DIRECTION.palette.ultraviolet].map((color, index) => (
          <span
            key={color}
            style={{
              backgroundColor: color,
              transform: `scaleY(${0.34 + speedTone * 0.72 + index * 0.08})`,
              opacity: 0.35 + speedTone * 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}
