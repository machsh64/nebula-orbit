import { useRef, useCallback, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import { PlanetData } from '../data/types';
import { PLANETS } from '../data/planets';
import Starfield3D from './Starfield3D';
import OrbitSystem from './OrbitSystem';
import gsap from 'gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';

const INITIAL_CAMERA = new THREE.Vector3(0, 8, 18);
const MIN_ZOOM = 6;
const MAX_ZOOM = 35;

interface CameraControllerProps {
  lockedPlanetId: string | null;
  planets: PlanetData[];
  zoomRef: React.MutableRefObject<number>;
}

function CameraController({ lockedPlanetId, planets, zoomRef }: CameraControllerProps) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const reducedMotion = useReducedMotion();

  useFrame(() => {
    if (lockedPlanetId) {
      const planet = planets.find(p => p.id === lockedPlanetId);
      if (planet) {
        // Find planet position in orbit system
        const angle = Date.now() * 0.001 * planet.orbitSpeed * 0.5;
        const px = Math.cos(angle) * planet.orbitRadius;
        const pz = Math.sin(angle) * planet.orbitRadius;
        const py = Math.sin(angle) * planet.orbitInclination * 2;
        const planetPos = new THREE.Vector3(px, py, pz);

        // Camera should be close to planet, offset along planet-to-center direction
        const toCenter = new THREE.Vector3().copy(planetPos).normalize().multiplyScalar(-1);
        const camTarget = planetPos.clone();
        const camPos = planetPos.clone().add(toCenter.clone().multiplyScalar(planet.size * 3 + 2));

        targetRef.current.lerp(camTarget, reducedMotion ? 1 : 0.05);
        camera.position.lerp(camPos, reducedMotion ? 1 : 0.04);
        camera.lookAt(targetRef.current);
        zoomRef.current = camPos.length();
      }
    }
  });

  return null;
}

interface GalaxyViewportProps {
  lockedPlanetId: string | null;
  scanningPlanetId: string | null;
  targetedPlanetId: string | null;
  onPlanetClick: (planet: PlanetData) => void;
  onPlanetHover: (planet: PlanetData | null) => void;
  onCameraMove: (zoom: number) => void;
  controlsRef: React.MutableRefObject<any>;
  zoomRef: React.MutableRefObject<number>;
}

function Scene({
  lockedPlanetId,
  scanningPlanetId,
  targetedPlanetId,
  onPlanetClick,
  onPlanetHover,
  onCameraMove,
  controlsRef,
  zoomRef,
}: GalaxyViewportProps) {
  const { camera } = useThree();
  const reducedMotion = useReducedMotion();

  // Set initial camera
  useEffect(() => {
    camera.position.copy(INITIAL_CAMERA);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Track zoom
  useFrame(() => {
    if (lockedPlanetId) return; // CameraController handles locked state
    const dist = camera.position.length();
    zoomRef.current = dist;
    onCameraMove(dist);
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={50} distance={40} color="#00e5ff" />

      {/* Deep space stars */}
      <Starfield3D />

      {/* Orbit system with planets */}
      <OrbitSystem
        planets={PLANETS}
        lockedPlanetId={lockedPlanetId}
        scanningPlanetId={scanningPlanetId}
        targetedPlanetId={targetedPlanetId}
        onPlanetClick={onPlanetClick}
        onPlanetHover={onPlanetHover}
      />

      {/* Camera controller */}
      <CameraController lockedPlanetId={lockedPlanetId} planets={PLANETS} zoomRef={zoomRef} />

      {/* Orbit Controls */}
      <DreiOrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={MIN_ZOOM}
        maxDistance={MAX_ZOOM}
        target={lockedPlanetId ? new THREE.Vector3(0, 0, 0) : [0, 0, 0]}
        enabled={!lockedPlanetId}
        maxPolarAngle={Math.PI * 0.7}
        minPolarAngle={Math.PI * 0.15}
        zoomSpeed={1.2}
        rotateSpeed={0.6}
      />
    </>
  );
}

// Grid plane helper on XZ plane
function GridPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial color="#00e5ff" transparent opacity={0.02} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

export default function GalaxyViewport(props: GalaxyViewportProps) {
  return (
    <div className="absolute inset-0 z-[2]">
      <Canvas
        camera={{ position: INITIAL_CAMERA, fov: 50, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#020510'), 0);
        }}
      >
        <Scene {...props} />
        <GridPlane />
      </Canvas>
    </div>
  );
}
