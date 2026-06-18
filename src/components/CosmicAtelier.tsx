import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { ART_DIRECTION, SPECTRAL_TRAILS } from '../data/artDirection';
import { useReducedMotion } from '../hooks/useReducedMotion';

function seededNoise(index: number, salt: number) {
  const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function SingularityCore() {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const reducedMotion = useReducedMotion();

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    const motion = reducedMotion ? 0.2 : 1;

    groupRef.current.rotation.y += delta * 0.16 * motion;
    groupRef.current.rotation.z = Math.sin(t * 0.21) * 0.08;

    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 1.7) * 0.08 * motion;
      coreRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight color={ART_DIRECTION.palette.cyan} intensity={10} distance={55} />
      <pointLight color={ART_DIRECTION.palette.amber} intensity={4} distance={36} position={[0, 4, 0]} />

      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.8, 4]} />
        <meshBasicMaterial color={ART_DIRECTION.palette.porcelain} transparent opacity={0.78} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh>
        <sphereGeometry args={[1.5, 48, 48]} />
        <meshBasicMaterial color={ART_DIRECTION.palette.cyan} transparent opacity={0.13} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh>
        <sphereGeometry args={[2.4, 48, 48]} />
        <meshBasicMaterial color={ART_DIRECTION.palette.ultraviolet} transparent opacity={0.07} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {[0, 1, 2].map((ring) => (
        <mesh
          key={ring}
          rotation={[
            Math.PI / 2 + ring * 0.38,
            ring * 0.54,
            ring * 0.8,
          ]}
        >
          <torusGeometry args={[3.1 + ring * 0.85, 0.025 + ring * 0.01, 12, 160]} />
          <meshBasicMaterial
            color={[ART_DIRECTION.palette.cyan, ART_DIRECTION.palette.amber, ART_DIRECTION.palette.magenta][ring]}
            transparent
            opacity={0.28 - ring * 0.04}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function SpectralRibbon({ trail }: { trail: (typeof SPECTRAL_TRAILS)[number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const reducedMotion = useReducedMotion();

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const steps = 220;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const wobble = Math.sin(t * 3 + trail.phase) * 2.2;
      pts.push(new THREE.Vector3(
        Math.cos(t) * (trail.radius + wobble),
        Math.sin(t * 2 + trail.phase) * trail.height,
        Math.sin(t) * (trail.radius - wobble * 0.6)
      ));
    }
    return pts;
  }, [trail]);

  const echoPoints = useMemo(() => {
    return points.map((point, index) => {
      const t = index / Math.max(1, points.length - 1);
      return point.clone().multiplyScalar(0.985 + Math.sin(t * Math.PI * 2) * 0.012).add(new THREE.Vector3(0, 0.9, 0));
    });
  }, [points]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * trail.speed * (reducedMotion ? 0.2 : 1);
  });

  return (
    <group ref={groupRef} rotation={[0, trail.phase * 0.08, 0]}>
      <Line
        points={points}
        color={trail.primary}
        lineWidth={trail.width}
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
      <Line
        points={echoPoints}
        color={trail.secondary}
        lineWidth={Math.max(0.6, trail.width * 0.55)}
        transparent
        opacity={0.2}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </group>
  );
}

function ConstellationWeb() {
  const groupRef = useRef<THREE.Group>(null);
  const reducedMotion = useReducedMotion();

  const { segmentGeometry, pointGeometry } = useMemo(() => {
    const nodeCount = 54;
    const nodes: THREE.Vector3[] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < nodeCount; i++) {
      const y = 1 - (i / (nodeCount - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const shell = 92 + seededNoise(i, 2) * 46;
      nodes.push(new THREE.Vector3(
        Math.cos(theta) * radius * shell,
        y * shell * 0.58,
        Math.sin(theta) * radius * shell
      ));
    }

    const segments: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const nextA = (i + 5) % nodeCount;
      const nextB = (i + 13) % nodeCount;
      if (seededNoise(i, 7) > 0.22) {
        segments.push(...nodes[i].toArray(), ...nodes[nextA].toArray());
      }
      if (seededNoise(i, 11) > 0.68) {
        segments.push(...nodes[i].toArray(), ...nodes[nextB].toArray());
      }
    }

    const nodePositions = new Float32Array(nodes.flatMap(node => node.toArray()));
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3));

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));

    return { segmentGeometry: lineGeometry, pointGeometry: starGeometry };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y -= delta * (reducedMotion ? 0.002 : 0.01);
    groupRef.current.rotation.x = Math.sin(Date.now() * 0.00008) * 0.025;
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={segmentGeometry}>
        <lineBasicMaterial color={ART_DIRECTION.palette.frost} transparent opacity={0.075} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <points geometry={pointGeometry}>
        <pointsMaterial size={0.52} color={ART_DIRECTION.palette.porcelain} transparent opacity={0.68} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
    </group>
  );
}

function AureateDust() {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 900;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const radius = 8 + seededNoise(i, 13) * 70;
      const angle = seededNoise(i, 17) * Math.PI * 2;
      const lift = (seededNoise(i, 19) - 0.5) * 16;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = lift + Math.sin(angle * 2) * 2;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      color.set([ART_DIRECTION.palette.amber, ART_DIRECTION.palette.frost, ART_DIRECTION.palette.aurora][i % 3]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.012;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.11}
        vertexColors
        transparent
        opacity={0.48}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

export default function CosmicAtelier() {
  return (
    <group>
      <SingularityCore />
      {SPECTRAL_TRAILS.map(trail => (
        <SpectralRibbon key={trail.id} trail={trail} />
      ))}
      <ConstellationWeb />
      <AureateDust />
    </group>
  );
}
