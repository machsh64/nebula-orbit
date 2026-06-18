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
  resourceSignal: number;
  explorationProgress: number;
  // Visual
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  glowColor: string;
  size: number;
  orbitRadius: number;
  orbitSpeed: number;
  ringColor: string;
  hasRings: boolean;
  ringWidth: number;
  description: string;
  // 3D orbit inclination offset (radians)
  orbitInclination: number;
  // Scan data — unlocked one by one during deep scan
  scanParams: ScanParam[];
}

export interface ScanParam {
  label: string;
  value: string;
  icon: string; // lucide icon name
}

export type ViewMode = 'orbit' | 'detail' | 'archive';
export type SystemStatus = 'idle' | 'scanning' | 'locked' | 'warping' | 'analyzing';
