import * as THREE from 'three';
import { PlanetData } from '../data/types';

const phaseCache = new Map<string, number>();

export function getStableOrbitPhase(id: string) {
  if (phaseCache.has(id)) return phaseCache.get(id)!;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }

  const phase = (hash / 0xffffffff) * Math.PI * 2;
  phaseCache.set(id, phase);
  return phase;
}

export function getPlanetOrbitPosition(planet: PlanetData, elapsedSeconds: number) {
  const angle = getStableOrbitPhase(planet.id) + elapsedSeconds * planet.orbitSpeed * 0.5;
  return new THREE.Vector3(
    Math.cos(angle) * planet.orbitRadius,
    Math.sin(angle) * planet.orbitInclination * 2,
    Math.sin(angle) * planet.orbitRadius
  );
}
