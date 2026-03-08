import type { AgentState } from '../../types';

interface ReasoningCardProps {
  state: AgentState;
}

const CAUSE_CLASS: Record<string, string> = {
  CARRIER_DEGRADATION: 'bg-[var(--red-bg)] text-[var(--red)] border-[var(--red-border)]',
  WAREHOUSE_CONGESTION: 'bg-[var(--orange-bg)] text-[var(--orange)] border-[var(--orange)]/20',
  WEATHER: 'bg-[#EFF6FF] text-[var(--blue)] border-[var(--blue-border)]',
  COMPOUND: 'bg-[var(--amber-bg)] text-[var(--amber)] border-[var(--amber)]/20',
};

export function ReasoningCard({ state }: ReasoningCardProps) {
  const topSid = state.active_at_risk?.[0];
  const causal = topSid ? state.causal_map?.[topSid] : null;
  const shap = topSid && state.shap_map?.[topSid] ? (state.shap_map[topSid] as Record<string, number>) : null;

  if (!causal) {
    return (
      <div className="p-5 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Agent Reasoning</span>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--blue-glow)] border border-[var(--blue-border)] text-[10px] font-semibold text-[var(--blue)] font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)]" />
            Agent API
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <div className="w-9 h-9 rounded-lg bg-[var(--blue-glow)] text-[var(--blue)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6" />
              <path d="M5.5 6.5 Q8 4 10.5 6.5 Q8 9 5.5 6.5" />
            </svg>
          </div>
          <div className="text-[13px] font-semibold text-[var(--text-primary)]">Awaiting analysis</div>
          <div className="text-[11.5px] text-[var(--text-tertiary)]">Run a tick to trigger agent</div>
        </div>
      </div>
    );
  }

  const cause = causal.primary_cause ?? 'UNKNOWN';
  const causeClass = CAUSE_CLASS[cause] ?? CAUSE_CLASS.CARRIER_DEGRADATION;
  const conf = Math.round((causal.confidence ?? 0) * 100);
  const shapEntries = shap ? Object.entries(shap) : [];

  return (
    <div className="p-5 border-b border-[var(--border)] shrink-0">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Agent Reasoning</span>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--blue-glow)] border border-[var(--blue-border)] text-[10px] font-semibold text-[var(--blue)] font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)]" />
          Agent API
        </div>
      </div>
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className="text-[26px] font-bold text-[var(--text-primary)] tracking-tight font-mono leading-none">{topSid}</span>
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider font-mono border ${causeClass}`}>
          {cause.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[11px] text-[var(--text-secondary)]">Confidence</span>
        <div className="flex-1 h-1 bg-[var(--surface-3)] rounded-sm overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--blue)] to-[#60A5FA] rounded-sm transition-all duration-500" style={{ width: `${conf}%` }} />
        </div>
        <span className="text-[11px] font-semibold font-mono text-[var(--blue)] min-w-8 text-right">{conf}%</span>
      </div>
      <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] border border-[var(--border)] border-l-[3px] border-l-[var(--blue)] text-[12px] leading-relaxed text-[var(--text-secondary)] mb-3.5">
        {causal.hypothesis}
      </div>
      {shapEntries.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[10.5px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">SHAP Drivers</div>
          {shapEntries.map(([feat, v]) => {
            const pct = Math.min(Math.abs(v) * 250, 100);
            const isPos = v > 0;
            return (
              <div key={feat} className={`flex items-center gap-2 ${isPos ? 'shap-pos' : 'shap-neg'}`}>
                <span className="text-[11px] text-[var(--text-secondary)] font-mono w-[130px] truncate shrink-0">{feat}</span>
                <div className="flex-1 h-1 bg-[var(--surface-3)] rounded-sm overflow-hidden">
                  <div className={`h-full rounded-sm ${isPos ? 'bg-[var(--red)]' : 'bg-[var(--green)]'}`} style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-[10.5px] font-semibold font-mono min-w-[38px] text-right ${isPos ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>
                  {v > 0 ? '+' : ''}{Number(v).toFixed(3)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
