import { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlanetData } from '../data/types';
import { PLANETS } from '../data/planets';
import Starfield3D from './Starfield3D';
import OrbitSystem from './OrbitSystem';
import { useReducedMotion } from '../hooks/useReducedMotion';

const INITIAL_POS = new THREE.Vector3(0, 8, 22);
const MAX_SPEED = 25;
const BOOST_MULTIPLIER = 2.5;
const MOUSE_SENSITIVITY = 0.002;
const DAMPING = 0.92;
const ACCELERATION = 0.8;
const BRAKE_FORCE = 0.6;
const PROXIMITY_RANGE = 4; // How close counts as "near planet"

export interface FlightState {
  velocity: THREE.Vector3;
  speed: number; // current scalar speed
  heading: number; // yaw in radians
  pitch: number; // pitch in radians
  isBoosting: boolean;
}

// ---- First-Person Flight Camera ----
function FlightCamera({
  onFlightUpdate,
  onNearbyPlanet,
  inputRef,
  warpTargetRef,
}: {
  onFlightUpdate: (state: FlightState) => void;
  onNearbyPlanet: (planet: PlanetData | null, distance: number) => void;
  inputRef: React.MutableRefObject<{ keys: Set<string>; mouse: { dx: number; dy: number } }>;
  warpTargetRef: React.MutableRefObject<string | null>;
}) {
  const { camera, gl } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isPointerLocked = useRef(false);
  const reducedMotion = useReducedMotion();

  // Set initial camera orientation
  useEffect(() => {
    camera.position.copy(INITIAL_POS);
    // Look toward center/origin
    const lookDir = new THREE.Vector3().copy(INITIAL_POS).normalize().multiplyScalar(-1);
    camera.lookAt(lookDir);
    euler.current.setFromQuaternion(camera.quaternion);

    // Pointer lock setup
    const canvas = gl.domElement;
    const onLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas;
    };
    document.addEventListener('pointerlockchange', onLockChange);

    canvas.addEventListener('click', () => {
      if (!isPointerLocked.current && !reducedMotion) {
        canvas.requestPointerLock();
      }
    });

    return () => {
      document.removeEventListener('pointerlockchange', onLockChange);
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    };
  }, [camera, gl, reducedMotion]);

  useFrame((_, delta) => {
    // Clamp delta to avoid huge jumps on tab-away
    const dt = Math.min(delta, 0.1);
    const input = inputRef.current;
    const keys = input.keys;

    // Mouse look
    if (isPointerLocked.current) {
      euler.current.y -= input.mouse.dx * MOUSE_SENSITIVITY;
      euler.current.x -= input.mouse.dy * MOUSE_SENSITIVITY;
      // Clamp pitch to ±85 degrees
      euler.current.x = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, euler.current.x));
      input.mouse.dx = 0;
      input.mouse.dy = 0;
    }

    camera.quaternion.setFromEuler(euler.current);

    // Movement direction vectors
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0);

    // Collect input
    const moveDir = new THREE.Vector3();
    if (keys.has('KeyW') || keys.has('ArrowUp')) moveDir.add(forward);
    if (keys.has('KeyS') || keys.has('ArrowDown')) moveDir.sub(forward);
    if (keys.has('KeyA') || keys.has('ArrowLeft')) moveDir.sub(right);
    if (keys.has('KeyD') || keys.has('ArrowRight')) moveDir.add(right);
    if (keys.has('KeyQ')) moveDir.sub(up);
    if (keys.has('KeyE')) moveDir.add(up);

    const isBoosting = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const isBraking = keys.has('Space');
    const boostMult = isBoosting ? BOOST_MULTIPLIER : 1;

    moveDir.normalize();

    // Accelerate
    const targetVel = moveDir.clone().multiplyScalar(MAX_SPEED * boostMult);
    velocity.current.lerp(targetVel, dt * ACCELERATION * 3);

    // Brake (space)
    if (isBraking && moveDir.length() < 0.01) {
      velocity.current.multiplyScalar(1 - BRAKE_FORCE * dt * 3);
    }

    // Natural damping when no input
    if (moveDir.length() < 0.01 && !isBraking) {
      velocity.current.multiplyScalar(Math.pow(DAMPING, dt * 60));
    }

    // Apply
    camera.position.add(velocity.current.clone().multiplyScalar(dt));

    // === WARP TELEPORT ===
    const warpTargetId = warpTargetRef.current;
    if (warpTargetId) {
      const target = PLANETS.find(p => p.id === warpTargetId);
      if (target) {
        const now = Date.now() * 0.001;
        const angle = now * target.orbitSpeed * 0.5;
        const px = Math.cos(angle) * target.orbitRadius;
        const pz = Math.sin(angle) * target.orbitRadius;
        const py = Math.sin(angle) * target.orbitInclination * 2;
        // Teleport to just outside the planet, facing toward it
        const planetPos = new THREE.Vector3(px, py, pz);
        const toCenter = new THREE.Vector3().copy(planetPos).normalize().multiplyScalar(-1);
        const arrivalPos = planetPos.clone().add(toCenter.multiplyScalar(target.size * 2 + 3));
        camera.position.copy(arrivalPos);
        camera.lookAt(planetPos);
        euler.current.setFromQuaternion(camera.quaternion);
        velocity.current.set(0, 0, 0);
      }
      warpTargetRef.current = null;
    }

    const speed = velocity.current.length();

    // ---- Proximity detection: find nearest planet ----
    let nearestPlanet: PlanetData | null = null;
    let nearestDist = Infinity;

    const camPos = camera.position;
    // For each planet, compute its current 3D orbit position
    const now = Date.now() * 0.001;
    for (const p of PLANETS) {
      const angle = now * p.orbitSpeed * 0.5;
      const px = Math.cos(angle) * p.orbitRadius;
      const pz = Math.sin(angle) * p.orbitRadius;
      const py = Math.sin(angle) * p.orbitInclination * 2;
      const dist = Math.sqrt(
        (camPos.x - px) ** 2 + (camPos.y - py) ** 2 + (camPos.z - pz) ** 2
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestPlanet = p;
      }
    }

    // Also check center core
    const coreDist = camPos.length();
    if (coreDist < nearestDist) {
      nearestDist = coreDist;
      nearestPlanet = null;
    }

    const isProximity = nearestDist < PROXIMITY_RANGE;
    onNearbyPlanet(isProximity ? nearestPlanet : null, nearestDist);

    // Flight state for HUD
    onFlightUpdate({
      velocity: velocity.current.clone(),
      speed,
      heading: euler.current.y,
      pitch: euler.current.x,
      isBoosting,
    });
  });

  return null;
}

// Grid plane
function GridPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial color="#00e5ff" transparent opacity={0.015} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

interface GalaxyViewportProps {
  onFlightUpdate: (state: FlightState) => void;
  onNearbyPlanet: (planet: PlanetData | null, distance: number) => void;
  scanningPlanetId: string | null;
  inputRef: React.MutableRefObject<{ keys: Set<string>; mouse: { dx: number; dy: number } }>;
  warpTargetRef: React.MutableRefObject<string | null>;
}

function Scene({ onFlightUpdate, onNearbyPlanet, inputRef, scanningPlanetId, warpTargetRef }: GalaxyViewportProps) {
  return (
    <>
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 0, 0]} intensity={40} distance={40} color="#00e5ff" />

      <Starfield3D />

      <OrbitSystem
        planets={PLANETS}
        lockedPlanetId={null}
        scanningPlanetId={scanningPlanetId}
        targetedPlanetId={null}
        onPlanetClick={() => {}}
        onPlanetHover={() => {}}
      />

      <FlightCamera
        onFlightUpdate={onFlightUpdate}
        onNearbyPlanet={onNearbyPlanet}
        inputRef={inputRef}
        warpTargetRef={warpTargetRef}
      />

      <GridPlane />
    </>
  );
}

export default function GalaxyViewport(props: GalaxyViewportProps) {
  return (
    <div className="absolute inset-0 z-[2]">
      <Canvas
        camera={{ position: INITIAL_POS, fov: 60, near: 0.1, far: 300 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#020510'), 0);
        }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
