import { useMemo } from 'react';
import type { Shipment } from '../types';

interface NetworkMapProps {
  shipments: Record<string, Shipment>;
  highlightedId: string | null;
  onHighlight: (id: string | null) => void;
}

export function NetworkMap({ shipments, highlightedId, onHighlight }: NetworkMapProps) {
  const list = useMemo(() => Object.values(shipments), [shipments]);

  const positions = useMemo(() => {
    const n = list.length;
    const centerX = 50;
    const centerY = 50;
    const radius = 38;
    return list.map((s, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      return {
        id: s.id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        status: s.status,
      };
    });
  }, [list]);

  const width = 600;
  const height = 400;
  const scale = Math.min(width, height) / 100;

  return (
    <div className="network-map">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Route lines (simplified: origin/dest style) */}
        {positions.slice(0, 8).map((p, i) => {
          const next = positions[(i + 3) % positions.length];
          if (!next) return null;
          return (
            <line
              key={`line-${p.id}-${next.id}`}
              x1={p.x * scale}
              y1={p.y * scale}
              x2={next.x * scale}
              y2={next.y * scale}
              stroke="var(--border-default)"
              strokeWidth={0.5}
              opacity={0.6}
            />
          );
        })}
        {positions.map(({ id, x, y, status }) => {
          const r = highlightedId === id ? 8 : 6;
          const isHighlight = highlightedId === id;
          return (
            <g
              key={id}
              className="node"
              onMouseEnter={() => onHighlight(id)}
              onMouseLeave={() => onHighlight(null)}
            >
              <circle
                cx={x * scale}
                cy={y * scale}
                r={r}
                className={`node-${status.toLowerCase().replace('_', '-')}`}
                stroke={isHighlight ? 'var(--text-primary)' : 'transparent'}
                strokeWidth={2}
              />
              {isHighlight && (
                <text
                  x={x * scale}
                  y={y * scale - r - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--text-primary)"
                >
                  {id.slice(0, 8)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
