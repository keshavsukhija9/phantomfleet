import type { AgentState } from '../../types';

const ORDAL = [
  { id: 'observe', label: 'Observe', num: '1' },
  { id: 'assess', label: 'Risk\nAssess', num: '2' },
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
    <div className="panel p-4">
      <div className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3.5">Agent Loop Status</div>
      <div className="flex items-center gap-0">
        {ORDAL.map((node, i) => {
          const done = activeIndex >= 0 && i < activeIndex;
          const active = i === activeIndex;
          return (
            <div key={node.id} className="flex flex-col items-center gap-1.5 flex-1 relative" style={{ zIndex: 1 }}>
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold font-mono border-[1.5px] border-[var(--border)] bg-[var(--surface)] transition-all
                  ${done ? '!bg-[var(--navy-900)] !text-white !border-[var(--navy-900)]' : ''}
                  ${active ? '!bg-[var(--blue-glow)] !text-[var(--blue)] !border-[var(--blue)] shadow-[0_0_0_4px_var(--blue-glow)]' : ''}
                `}
              >
                {node.num}
              </div>
              <div className={`text-[10px] font-medium text-[var(--text-tertiary)] text-center leading-tight ${done ? 'text-[var(--text-secondary)]' : ''} ${active ? '!text-[var(--blue)] font-semibold' : ''}`}>
                {node.label.split('\n').map((line, j) => (
                  <span key={j}>{line}<br /></span>
                ))}
              </div>
              {i < ORDAL.length - 1 && (
                <div className="absolute top-[18px] left-[50%] w-full h-px bg-[var(--border-md)] z-0" style={{ transform: 'translateY(-50%)' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
