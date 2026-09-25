import React, { useRef, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';

/**
 * AIOrb
 * 
 * Lightweight mathematical 2D canvas resonator orb.
 * Visualizes AI interviewer states (speaking, listening, processing, idle)
 * with fluid harmonic wave oscillations.
 * Zero external libraries, strict cancelAnimationFrame cleanup,
 * and accessible static fallback for prefers-reduced-motion.
 */
export default function AIOrb({ 
  mode = 'idle', // 'idle' | 'speaking' | 'listening' | 'processing'
  size = 48,
  className = ''
}) {
  const canvasRef = useRef(null);
  const animFrameIdRef = useRef(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let time = 0;
    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = size * 0.32;

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      let speed = 0.04;
      let primaryColor = '79, 107, 255'; // cobalt
      let secondaryColor = '99, 102, 241'; // indigo
      let waveCount = 3;
      let amplitude = 2.5;

      if (mode === 'speaking') {
        speed = 0.08;
        primaryColor = '79, 107, 255'; // radiant cobalt
        secondaryColor = '168, 85, 247'; // purple
        amplitude = 4.5;
      } else if (mode === 'listening') {
        speed = 0.05;
        primaryColor = '16, 185, 129'; // emerald
        secondaryColor = '6, 182, 212'; // cyan
        amplitude = 3.2;
      } else if (mode === 'processing') {
        speed = 0.09;
        primaryColor = '245, 158, 11'; // amber
        secondaryColor = '234, 88, 12'; // orange
        amplitude = 2.0;
      }

      time += speed;

      // Draw outer harmonic resonance rings
      for (let i = waveCount; i >= 1; i--) {
        const offset = i * (Math.PI / 2.5);
        const pulse = Math.sin(time + offset) * amplitude;
        const r = baseRadius + (i * (size * 0.11)) + pulse;
        const alpha = Math.max(0.08, 0.38 - (i * 0.09));

        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${primaryColor}, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw central energetic core gradient
      const corePulse = Math.sin(time * 1.5) * 1.5;
      const coreRadius = Math.max(2, baseRadius + corePulse);
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
      gradient.addColorStop(0, `rgba(${secondaryColor}, 0.95)`);
      gradient.addColorStop(0.65, `rgba(${primaryColor}, 0.6)`);
      gradient.addColorStop(1, `rgba(${primaryColor}, 0)`);

      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core center spark
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, baseRadius * 0.35 + Math.sin(time * 2) * 0.8), 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [mode, size]);

  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label={`AI Interviewer status: ${mode}`}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="block"
      />
    </div>
  );
}
