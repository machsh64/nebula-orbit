export interface PlanetData {
  id: string;
  name: string;
  classification: string;
  atmosphere: string;
  gravity: string;
  temperature: string;
  orbitalPeriod: string;
  discoveryStatus: string;
  threatLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  resourceSignal: number; // 0-100
  explorationProgress: number; // 0-100
  // Visual properties
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  glowColor: string;
  size: number; // relative radius
  orbitRadius: number; // in orbit system
  orbitSpeed: number; // deg per second
  ringColor: string;
  hasRings: boolean;
  ringWidth: number;
  description: string;
}

export interface CosmicCoordinate {
  ra: string;
  dec: string;
  signal: string;
}
