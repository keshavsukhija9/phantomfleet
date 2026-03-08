import type { AgentState } from '../../types';

interface EscalationCardsProps {
  state: AgentState;
  onApprove: (id: string, decision: 'approve' | 'reject') => void;
  loadingId: string | null;
}

function getPriorityClass(priority: string) {
  if (priority === 'CRITICAL') return 'bg-[var(--red-bg)] text-[var(--red)] border-[var(--red-border)]';
  if (priority === 'HIGH') return 'bg-[var(--orange-bg)] text-[var(--orange)] border-[var(--orange)]/20';
  return 'bg-[var(--surface-3)] text-[var(--text-tertiary)] border-[var(--border)]';
}

export function EscalationCards({ state, onApprove, loadingId }: EscalationCardsProps) {
  const pending = state.pending_approvals ?? [];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] shrink-0">
        <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">
          Human Approval
        </span>
        {pending.length > 0 && (
          <span className="text-[10px] font-mono font-semibold text-[var(--amber)] bg-[var(--amber-bg)] border border-[var(--amber)]/15 px-2 py-0.5 rounded-md">
            {pending.length} pending
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 text-center py-10">
            <div className="w-10 h-10 rounded-xl bg-[var(--green-bg)] text-[var(--green)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8 L5.5 11.5 L14 3" />
              </svg>
            </div>
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">All clear</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">No approvals needed right now</div>
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
                className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl overflow-hidden animate-[cardIn_0.35s_ease_forwards] hover:border-[var(--border-md)] transition-all"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[14px] font-bold text-[var(--text-primary)] tracking-tight font-mono">
                    {inv.shipment_id}
                  </span>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md uppercase font-mono border ${badgeClass}`}>
                    {ship.priority}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-0 px-4 pb-3">
                  <Metric label="ETA Gain" value={`+${inv.predicted_eta_gain.toFixed(1)}h`} color="var(--green)" />
                  <Metric label="Cost Δ" value={`+${inv.cost_delta_pct.toFixed(1)}%`} color="var(--orange)" />
                  <Metric label="Revival" value={`${Math.round(inv.revival_prob * 100)}%`} color="var(--blue)" />
                </div>

                {/* Route */}
                <div className="mx-4 mb-2.5 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[12px] font-mono font-medium text-[var(--text-primary)]">
                  {inv.path}
                </div>

                {/* Reason */}
                <div className="mx-4 mb-3 text-[12px] text-[var(--text-secondary)] italic leading-relaxed">
                  &quot;{inv.causal_reason}&quot;
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2.5 p-3 border-t border-[var(--border)] bg-[var(--surface)]">
                  <button
                    type="button"
                    onClick={() => onApprove(iid, 'approve')}
                    disabled={loadingId === iid}
                    className="py-2.5 bg-[var(--green)] text-white border-0 rounded-lg text-[12px] font-semibold hover:brightness-110 hover:-translate-y-px hover:shadow-lg hover:shadow-[var(--green)]/20 active:translate-y-0 transition-all disabled:opacity-45"
                  >
                    {loadingId === iid ? '…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onApprove(iid, 'reject')}
                    disabled={loadingId === iid}
                    className="py-2.5 bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)] rounded-lg text-[12px] font-medium hover:bg-[var(--red-bg)] hover:border-[var(--red-border)] hover:text-[var(--red)] transition-all disabled:opacity-45"
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

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">{label}</span>
      <span className="text-[14px] font-bold font-mono" style={{ color }}>{value}</span>
    </div>
  );
}
