import type { AgentState } from '../../types';

interface TopbarProps {
  state: AgentState;
  autoRun: boolean;
  onToggleAutoRun: () => void;
  onRunTick: () => void;
  isLoading: boolean;
}

export function Topbar({ state, autoRun, onToggleAutoRun, onRunTick, isLoading }: TopbarProps) {
  const ships = Object.values(state.shipments);
  const atRisk = ships.filter(s => (s.failure_prob ?? 0) >= 0.75).length;
  const rescued = ships.filter(s => s.status === 'RESCUED').length;
  const pending = state.pending_approvals?.length ?? 0;

  return (
    <div className="flex items-center justify-between px-5 h-[54px] border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
      <div className="flex items-center gap-3.5">
        <span className="text-[13.5px] font-semibold text-[var(--text-primary)] tracking-tight">Operations Overview</span>
        <div className="flex items-center gap-1 text-[12px] text-[var(--text-tertiary)]">
          <span>Phantom Fleet</span>
          <span className="opacity-40 text-[11px]">/</span>
          <span>Dashboard</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--red)]/20 bg-[var(--red-bg)] text-[12px] font-medium text-[var(--red)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
          <span>{atRisk}</span> at risk
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--green)]/20 bg-[var(--green-bg)] text-[12px] font-medium text-[var(--green)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
          <span>{rescued}</span> rescued
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--amber)]/20 bg-[var(--amber-bg)] text-[12px] font-medium text-[var(--amber)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
          <span>{pending}</span> pending
        </div>
        <div className="w-px h-5 bg-[var(--border-md)] mx-0.5" />
        <button
          type="button"
          onClick={onToggleAutoRun}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] border transition-all
            ${autoRun
              ? 'border-[var(--green)]/30 text-[var(--green)] bg-[var(--green)]/10'
              : 'border-[var(--border-md)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
            }
          `}
        >
          {autoRun ? (
            <>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="3" height="8" rx="1" />
                <rect x="7" y="2" width="3" height="8" rx="1" />
              </svg>
              Stop auto-run
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="6" cy="6" r="5" />
                <path d="M6 3v3l2 2" />
              </svg>
              Auto
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onRunTick}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--blue)] text-white border-0 rounded-md text-[12.5px] font-semibold hover:bg-[#c2410c] hover:-translate-y-px hover:shadow-lg hover:shadow-[var(--blue)]/35 active:translate-y-0 transition-all"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
            <polygon points="3,1 11,6 3,11" />
          </svg>
          {isLoading ? 'Running…' : 'Run Tick'}
        </button>
      </div>
    </div>
  );
}
