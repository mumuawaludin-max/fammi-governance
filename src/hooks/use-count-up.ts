"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 1200, delay = 300): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }

    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setCount(Math.round(target * eased));
        if (t < 1) { rafRef.current = requestAnimationFrame(tick); }
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return count;
}
