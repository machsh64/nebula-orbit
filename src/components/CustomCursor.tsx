import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;

    const cursor = cursorRef.current;
    const trail = trailRef.current;
    if (!cursor || !trail) return;

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let trailX = 0, trailY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    // Detect hoverable elements
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[data-hoverable]') ||
        target.closest('canvas')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const animate = () => {
      // Smooth follow
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;
      trailX += (mouseX - trailX) * 0.08;
      trailY += (mouseY - trailY) * 0.08;

      cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) scale(${isClicking ? 0.7 : isHovering ? 1.3 : 1})`;
      trail.style.transform = `translate(${trailX}px, ${trailY}px) scale(${isHovering ? 1.5 : 1})`;

      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mouseover', onMouseOver);
    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseover', onMouseOver);
    };
  }, [reducedMotion, isHovering, isClicking]);

  if (reducedMotion) return null;

  return (
    <>
      {/* Main cursor */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[10000]"
        style={{ marginLeft: -8, marginTop: -8 }}
      >
        <div className={`w-4 h-4 rounded-full border transition-all duration-150 ${isHovering
          ? 'border-[#00e5ff] bg-[#00e5ff]/10'
          : 'border-white/40 bg-white/5'
          }`}
          style={{
            boxShadow: isHovering
              ? '0 0 15px rgba(0,229,255,0.5), 0 0 30px rgba(0,229,255,0.2)'
              : '0 0 8px rgba(255,255,255,0.1)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
          style={{
            backgroundColor: isHovering ? '#00e5ff' : '#ffffff',
            boxShadow: isHovering ? '0 0 6px #00e5ff' : 'none',
          }}
        />
      </div>
      {/* Trail */}
      <div
        ref={trailRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ marginLeft: -12, marginTop: -12 }}
      >
        <div className="w-6 h-6 rounded-full border border-[#00e5ff]/20 bg-[#00e5ff]/5"
          style={{ filter: 'blur(2px)' }} />
      </div>
    </>
  );
}
