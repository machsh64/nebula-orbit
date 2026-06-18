import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetData } from '../data/types';
import PlanetObject from './PlanetObject';

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

export default function OrbitSystem({
  planets,
  lockedPlanetId,
  scanningPlanetId,
  targetedPlanetId,
  onPlanetClick,
  onPlanetHover,
}: OrbitSystemProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [planetAngles, setPlanetAngles] = useState<Map<string, number>>(new Map());

  // Initialize random starting angles
  useEffect(() => {
    const angles = new Map<string, number>();
    planets.forEach(p => angles.set(p.id, Math.random() * Math.PI * 2));
    setPlanetAngles(angles);
  }, [planets]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    setPlanetAngles(prev => {
      const next = new Map(prev);
      planets.forEach(p => {
        const current = next.get(p.id) ?? 0;
        next.set(p.id, current + delta * p.orbitSpeed * 0.5);
      });
      return next;
    });
  });

  return (
    <group ref={groupRef}>
      {/* Central energy core */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial color="#b388ff" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.0, 16, 16]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.06} depthWrite={false} />
      </mesh>

      {/* Central core pulse */}
      <pointLight color="#00e5ff" intensity={2} distance={20} />

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
      {planets.map(p => {
        const angle = planetAngles.get(p.id) ?? 0;
        const x = Math.cos(angle) * p.orbitRadius;
        const z = Math.sin(angle) * p.orbitRadius;
        const y = Math.sin(angle) * p.orbitInclination * 2;
        const pos = new THREE.Vector3(x, y, z);

        return (
          <PlanetObject
            key={p.id}
            planet={p}
            position={pos}
            isLocked={lockedPlanetId === p.id}
            isScanning={scanningPlanetId === p.id}
            isTargeted={targetedPlanetId === p.id}
            onClick={() => onPlanetClick(p)}
            onPointerOver={() => onPlanetHover(p)}
            onPointerOut={() => onPlanetHover(null)}
          />
        );
      })}
    </group>
  );
}
