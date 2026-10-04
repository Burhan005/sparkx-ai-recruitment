import { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal — Intersection Observer wrapper that fades + slides children
 * into view when they enter the viewport. Fires once and disconnects.
 *
 * @param {number} delay   - ms delay before animation starts (for stagger)
 * @param {string} direction - 'up' | 'down' | 'left' | 'right'
 * @param {number} distance - px to travel
 */
export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 32,
  threshold = 0.12,
  duration = 0.7,
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  const translateMap = {
    up: `translateY(${distance}px)`,
    down: `translateY(-${distance}px)`,
    left: `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0, 0)' : translateMap[direction],
        transition: `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
