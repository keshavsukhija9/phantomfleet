import type { AgentState } from '../../types';

interface LearningSectionProps {
  state: AgentState;
}

export function LearningSection({ state }: LearningSectionProps) {
  const boosts = state.calibration_boost ?? {};
  const entries = Object.entries(boosts);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Calibration boosts */}
      <div className="panel p-5">
        <div className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-4">
          Calibration Boosts
        </div>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 text-center py-10">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-3)] text-[var(--text-tertiary)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6" /><path d="M5 8h6M8 5v6" />
              </svg>
            </div>
            <div className="text-[13px] font-semibold text-[var(--text-secondary)]">No episodes yet</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">Run more ticks to build memory</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map(([sid, val]) => {
              const isUp = val > 1;
              const isDown = val < 1;
              const cls = isUp ? 'text-[var(--green)]' : isDown ? 'text-[var(--red)]' : 'text-[var(--blue)]';
              const fillCls = isUp ? 'bg-[var(--green)]' : isDown ? 'bg-[var(--red)]' : 'bg-[var(--blue)]';
              const pct = Math.min(Math.abs(val - 1) * 250, 100);
              return (
                <div key={sid} className="flex items-center gap-3 py-1.5">
                  <span className="text-[12px] font-mono font-semibold text-[var(--text-primary)] w-[48px] shrink-0">
                    {sid}
                  </span>
                  <div className="flex-1 h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${fillCls}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold font-mono min-w-[40px] text-right ${cls}`}>
                    ×{val.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Episode count */}
      <div className="panel p-5 flex flex-col">
        <div className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-4">
          Episode Count
        </div>
        <div className="text-[52px] font-bold font-mono tracking-tighter text-[var(--amber)] leading-none">
          {state.episode_count}
        </div>
        <div className="text-[12px] text-[var(--text-tertiary)] mt-1.5">stored in ChromaDB</div>
        <div className="h-px bg-[var(--border)] my-4" />
        <div className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
          Memory adjusts <strong>score multipliers</strong> for future routing decisions.
          Carriers with high success rates score higher. Failed routes score lower.
        </div>
      </div>
    </div>
  );
}
