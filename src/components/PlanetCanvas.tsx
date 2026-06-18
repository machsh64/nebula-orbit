import { useEffect, useRef, useState, useCallback } from 'react';
import { PlanetData } from '../data/types';
import { PLANETS } from '../data/planets';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface PlanetCanvasProps {
  selectedPlanet: PlanetData | null;
  onSelectPlanet: (planet: PlanetData | null) => void;
  onHoverPlanet: (planet: PlanetData | null) => void;
  hoveredPlanet: PlanetData | null;
}

// Drawing cache for planet procedural textures
const planetTextureCache = new Map<string, HTMLCanvasElement>();

function generatePlanetTexture(planet: PlanetData, size: number): HTMLCanvasElement {
  const cacheKey = `${planet.id}-${size}`;
  const cached = planetTextureCache.get(cacheKey);
  if (cached) return cached;

  const offscreen = document.createElement('canvas');
  offscreen.width = size * 2;
  offscreen.height = size * 2;
  const ctx = offscreen.getContext('2d')!;
  const cx = size;
  const cy = size;

  // Clip to circle
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.95, 0, Math.PI * 2);
  ctx.clip();

  // Base gradient
  const baseGrad = ctx.createRadialGradient(cx - size * 0.2, cy - size * 0.3, size * 0.1, cx, cy, size);
  baseGrad.addColorStop(0, planet.tertiaryColor);
  baseGrad.addColorStop(0.4, planet.primaryColor);
  baseGrad.addColorStop(0.85, planet.secondaryColor);
  baseGrad.addColorStop(1, '#000000');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, offscreen.width, offscreen.height);

  // Add procedural bands/stripes (like Jupiter bands)
  const bandCount = planet.id === 'aether-9' ? 12 : planet.id === 'kepler-7x' ? 6 : 0;
  for (let i = 0; i < bandCount; i++) {
    const bandY = cy - size * 0.8 + (size * 1.6 * i) / bandCount;
    const bandHeight = size * 0.05 + Math.random() * size * 0.08;
    ctx.beginPath();
    ctx.ellipse(cx, bandY, size, bandHeight, 0, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0
      ? `rgba(255,255,255,${0.05 + Math.random() * 0.1})`
      : `rgba(0,0,0,${0.05 + Math.random() * 0.15})`;
    ctx.fill();
  }

  // Add crater-like spots for rocky planets
  if (['nova-prime', 'cryo-11b', 'umbra-x'].includes(planet.id)) {
    for (let i = 0; i < 20; i++) {
      const cx_ = cx + (Math.random() - 0.5) * size * 1.6;
      const cy_ = cy + (Math.random() - 0.5) * size * 1.6;
      const cr = size * 0.02 + Math.random() * size * 0.08;
      ctx.beginPath();
      ctx.arc(cx_, cy_, cr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.2})`;
      ctx.fill();
    }
  }

  // Add surface noise/grain
  const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 15;
    imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i] + noise));
    imageData.data[i + 1] = Math.min(255, Math.max(0, imageData.data[i + 1] + noise));
    imageData.data[i + 2] = Math.min(255, Math.max(0, imageData.data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  planetTextureCache.set(cacheKey, offscreen);
  return offscreen;
}

export default function PlanetCanvas({
  selectedPlanet,
  onSelectPlanet,
  onHoverPlanet,
  hoveredPlanet,
}: PlanetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const reducedMotion = useReducedMotion();
  const hoverScaleRef = useRef<Map<string, number>>(new Map());

  // Track planet positions for hit detection
  const planetPositionsRef = useRef<Map<string, { x: number; y: number; radius: number }>>(new Map());

  const drawPlanet = useCallback(
    (ctx: CanvasRenderingContext2D, planet: PlanetData, x: number, y: number, time: number) => {
      const isHovered = hoveredPlanet?.id === planet.id;
      const isSelected = selectedPlanet?.id === planet.id;

      // Animate hover scale
      const currentScale = hoverScaleRef.current.get(planet.id) || 1;
      const targetScale = isHovered ? 1.35 : isSelected ? 1.5 : 1;
      const newScale = currentScale + (targetScale - currentScale) * 0.1;
      hoverScaleRef.current.set(planet.id, newScale);

      const baseRadius = planet.size;
      const radius = baseRadius * newScale;

      // Store for hit detection
      planetPositionsRef.current.set(planet.id, { x, y, radius });

      // === Orbital Ring ===
      if (planet.hasRings) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI * 0.25);

        // Outer glow ring
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.7, radius * (0.4 + planet.ringWidth * 0.3), 0, 0, Math.PI * 2);
        const ringGrad = ctx.createRadialGradient(0, 0, radius * 0.9, 0, 0, radius * 1.8);
        ringGrad.addColorStop(0, 'transparent');
        ringGrad.addColorStop(0.5, planet.ringColor + '40');
        ringGrad.addColorStop(0.7, planet.ringColor + '20');
        ringGrad.addColorStop(1, 'transparent');
        ctx.strokeStyle = ringGrad;
        ctx.lineWidth = 2 + planet.ringWidth;
        ctx.stroke();

        // Bright inner ring
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.55, radius * (0.25 + planet.ringWidth * 0.25), 0, 0, Math.PI * 2);
        ctx.strokeStyle = planet.ringColor + '60';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }

      // === Planet glow aura ===
      const glowRadius = radius * 1.4;
      const glow = ctx.createRadialGradient(x, y, radius * 0.85, x, y, glowRadius);
      glow.addColorStop(0, planet.glowColor + '30');
      glow.addColorStop(0.5, planet.glowColor + '10');
      glow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // === Draw planet body ===
      const texture = generatePlanetTexture(planet, radius);

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();

      // Rotate the planet slowly
      const rotation = reducedMotion ? 0 : (time * planet.orbitSpeed * 0.3) % (Math.PI * 2);
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.drawImage(texture, -radius, -radius, radius * 2, radius * 2);

      ctx.restore();

      // === Atmosphere rim light ===
      const rimGrad = ctx.createRadialGradient(x - radius * 0.15, y - radius * 0.15, radius * 0.7, x, y, radius * 1.02);
      rimGrad.addColorStop(0, 'transparent');
      rimGrad.addColorStop(0.85, 'transparent');
      rimGrad.addColorStop(0.95, planet.glowColor + '50');
      rimGrad.addColorStop(1, planet.glowColor + '20');
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.02, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();

      // === Hover/Selected glow ring ===
      if (isHovered || isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = planet.glowColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = planet.glowColor;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // === Label ===
      ctx.font = `${isHovered ? 13 : 11}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = planet.glowColor;
      ctx.globalAlpha = isHovered ? 1 : 0.7;
      ctx.fillText(planet.name, x, y + radius + 18);
      ctx.globalAlpha = 1;
    },
    [hoveredPlanet, selectedPlanet, reducedMotion]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 - 30;

      // Draw subtle center glow (the "sun" or central archive node)
      const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
      centerGlow.addColorStop(0, 'rgba(0, 229, 255, 0.08)');
      centerGlow.addColorStop(0.5, 'rgba(41, 121, 255, 0.04)');
      centerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = centerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();

      // Central crosshair
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy); ctx.lineTo(cx + 30, cy);
      ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy + 30);
      ctx.stroke();

      // Draw orbit paths
      for (const planet of PLANETS) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, planet.orbitRadius, planet.orbitRadius * 0.55, 0, 0, Math.PI * 2);
        ctx.strokeStyle = planet.glowColor + '10';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw planets along their orbits
      for (const planet of PLANETS) {
        const angle = reducedMotion
          ? planet.orbitRadius * 0.01
          : (t * Math.PI * 2) / (360 / planet.orbitSpeed) + planet.orbitRadius * 0.01;
        const px = cx + Math.cos(angle) * planet.orbitRadius;
        const py = cy + Math.sin(angle) * planet.orbitRadius * 0.55;
        drawPlanet(ctx, planet, px, py, t);
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [drawPlanet, reducedMotion]);

  // Mouse hit detection
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let found: PlanetData | null = null;
      for (const planet of PLANETS) {
        const pos = planetPositionsRef.current.get(planet.id);
        if (!pos) continue;
        const dx = mx - pos.x;
        const dy = my - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < pos.radius + 10) {
          found = planet;
          break;
        }
      }
      onHoverPlanet(found);
    },
    [onHoverPlanet]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (const planet of PLANETS) {
        const pos = planetPositionsRef.current.get(planet.id);
        if (!pos) continue;
        const dx = mx - pos.x;
        const dy = my - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < pos.radius + 10) {
          onSelectPlanet(planet);
          return;
        }
      }
      // Click on empty space deselects
      onSelectPlanet(null);
    },
    [onSelectPlanet]
  );

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[2]"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    />
  );
}
