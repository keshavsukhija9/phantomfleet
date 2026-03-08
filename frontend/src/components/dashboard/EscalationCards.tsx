import type { AgentState } from '../../types';

interface EscalationCardsProps {
  state: AgentState;
  onApprove: (id: string, decision: 'approve' | 'reject') => void;
  loadingId: string | null;
}

function getPriorityClass(priority: string) {
  if (priority === 'CRITICAL') return 'bg-[var(--red-bg)] text-[var(--red)] border-[var(--red-border)]';
  if (priority === 'HIGH') return 'bg-[var(--orange-bg)] text-[var(--orange)] border-[var(--orange)]/20';
  return 'bg-[var(--surface-3)] text-[var(--text-secondary)] border-[var(--border)]';
}

export function EscalationCards({ state, onApprove, loadingId }: EscalationCardsProps) {
  const pending = state.pending_approvals ?? [];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] shrink-0">
        <span className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Human Approval</span>
        {pending.length > 0 && (
          <span className="text-[10px] font-mono font-semibold text-[var(--amber)] bg-[var(--amber-bg)] border border-[var(--amber)]/20 px-2 py-0.5 rounded-md">
            {pending.length} pending
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-center py-8">
            <div className="w-9 h-9 rounded-lg bg-[var(--green-bg)] text-[var(--green)] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8 L5.5 11.5 L14 3" />
              </svg>
            </div>
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">All clear</div>
            <div className="text-[11.5px] text-[var(--text-tertiary)]">No approvals needed right now</div>
          </div>
        ) : (
          pending.map((iid, i) => {
            const inv = state.interventions[iid];
            const ship = inv ? state.shipments[inv.shipment_id] : null;
            if (!inv || !ship) return null;
            const badgeClass = getPriorityClass(ship.priority);
            return (
              <div
                key={iid}
                className="panel overflow-hidden animate-[cardIn_0.35s_ease_forwards] hover:shadow-md hover:border-[var(--border-md)] transition-all"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="flex items-center justify-between px-3.5 py-3">
                  <span className="text-[15px] font-bold text-[var(--text-primary)] tracking-tight font-mono">{inv.shipment_id}</span>
                  <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded uppercase font-mono border ${badgeClass}`}>{ship.priority}</span>
                </div>
                <div className="grid grid-cols-3 gap-0 px-3.5 pb-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium">ETA Gain</span>
                    <span className="text-[13px] font-bold font-mono text-[var(--green)]">+{inv.predicted_eta_gain.toFixed(1)}h</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium">Cost Δ</span>
                    <span className="text-[13px] font-bold font-mono text-[var(--orange)]">+{inv.cost_delta_pct.toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium">Revival</span>
                    <span className="text-[13px] font-bold font-mono text-[var(--blue)]">{Math.round(inv.revival_prob * 100)}%</span>
                  </div>
                </div>
                <div className="mx-3.5 mb-2 px-2.5 py-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-md text-[11.5px] font-mono font-medium text-[var(--text-primary)]">
                  {inv.path}
                </div>
                <div className="mx-3.5 mb-2.5 text-[11.5px] text-[var(--text-secondary)] italic leading-snug">
                  &quot;{inv.causal_reason}&quot;
                </div>
                <div className="grid grid-cols-2 gap-2 p-2.5 pt-2 border-t border-[var(--border)] bg-[var(--surface-2)]">
                  <button
                    type="button"
                    onClick={() => onApprove(iid, 'approve')}
                    disabled={loadingId === iid}
                    className="py-2 bg-[var(--green)] text-white border-0 rounded-md text-[12px] font-semibold hover:bg-[#059669] hover:-translate-y-px hover:shadow-lg hover:shadow-[var(--green)]/25 active:translate-y-0 transition-all disabled:opacity-50"
                  >
                    {loadingId === iid ? '…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onApprove(iid, 'reject')}
                    disabled={loadingId === iid}
                    className="py-2 bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] rounded-md text-[12px] font-medium hover:bg-[var(--red-bg)] hover:border-[var(--red-border)] hover:text-[var(--red)] transition-all disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
