import React, { useRef, useState, useEffect, useCallback } from "react";

/**
 * Virtual Joystick Component
 * Supports mobile touch and desktop mouse dragging
 * Emits normalized directional vectors (-1 to 1)
 */
export default function VirtualJoystick({ onMove, onStop, size = 110, knobSize = 46 }) {
  const containerRef = useRef(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const activeTouchIdRef = useRef(null);
  const maxRadius = (size - knobSize) / 2;

  const handlePointerStart = useCallback((clientX, clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, maxRadius);

    const kx = Math.cos(angle) * clampedDist;
    const ky = Math.sin(angle) * clampedDist;

    setKnobPos({ x: kx, y: ky });
    setIsDragging(true);

    if (onMove) {
      onMove({
        x: clampedDist > 6 ? kx / maxRadius : 0,
        y: clampedDist > 6 ? ky / maxRadius : 0,
      });
    }
  }, [maxRadius, onMove]);

  const handlePointerMove = useCallback((clientX, clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, maxRadius);

    const kx = Math.cos(angle) * clampedDist;
    const ky = Math.sin(angle) * clampedDist;

    setKnobPos({ x: kx, y: ky });

    if (onMove) {
      onMove({
        x: clampedDist > 6 ? kx / maxRadius : 0,
        y: clampedDist > 6 ? ky / maxRadius : 0,
      });
    }
  }, [maxRadius, onMove]);

  const handlePointerEnd = useCallback(() => {
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    activeTouchIdRef.current = null;
    if (onStop) {
      onStop();
    }
  }, [onStop]);

  // Mouse event listeners on window while dragging
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      handlePointerEnd();
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, handlePointerMove, handlePointerEnd]);

  // Touch event handlers
  const onTouchStart = (e) => {
    e.preventDefault();
    if (activeTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    activeTouchIdRef.current = touch.identifier;
    handlePointerStart(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchIdRef.current) {
        handlePointerMove(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const onTouchEnd = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchIdRef.current) {
        handlePointerEnd();
        break;
      }
    }
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    handlePointerStart(e.clientX, e.clientY);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      style={{ width: size, height: size }}
      className={`relative rounded-full select-none cursor-pointer flex items-center justify-center transition-shadow ${
        isDragging
          ? "bg-white/45 border-3 border-[#50B5FF] shadow-[0_0_20px_rgba(80,181,255,0.4)] backdrop-blur-md"
          : "bg-white/30 border-2 border-white/60 shadow-lg backdrop-blur-sm hover:bg-white/40"
      }`}
    >
      {/* Direction Guide Crosshairs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-0.5 h-full bg-white/60" />
        <div className="w-full h-0.5 bg-white/60 absolute" />
      </div>

      {/* Outer Glow Ring */}
      <div
        className={`absolute rounded-full border border-white/50 transition-transform pointer-events-none ${
          isDragging ? "scale-105 border-[#50B5FF]/60" : "scale-100"
        }`}
        style={{ width: size - 14, height: size - 14 }}
      />

      {/* Draggable Knob */}
      <div
        style={{
          width: knobSize,
          height: knobSize,
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: isDragging ? "none" : "transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1.2)",
        }}
        className={`rounded-full shadow-md flex items-center justify-center pointer-events-none ${
          isDragging
            ? "bg-gradient-to-tr from-[#3AA5F8] to-[#60C0FF] border-2 border-white text-white shadow-[0_4px_12px_rgba(43,142,224,0.5)]"
            : "bg-white/90 border-2 border-[#E2D4C2] shadow-[0_3px_6px_rgba(0,0,0,0.1)]"
        }`}
      >
        <div
          className={`w-3.5 h-3.5 rounded-full ${
            isDragging ? "bg-white" : "bg-[#50B5FF]/70"
          }`}
        />
      </div>
    </div>
  );
}
