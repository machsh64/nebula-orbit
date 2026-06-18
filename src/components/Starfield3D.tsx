import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Starfield3D() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 2000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Spherical distribution - far beyond outermost orbit
      const radius = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      // Color variation: white, blue-white, yellow-white
      const colorChoice = Math.random();
      if (colorChoice < 0.6) {
        col[i * 3] = 0.8 + Math.random() * 0.2;
        col[i * 3 + 1] = 0.8 + Math.random() * 0.2;
        col[i * 3 + 2] = 0.9 + Math.random() * 0.1;
      } else if (colorChoice < 0.85) {
        col[i * 3] = 0.5 + Math.random() * 0.3;
        col[i * 3 + 1] = 0.6 + Math.random() * 0.3;
        col[i * 3 + 2] = 1.0;
      } else {
        col[i * 3] = 0.85 + Math.random() * 0.15;
        col[i * 3 + 1] = 0.75 + Math.random() * 0.15;
        col[i * 3 + 2] = 0.5 + Math.random() * 0.3;
      }
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.015;
      pointsRef.current.rotation.x += delta * 0.005;
    }
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
