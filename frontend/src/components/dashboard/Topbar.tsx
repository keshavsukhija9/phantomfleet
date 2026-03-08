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
    <div className="flex items-center justify-between px-6 h-[52px] border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[14px] font-semibold text-[var(--text-primary)] tracking-tight">
          Operations Overview
        </span>
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
          <span className="opacity-40">/</span>
          <span>Dashboard</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Status badges */}
        <StatusBadge color="red" count={atRisk} label="at risk" />
        <StatusBadge color="green" count={rescued} label="rescued" />
        {pending > 0 && <StatusBadge color="amber" count={pending} label="pending" />}

        <div className="w-px h-5 bg-[var(--border-strong)] mx-1" />

        {/* Auto-run toggle */}
        <button
          type="button"
          onClick={onToggleAutoRun}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all
            ${autoRun
              ? 'border-[var(--green)]/25 text-[var(--green)] bg-[var(--green)]/8'
              : 'border-[var(--border-md)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
            }
          `}
        >
          {autoRun ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
              Auto
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="6" cy="6" r="5" />
                <path d="M6 3v3l2 2" />
              </svg>
              Auto
            </>
          )}
        </button>

        {/* Run tick button */}
        <button
          type="button"
          onClick={onRunTick}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--blue)] text-white border-0 rounded-lg text-[12.5px] font-semibold hover:brightness-110 hover:-translate-y-px hover:shadow-lg hover:shadow-[var(--blue)]/25 active:translate-y-0 transition-all disabled:opacity-45 disabled:translate-y-0 disabled:shadow-none"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
            <polygon points="3,1 11,6 3,11" />
          </svg>
          {isLoading ? 'Running…' : 'Run Tick'}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ color, count, label }: { color: string; count: number; label: string }) {
  const colorMap: Record<string, string> = {
    red: 'border-[var(--red)]/15 bg-[var(--red-bg)] text-[var(--red)]',
    green: 'border-[var(--green)]/15 bg-[var(--green-bg)] text-[var(--green)]',
    amber: 'border-[var(--amber)]/15 bg-[var(--amber-bg)] text-[var(--amber)]',
  };
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11.5px] font-medium ${colorMap[color]}`}>
      <div className={`w-1.5 h-1.5 rounded-full bg-current`} />
      <span className="font-mono font-semibold">{count}</span>
      <span className="opacity-75">{label}</span>
    </div>
  );
}
