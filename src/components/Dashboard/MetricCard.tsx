// MetricCard.tsx — Animated metric card

import React, { useEffect, useRef, useState } from 'react';

interface MetricCardProps {
  id: string;
  title: string;
  value: number | string;
  subtitle?: string;
  accent?: 'blue' | 'green' | 'purple';
  icon: string;
}

function useCountUp(target: number, duration = 350): number {
  const [cur, setCur] = useState(target);
  const prev = useRef(target);
  const raf  = useRef<number>(0);

  useEffect(() => {
    const from = prev.current;
    const diff = target - from;
    if (!diff) return;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setCur(Math.round(from + diff * e));
      if (p < 1) raf.current = requestAnimationFrame(step);
      else prev.current = target;
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return cur;
}

export const MetricCard: React.FC<MetricCardProps> = ({ id, title, value, subtitle, accent = 'blue', icon }) => {
  const isNum = typeof value === 'number';
  const display = isNum ? useCountUp(value as number) : value;

  return (
    <div className={`metric-card metric-card--${accent}`} id={id}>
      <div className="metric-card__icon">{icon}</div>
      <div>
        <div className="metric-card__title">{title}</div>
        <div className="metric-card__value">{display}</div>
        {subtitle && <div className="metric-card__sub">{subtitle}</div>}
      </div>
    </div>
  );
};
