import type { AgentState } from '../../types';
import { NetworkMap } from '../NetworkMap';

interface MapRiskRowProps {
  state: AgentState;
  onHighlight: (id: string | null) => void;
}

function getPriorityClass(priority: string) {
  if (priority === 'CRITICAL') return 'bg-[var(--red-bg)] text-[var(--red)] border-[var(--red-border)]';
  if (priority === 'HIGH') return 'bg-[var(--orange-bg)] text-[var(--orange)] border-[var(--orange)]/20';
  return 'bg-[var(--surface-3)] text-[var(--text-secondary)] border-[var(--border)]';
}

export function MapRiskRow({ state, onHighlight }: MapRiskRowProps) {
  const ships = Object.values(state.shipments)
    .filter(s => (s.failure_prob ?? 0) >= 0.4)
    .sort((a, b) => (b.failure_prob ?? 0) - (a.failure_prob ?? 0))
    .slice(0, 14);
  const atRiskCount = ships.filter(s => (s.failure_prob ?? 0) >= 0.75).length;

  return (
    <div className="grid grid-cols-[1fr_360px] gap-3">
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" style={{ boxShadow: '0 0 0 2px rgba(34,197,94,0.3)' }} />
            India Logistics Network
          </div>
          <span className="text-[11.5px] font-medium text-[var(--blue)] cursor-pointer px-2 py-1 rounded-md hover:bg-[var(--blue-glow)] transition-colors">Full screen</span>
        </div>
        <div className="h-[280px] bg-[#1a2332] overflow-hidden">
          <NetworkMap shipments={state.shipments} onHighlight={onHighlight} />
        </div>
        <div className="flex items-center gap-3.5 px-4 py-2.5 border-t border-[var(--border)]">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" /> Critical risk
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--orange)]" /> High risk
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" /> Rescued
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)]" /> Warehouse
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" /> Destination
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
          <div className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">Risk Feed</div>
          <span className="text-[11.5px] font-medium text-[var(--text-secondary)]">{atRiskCount} at risk</span>
        </div>
        <div className="max-h-[338px] overflow-y-auto">
          {ships.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-tertiary)] text-sm">No shipments in risk range</div>
          ) : (
            ships.map((ship, i) => {
              const pct = Math.round((ship.failure_prob ?? 0) * 100);
              const barColor = (ship.failure_prob ?? 0) > 0.8 ? 'var(--red)' : (ship.failure_prob ?? 0) > 0.65 ? 'var(--orange)' : 'var(--amber)';
              return (
                <div
                  key={ship.id}
                  className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--surface-2)] transition-colors animate-[rowIn_0.3s_ease_forwards]"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <span className="font-mono text-[12px] font-semibold text-[var(--text-primary)] w-10 shrink-0">{ship.id}</span>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="h-[3px] bg-[var(--surface-3)] rounded-sm overflow-hidden">
                      <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{ship.carrier} · {ship.status}</span>
                  </div>
                  <span className="font-mono text-[12px] font-semibold min-w-[34px] text-right" style={{ color: barColor }}>{pct}%</span>
                  <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded uppercase font-mono border ${getPriorityClass(ship.priority)}`}>
                    {ship.priority.slice(0, 4)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
