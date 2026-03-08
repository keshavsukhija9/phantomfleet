import type { AgentState } from '../../types';

interface KPIRowProps {
  state: AgentState;
}

const CARDS = [
  {
    key: 'tick',
    label: 'Simulation Tick',
    value: (s: AgentState) => s.tick,
    sub: 'Every 5s in auto mode',
    color: 'blue' as const,
  },
  {
    key: 'risk',
    label: 'At Risk',
    value: (s: AgentState) => Object.values(s.shipments).filter(x => (x.failure_prob ?? 0) >= 0.75).length,
    sub: 'Failure prob ≥ 75%',
    color: 'red' as const,
  },
  {
    key: 'rescued',
    label: 'Rescued',
    value: (s: AgentState) => Object.values(s.shipments).filter(x => x.status === 'RESCUED').length,
    sub: 'Auto + human approved',
    color: 'green' as const,
  },
  {
    key: 'mem',
    label: 'Memory Episodes',
    value: (s: AgentState) => s.episode_count,
    sub: 'Stored in ChromaDB',
    color: 'amber' as const,
  },
];

const colorMap = {
  blue: { accent: 'var(--blue)', iconBg: 'var(--blue-glow)', value: 'var(--text-primary)' },
  red: { accent: 'var(--red)', iconBg: 'var(--red-bg)', value: 'var(--red)' },
  green: { accent: 'var(--green)', iconBg: 'var(--green-bg)', value: 'var(--green)' },
  amber: { accent: 'var(--amber)', iconBg: 'var(--amber-bg)', value: 'var(--amber)' },
};

export function KPIRow({ state }: KPIRowProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {CARDS.map((card) => {
        const colors = colorMap[card.color];
        const value = card.value(state);
        return (
          <div
            key={card.key}
            className="panel relative overflow-hidden group"
          >
            {/* Accent top line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, ${colors.accent}, transparent)` }}
            />
            <div className="p-5 flex flex-col gap-3">
              <span className="text-[12px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase">
                {card.label}
              </span>
              <div
                className="text-[36px] font-bold tracking-tighter leading-none font-mono"
                style={{ color: colors.value }}
              >
                {value}
              </div>
              <span className="text-[11.5px] text-[var(--text-tertiary)] font-mono">
                {card.sub}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
