import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetData } from '../data/types';
import PlanetObject from './PlanetObject';
import { getPlanetOrbitPosition } from '../utils/orbits';

interface OrbitSystemProps {
  planets: PlanetData[];
  lockedPlanetId: string | null;
  scanningPlanetId: string | null;
  targetedPlanetId: string | null;
  onPlanetClick: (planet: PlanetData) => void;
  onPlanetHover: (planet: PlanetData | null) => void;
}

// Orbit path component
function OrbitPath({ radius, inclination, color }: { radius: number; inclination: number; color: string }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * inclination * 2, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius, inclination]);

  return (
    <Line points={points} color={color} transparent opacity={0.15} depthWrite={false} lineWidth={0.5} />
  );
}

function PlanetOrbitalBody({
  planet,
  lockedPlanetId,
  scanningPlanetId,
  targetedPlanetId,
  onPlanetClick,
  onPlanetHover,
}: {
  planet: PlanetData;
  lockedPlanetId: string | null;
  scanningPlanetId: string | null;
  targetedPlanetId: string | null;
  onPlanetClick: (planet: PlanetData) => void;
  onPlanetHover: (planet: PlanetData | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(getPlanetOrbitPosition(planet, clock.elapsedTime));
  });

  return (
    <group ref={groupRef}>
      <PlanetObject
        planet={planet}
        position={origin}
        isLocked={lockedPlanetId === planet.id}
        isScanning={scanningPlanetId === planet.id}
        isTargeted={targetedPlanetId === planet.id}
        onClick={() => onPlanetClick(planet)}
        onPointerOver={() => onPlanetHover(planet)}
        onPointerOut={() => onPlanetHover(null)}
      />
    </group>
  );
}

export default function OrbitSystem({
  planets,
  lockedPlanetId,
  scanningPlanetId,
  targetedPlanetId,
  onPlanetClick,
  onPlanetHover,
}: OrbitSystemProps) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      {/* Orbit paths */}
      {planets.map(p => (
        <OrbitPath key={`orbit-${p.id}`} radius={p.orbitRadius} inclination={p.orbitInclination} color={p.glowColor} />
      ))}

      {/* Grid ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[50, 50.15, 128]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.04} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[25, 25.08, 128]} />
        <meshBasicMaterial color="#b388ff" transparent opacity={0.04} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Planets */}
      {planets.map(p => (
        <PlanetOrbitalBody
          key={p.id}
          planet={p}
          lockedPlanetId={lockedPlanetId}
          scanningPlanetId={scanningPlanetId}
          targetedPlanetId={targetedPlanetId}
          onPlanetClick={onPlanetClick}
          onPlanetHover={onPlanetHover}
        />
      ))}
    </group>
  );
}
