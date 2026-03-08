import type { AgentState } from '../../types';

interface KPIRowProps {
  state: AgentState;
}

const CARDS = [
  {
    key: 'tick',
    label: 'Simulation Tick',
    value: (s: AgentState) => s.tick,
    sub: '+1 every 5s (auto)',
    color: 'blue' as const,
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7" cy="7" r="6" />
        <path d="M7 4v3l2 2" />
      </svg>
    ),
  },
  {
    key: 'risk',
    label: 'Shipments At Risk',
    value: (s: AgentState) => Object.values(s.shipments).filter(x => (x.failure_prob ?? 0) >= 0.75).length,
    sub: 'prob ≥ 75%',
    color: 'red' as const,
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M7 1 L13 12 H1 Z" />
        <line x1="7" y1="5" x2="7" y2="8.5" />
        <circle cx="7" cy="10.5" r="0.7" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: 'rescued',
    label: 'Rescued',
    value: (s: AgentState) => Object.values(s.shipments).filter(x => x.status === 'RESCUED').length,
    sub: 'auto + human approved',
    color: 'green' as const,
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 7 L5.5 10.5 L12 4" />
      </svg>
    ),
  },
  {
    key: 'mem',
    label: 'Memory Episodes',
    value: (s: AgentState) => s.episode_count,
    sub: 'ChromaDB stored',
    color: 'amber' as const,
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="7" cy="7" r="6" />
        <path d="M4 7h6M7 4v6" />
      </svg>
    ),
  },
];

const colorMap = {
  blue: { border: 'var(--blue)', iconBg: 'var(--blue-glow)', iconColor: 'var(--blue)', valueColor: 'var(--text-primary)' },
  red: { border: 'var(--red)', iconBg: 'var(--red-bg)', iconColor: 'var(--red)', valueColor: 'var(--red)' },
  green: { border: 'var(--green)', iconBg: 'var(--green-bg)', iconColor: 'var(--green)', valueColor: 'var(--green)' },
  amber: { border: 'var(--amber)', iconBg: 'var(--amber-bg)', iconColor: 'var(--amber)', valueColor: 'var(--amber)' },
};

export function KPIRow({ state }: KPIRowProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {CARDS.map((card, i) => {
        const colors = colorMap[card.color];
        const value = card.value(state);
        return (
          <div
            key={card.key}
            className="panel p-5 flex flex-col gap-2.5 relative overflow-hidden hover:shadow-md hover:border-[var(--border-md)] transition-all"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[var(--radius-lg)]" style={{ background: colors.border }} />
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-medium text-[var(--text-secondary)] tracking-tight">{card.label}</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: colors.iconBg, color: colors.iconColor }}
              >
                {card.icon}
              </div>
            </div>
            <div className="text-[30px] font-bold tracking-tight leading-none font-mono" style={{ color: colors.valueColor }}>
              {value}
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] font-mono">{card.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
