import type { AgentState } from '../../types';

const ORDAL = [
  { id: 'observe', label: 'Observe', num: '1' },
  { id: 'assess', label: 'Assess', num: '2' },
  { id: 'reason', label: 'Reason', num: '3' },
  { id: 'plan', label: 'Plan', num: '4' },
  { id: 'act', label: 'Act', num: '5' },
  { id: 'learn', label: 'Learn', num: '6' },
];

interface OrdalStripProps {
  state: AgentState;
}

export function OrdalStrip({ state }: OrdalStripProps) {
  const tick = state.tick;
  const activeIndex = tick === 0 ? -1 : Math.min((tick % 6), 6);

  return (
    <div className="panel px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">
          Agent Loop
        </span>
        <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
          Observe → Reason → Decide → Act → Learn
        </span>
      </div>
      <div className="flex items-center">
        {ORDAL.map((node, i) => {
          const done = activeIndex >= 0 && i < activeIndex;
          const active = i === activeIndex;
          return (
            <div key={node.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold font-mono transition-all duration-300
                    ${done
                      ? 'bg-[var(--blue)] text-white shadow-[0_0_12px_var(--blue-glow)]'
                      : active
                        ? 'bg-[var(--blue-glow)] text-[var(--blue)] border-2 border-[var(--blue)] shadow-[0_0_0_4px_var(--blue-glow)]'
                        : 'bg-[var(--surface-2)] text-[var(--text-tertiary)] border border-[var(--border)]'
                    }
                  `}
                >
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  ) : (
                    node.num
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${active ? 'text-[var(--blue)] font-semibold' : done ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'
                  }`}>
                  {node.label}
                </span>
              </div>
              {i < ORDAL.length - 1 && (
                <div className="flex-1 h-px mx-2" style={{
                  background: done
                    ? 'var(--blue)'
                    : 'var(--border-md)',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
