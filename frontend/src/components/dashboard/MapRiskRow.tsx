import type { AgentState } from '../../types';
import { NetworkMap } from '../NetworkMap';

interface MapRiskRowProps {
  state: AgentState;
  onHighlight: (id: string | null) => void;
}

function getPriorityClass(priority: string) {
  if (priority === 'CRITICAL') return 'bg-[var(--red-bg)] text-[var(--red)] border-[var(--red-border)]';
  if (priority === 'HIGH') return 'bg-[var(--orange-bg)] text-[var(--orange)] border-[var(--orange)]/20';
  return 'bg-[var(--surface-3)] text-[var(--text-tertiary)] border-[var(--border)]';
}

export function MapRiskRow({ state, onHighlight }: MapRiskRowProps) {
  const ships = Object.values(state.shipments)
    .filter(s => (s.failure_prob ?? 0) >= 0.4)
    .sort((a, b) => (b.failure_prob ?? 0) - (a.failure_prob ?? 0))
    .slice(0, 12);
  const atRiskCount = ships.filter(s => (s.failure_prob ?? 0) >= 0.75).length;

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 380px' }}>
      {/* Map panel */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5 text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">
            <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" style={{ boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }} />
            India Logistics Network
          </div>
        </div>
        <div className="h-[320px] bg-[#111921] overflow-hidden">
          <NetworkMap shipments={state.shipments} onHighlight={onHighlight} />
        </div>
        <div className="flex items-center gap-5 px-5 py-2.5 border-t border-[var(--border)] bg-[var(--surface)]">
          {[
            { color: 'var(--red)', label: 'Critical' },
            { color: 'var(--orange)', label: 'High risk' },
            { color: 'var(--green)', label: 'Rescued' },
            { color: 'var(--blue)', label: 'Warehouse' },
            { color: 'var(--amber)', label: 'Destination' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Risk feed panel */}
      <div className="panel overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] shrink-0">
          <span className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">Risk Feed</span>
          {atRiskCount > 0 && (
            <span className="text-[10.5px] font-mono font-semibold text-[var(--red)] bg-[var(--red-bg)] border border-[var(--red-border)] px-2 py-0.5 rounded-md">
              {atRiskCount} critical
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {ships.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-tertiary)] text-[13px]">
              No shipments in risk range
            </div>
          ) : (
            ships.map((ship, i) => {
              const pct = Math.round((ship.failure_prob ?? 0) * 100);
              const barColor = pct > 80 ? 'var(--red)' : pct > 65 ? 'var(--orange)' : 'var(--amber)';
              return (
                <div
                  key={ship.id}
                  className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] last:border-0 cursor-pointer hover:bg-[var(--surface-2)] transition-colors animate-[rowIn_0.3s_ease_forwards]"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <span className="font-mono text-[12px] font-semibold text-[var(--text-primary)] w-[80px] truncate shrink-0">
                    {ship.id}
                  </span>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-[3px] bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                    <span className="text-[10.5px] text-[var(--text-tertiary)] font-mono">
                      {ship.carrier} · {ship.status}
                    </span>
                  </div>
                  <span className="font-mono text-[13px] font-bold min-w-[38px] text-right" style={{ color: barColor }}>
                    {pct}%
                  </span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase font-mono border ${getPriorityClass(ship.priority)}`}>
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
