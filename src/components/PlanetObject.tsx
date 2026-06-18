import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlanetData } from '../data/types';

interface PlanetObjectProps {
  planet: PlanetData;
  position: THREE.Vector3;
  isLocked: boolean;
  isScanning: boolean;
  isTargeted: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

// Generate procedural planet texture (cached)
const textureCache = new Map<string, THREE.CanvasTexture>();

function createRng(seedText: string) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }

  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const value = Number.parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getPlanetTexture(planet: PlanetData): THREE.CanvasTexture {
  const key = planet.id;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const rng = createRng(planet.id);
  const size = 384;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Clip circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.clip();

  // Base gradient
  const r1 = size / 2;
  const grad = ctx.createRadialGradient(size * 0.35, size * 0.3, r1 * 0.05, size / 2, size / 2, r1);
  grad.addColorStop(0, planet.tertiaryColor);
  grad.addColorStop(0.35, planet.primaryColor);
  grad.addColorStop(0.8, planet.secondaryColor);
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Painterly meridians, tuned per planet but stable by id.
  for (let i = 0; i < 22; i++) {
    const y = size * (0.08 + rng() * 0.84);
    const wave = (rng() - 0.5) * size * 0.18;
    const alpha = 0.045 + rng() * 0.075;
    ctx.beginPath();
    ctx.moveTo(size * -0.08, y);
    ctx.bezierCurveTo(
      size * 0.24,
      y + wave,
      size * 0.62,
      y - wave * 0.6,
      size * 1.08,
      y + wave * 0.35
    );
    ctx.lineWidth = size * (0.002 + rng() * 0.006);
    ctx.strokeStyle = hexToRgba(i % 2 === 0 ? planet.tertiaryColor : planet.glowColor, alpha);
    ctx.stroke();
  }

  // Bands for gas giants
  const bandCount = planet.id === 'aether-9' ? 14 : planet.classification.includes('Ice') ? 8 : 0;
  for (let i = 0; i < bandCount; i++) {
    const y = size * 0.1 + (size * 0.8 * i) / bandCount;
    const h = size * 0.04 + rng() * size * 0.04;
    ctx.beginPath();
    ctx.ellipse(size / 2, y, size / 2, h, 0, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? `rgba(255,255,255,${0.04 + rng() * 0.06})` : `rgba(0,0,0,${0.06 + rng() * 0.1})`;
    ctx.fill();
  }

  // Craters for rocky planets
  if (planet.classification.includes('Lava') || planet.classification.includes('Rogue') || planet.classification.includes('Terran')) {
    for (let i = 0; i < 25; i++) {
      const cx = size / 2 + (rng() - 0.5) * size * 0.85;
      const cy = size / 2 + (rng() - 0.5) * size * 0.85;
      const cr = size * 0.015 + rng() * size * 0.05;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${0.1 + rng() * 0.2})`;
      ctx.fill();
      // Rim highlight
      ctx.beginPath();
      ctx.arc(cx + cr * 0.2, cy - cr * 0.2, cr * 0.85, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.03 + rng() * 0.05})`;
      ctx.fill();
    }
  }

  // Lava fissures, ice fractures, or ocean currents.
  const fissureCount = planet.classification.includes('Lava') ? 18 : planet.classification.includes('Ice') ? 16 : 10;
  for (let i = 0; i < fissureCount; i++) {
    const sx = size * (0.18 + rng() * 0.64);
    const sy = size * (0.18 + rng() * 0.64);
    const len = size * (0.08 + rng() * 0.18);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(
      sx + (rng() - 0.5) * len,
      sy + (rng() - 0.5) * len,
      sx + (rng() - 0.5) * len * 1.8,
      sy + (rng() - 0.5) * len * 1.8
    );
    ctx.lineWidth = planet.classification.includes('Lava') ? 1.5 : 0.8;
    ctx.strokeStyle = hexToRgba(planet.classification.includes('Lava') ? '#ffd740' : planet.tertiaryColor, planet.classification.includes('Lava') ? 0.28 : 0.14);
    ctx.stroke();
  }

  // A soft painted terminator gives each body more sculpture.
  const terminator = ctx.createLinearGradient(0, 0, size, size);
  terminator.addColorStop(0, 'rgba(255,255,255,0.16)');
  terminator.addColorStop(0.45, 'rgba(255,255,255,0.02)');
  terminator.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = terminator;
  ctx.fillRect(0, 0, size, size);

  // Surface noise
  const imageData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (rng() - 0.5) * 16;
    imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i] + noise));
    imageData.data[i + 1] = Math.min(255, Math.max(0, imageData.data[i + 1] + noise));
    imageData.data[i + 2] = Math.min(255, Math.max(0, imageData.data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  textureCache.set(key, tex);
  return tex;
}

export default function PlanetObject({
  planet,
  position,
  isLocked,
  isScanning,
  isTargeted,
  onClick,
  onPointerOver,
  onPointerOut,
}: PlanetObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lockRingRef = useRef<THREE.Mesh>(null);
  const secondaryLockRingRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => getPlanetTexture(planet), [planet]);

  // Ring geometry
  const ringGeo = useMemo(() => {
    if (!planet.hasRings) return null;
    const g = new THREE.RingGeometry(planet.size * 1.4, planet.size * 2.0, 128);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const t = (dist - planet.size * 1.4) / (planet.size * 0.6);
      uv.setXY(i, t, 0.5);
    }
    return g;
  }, [planet]);

  const ringMat = useMemo(() => {
    if (!planet.hasRings) return null;
    return new THREE.MeshBasicMaterial({
      color: planet.ringColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
  }, [planet]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (planet.orbitSpeed * 2);

      // Locked glow pulse
      if (isLocked || isTargeted) {
        const s = 1 + Math.sin(Date.now() * 0.005) * 0.05;
        meshRef.current.scale.setScalar(s);
      }
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.15;
    }
    if (lockRingRef.current) {
      const v = isLocked ? 1 : isTargeted ? 0.5 : 0;
      const targetOp = v;
      const currOp = (lockRingRef.current.material as THREE.MeshBasicMaterial).opacity;
      (lockRingRef.current.material as THREE.MeshBasicMaterial).opacity += (targetOp - currOp) * 0.1;
      if (v > 0) {
        lockRingRef.current.rotation.z += delta * 1.5;
      }
    }
    if (secondaryLockRingRef.current) {
      const v = isLocked ? 0.75 : isTargeted ? 0.35 : 0;
      const currOp = (secondaryLockRingRef.current.material as THREE.MeshBasicMaterial).opacity;
      (secondaryLockRingRef.current.material as THREE.MeshBasicMaterial).opacity += (v - currOp) * 0.1;
      if (v > 0) {
        secondaryLockRingRef.current.rotation.z -= delta * 1.1;
      }
    }
    if (glowRef.current) {
      const pulse = 1 + Math.sin(Date.now() * 0.0018 + planet.orbitRadius) * 0.035;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position}>
      {/* Lock ring */}
      <mesh ref={lockRingRef} rotation={[Math.PI / 2 + 0.3, 0, 0]}>
        <torusGeometry args={[planet.size * 1.4, 0.05, 16, 64]} />
        <meshBasicMaterial color={planet.glowColor} transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Second lock ring (cross) */}
      <mesh ref={secondaryLockRingRef} rotation={[Math.PI / 2 - 0.3, 0, Math.PI / 3]}>
        <torusGeometry args={[planet.size * 1.35, 0.04, 16, 48]} />
        <meshBasicMaterial color={planet.glowColor} transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Planet body */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); onPointerOver(); }}
        onPointerOut={(e) => { e.stopPropagation(); onPointerOut(); }}
      >
        <sphereGeometry args={[planet.size, 64, 64]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.8}
          metalness={0.1}
          emissive={new THREE.Color(planet.glowColor)}
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[planet.size * 1.14, 48, 48]} />
        <meshBasicMaterial
          color={planet.glowColor}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[planet.size * 1.08, 0.015, 8, 96]} />
        <meshBasicMaterial color={planet.tertiaryColor} transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Rings */}
      {planet.hasRings && ringGeo && ringMat && (
        <mesh ref={ringRef} geometry={ringGeo} material={ringMat} rotation={[Math.PI * 0.4, 0.1, 0]} />
      )}

      {/* Scan ring (visible during scanning) */}
      {isScanning && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[planet.size * 1.6, 0.03, 8, 64]} />
            <meshBasicMaterial color="#00e5ff" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh rotation={[Math.PI / 2 + 0.6, 0.2, 0]}>
            <torusGeometry args={[planet.size * 1.95, 0.018, 8, 96]} />
            <meshBasicMaterial color={planet.glowColor} transparent opacity={0.36} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </>
      )}
    </group>
  );
}
