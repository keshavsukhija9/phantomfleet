import { useState } from 'react';
import type { Intervention } from '../types';
import { ArrowUpRight, TrendingDown, Clock, GitCommit, AlertTriangle } from 'lucide-react';

interface InterventionsProps {
  interventions: Record<string, Intervention>;
  pendingApprovals: string[];
  onApprove: (id: string, decision: 'approve' | 'reject') => void;
  loadingId: string | null;
  causalMap: Record<string, any>;
}

export function Interventions({
  interventions,
  pendingApprovals,
  onApprove,
  loadingId,
  causalMap,
}: InterventionsProps) {
  const [collapsingIds, setCollapsingIds] = useState<Record<string, 'approve' | 'reject'>>({});

  const list = Object.values(interventions).reverse();
  const pendingSet = new Set(pendingApprovals);

  const pendingItems = list.filter(inv => pendingSet.has(inv.id));
  const historyItems = list.filter(inv => !pendingSet.has(inv.id));

  const handleAction = async (id: string, decision: 'approve' | 'reject') => {
    onApprove(id, decision);
    // Simulate animation wait before removing
    setCollapsingIds(prev => ({ ...prev, [id]: decision }));
  };

  const CircularProgress = ({ value }: { value: number }) => {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - value * circumference;
    const color = value >= 0.75 ? 'var(--success)' : value >= 0.4 ? 'var(--warning)' : 'var(--danger)';

    return (
      <div className="relative flex items-center justify-center w-10 h-10">
        <svg className="transform -rotate-90 w-10 h-10">
          <circle cx="20" cy="20" r={radius} stroke="var(--border)" strokeWidth="3" fill="none" />
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute font-['JetBrains_Mono'] text-[10px]" style={{ color }}>
          {Math.round(value * 100)}%
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-12">
      {pendingItems.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="card w-full bg-[var(--warning-bg)] border-[var(--warning)] text-[var(--warning)] p-4 rounded-[var(--radius-card)] flex items-center gap-3 font-semibold text-sm">
            <AlertTriangle size={20} />
            {pendingItems.length} intervention{pendingItems.length !== 1 ? 's' : ''} need your approval
          </div>

          <div className="flex flex-col gap-4">
            {pendingItems.map(inv => {
              const isCollapsing = collapsingIds[inv.id];
              const isLoading = loadingId === inv.id;
              let collapseClass = "";
              if (isCollapsing === 'approve') collapseClass = "animate-[card-collapse_400ms_ease-in_forwards] border-l-4 border-l-[var(--success)] bg-[var(--success-bg)]";
              if (isCollapsing === 'reject') collapseClass = "animate-[card-collapse_400ms_ease-in_forwards] border-l-4 border-l-[var(--danger)] bg-[var(--danger-bg)]";

              return (
                <div
                  key={inv.id}
                  className={`card border-l-4 border-l-[var(--warning)] p-6 flex flex-col gap-4 transition-colors ${collapseClass}`}
                >
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-lg font-semibold text-[var(--accent)]">
                        {inv.shipment_id}
                      </span>
                      <span className="bg-[var(--danger)] text-white text-[10px] font-semibold uppercase px-2 py-0.5 tracking-wider rounded">Critical</span>
                      <span className="border border-[var(--border)] text-[var(--text-secondary)] text-xs px-2 py-0.5 rounded-[var(--radius-btn)] tabular-nums">
                        Score {inv.score.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 bg-[var(--bg-elevated)] border border-[var(--border)] p-4 rounded-[var(--radius-card)]">
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <GitCommit className="text-[var(--text-muted)]" size={16} />
                      <span className="text-[var(--text-primary)]">W3</span>
                      <span className="text-[var(--text-muted)]">→</span>
                      <span className="bg-[var(--bg-elevated)] border border-[var(--border)] px-2 py-1 text-[var(--accent)] rounded-[var(--radius-btn)] font-medium">
                        [{inv.path.split(' - ')[0] || 'TRUCK C5'}]
                      </span>
                      <span className="text-[var(--text-muted)]">→</span>
                      <span className="text-[var(--text-primary)]">D2</span>
                    </div>

                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">ETA gain</span>
                        <div className="flex items-center gap-1 text-[var(--success)] font-semibold text-sm tabular-nums">
                          <ArrowUpRight size={14} /> {inv.predicted_eta_gain.toFixed(1)}h
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Cost Δ</span>
                        <div className="flex items-center gap-1 text-[var(--warning)] font-semibold text-sm tabular-nums">
                          <TrendingDown size={14} /> +{inv.cost_delta_pct.toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-center">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Revival</span>
                        <CircularProgress value={inv.revival_prob} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-elevated)] border-l-[3px] border-[var(--text-muted)] p-4 rounded-r-lg text-[var(--text-secondary)] italic text-sm leading-relaxed">
                    "{causalMap[inv.shipment_id]?.hypothesis || "Analysis pending... System executing standard protocol."}"
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      onClick={() => handleAction(inv.id, 'reject')}
                      disabled={isLoading}
                      className="border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger-bg)] px-6 py-2 min-w-[100px] rounded disabled:opacity-50 transition-colors"
                    >
                      {isLoading && collapsingIds[inv.id] === 'reject' ? '...' : 'REJECT'}
                    </button>
                    <button
                      onClick={() => handleAction(inv.id, 'approve')}
                      disabled={isLoading}
                      className="bg-[var(--success)] text-white hover:brightness-110 px-6 py-2 min-w-[100px] font-bold rounded disabled:opacity-50 border border-[var(--success)] transition-all"
                    >
                      {isLoading && collapsingIds[inv.id] === 'approve' ? '...' : 'APPROVE'}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 mt-8">
        <h3 className="font-[var(--font-sans)] text-sm tracking-wider uppercase text-[var(--text-secondary)] mb-2 border-b border-[var(--border)] pb-2 flex items-center gap-2">
          <Clock size={16} /> Auto-Executed History
        </h3>

        {historyItems.length === 0 ? (
          <div className="text-[var(--text-muted)] font-[var(--font-sans)] text-xs">No execution history for this session.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {historyItems.map(inv => (
              <div key={inv.id} className="flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border)] p-3 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
                <div className="flex items-center gap-4 flex-wrap min-w-0">
                  <span className="font-[var(--font-sans)] text-xs font-bold text-[var(--text-primary)] w-20 shrink-0">
                    {inv.shipment_id}
                  </span>
                  <span className="font-[var(--font-sans)] text-xs text-[var(--text-secondary)] truncate">
                    {inv.path}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-[var(--font-sans)] text-[10px] text-[var(--text-muted)]">
                    Score: {inv.score.toFixed(2)}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-[var(--font-sans)] ${inv.outcome === 'SUCCESS'
                    ? 'text-[var(--success)] bg-[var(--success-bg)] border border-[var(--success)]'
                    : inv.outcome === 'PENDING'
                      ? 'text-[var(--warning)] bg-[var(--accent-warning-dim)] border border-[var(--warning)]'
                      : 'text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border)]'
                    }`}>
                    {inv.outcome}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
