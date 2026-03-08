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
    const color = value >= 0.75 ? 'var(--accent-success)' : value >= 0.4 ? 'var(--accent-warning)' : 'var(--accent-danger)';

    return (
      <div className="relative flex items-center justify-center w-10 h-10">
        <svg className="transform -rotate-90 w-10 h-10">
          <circle cx="20" cy="20" r={radius} stroke="var(--bg-border)" strokeWidth="3" fill="none" />
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

      {/* PENDING SECTION */}
      {pendingItems.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="w-full bg-[var(--accent-warning-dim)] border border-[var(--accent-warning)] text-[var(--accent-warning)] p-3 flex items-center gap-3 font-['IBM_Plex_Mono'] text-sm tracking-wider uppercase">
            <AlertTriangle size={18} />
            {pendingItems.length} INTERVENTIONS REQUIRE HUMAN APPROVAL
          </div>

          <div className="flex flex-col gap-4">
            {pendingItems.map(inv => {
              const isCollapsing = collapsingIds[inv.id];
              const isLoading = loadingId === inv.id;

              let collapseClass = "";
              if (isCollapsing === 'approve') collapseClass = "animate-[card-collapse_400ms_ease-in_forwards] border-l-[var(--accent-success)] bg-[var(--accent-success-dim)]";
              if (isCollapsing === 'reject') collapseClass = "animate-[card-collapse_400ms_ease-in_forwards] border-l-[var(--accent-danger)] bg-[var(--accent-danger-dim)]";

              return (
                <div
                  key={inv.id}
                  className={`bg-[var(--bg-surface)] border border-[var(--accent-warning)] border-l-[3px] p-5 flex flex-col gap-4 transition-colors ${collapseClass}`}
                >
                  {/* Top Row */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="font-['IBM_Plex_Mono'] text-lg font-bold text-[var(--accent-primary)] tracking-wide">
                        {inv.shipment_id}
                      </span>
                      <span className="bg-[var(--accent-danger)] text-black font-['IBM_Plex_Mono'] text-[10px] uppercase px-2 py-0.5 tracking-wider">CRITICAL</span>
                      <span className="border border-[var(--bg-border)] text-[var(--text-secondary)] font-['JetBrains_Mono'] text-[10px] px-2 py-0.5">
                        SCORE: {inv.score.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Content Grid */}
                  <div className="grid grid-cols-[1fr_auto] gap-8 bg-[var(--bg-base)] border border-[var(--bg-border)] p-4">

                    {/* Path */}
                    <div className="flex items-center gap-3 font-['IBM_Plex_Mono'] text-sm">
                      <GitCommit className="text-[var(--text-muted)]" size={16} />
                      <span className="text-[var(--text-primary)]">W3</span>
                      <span className="text-[var(--text-muted)]">→</span>
                      <span className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] px-2 py-1 text-[var(--accent-primary)]">
                        [{inv.path.split(' - ')[0] || 'TRUCK C5'}]
                      </span>
                      <span className="text-[var(--text-muted)]">→</span>
                      <span className="text-[var(--text-primary)]">D2</span>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col gap-1 items-end">
                        <span className="font-['DM_Sans'] text-[10px] uppercase text-[var(--text-secondary)] tracking-widest">ETA Gain</span>
                        <div className="flex items-center gap-1 text-[var(--accent-success)] font-['JetBrains_Mono'] text-sm">
                          <ArrowUpRight size={14} /> {inv.predicted_eta_gain.toFixed(1)}h
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 items-end">
                        <span className="font-['DM_Sans'] text-[10px] uppercase text-[var(--text-secondary)] tracking-widest">Cost Δ</span>
                        <div className="flex items-center gap-1 text-[var(--accent-warning)] font-['JetBrains_Mono'] text-sm">
                          <TrendingDown size={14} /> +{inv.cost_delta_pct.toFixed(1)}%
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 items-center">
                        <span className="font-['DM_Sans'] text-[10px] uppercase text-[var(--text-secondary)] tracking-widest">Revival</span>
                        <CircularProgress value={inv.revival_prob} />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: AI Reasoning */}
                  <div className="bg-[var(--bg-base)] border-l-[3px] border-[var(--text-muted)] p-3 text-[var(--text-secondary)] font-['DM_Sans'] italic text-[13px] leading-relaxed">
                    "{causalMap[inv.shipment_id]?.hypothesis || "Analysis pending... System executing standard protocol."}"
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      onClick={() => handleAction(inv.id, 'reject')}
                      disabled={isLoading}
                      className="border border-[var(--accent-danger)] text-[var(--accent-danger)] hover:bg-[var(--accent-danger-dim)] px-6 py-2 min-w-[120px] disabled:opacity-50"
                    >
                      {isLoading && collapsingIds[inv.id] === 'reject' ? '...' : 'REJECT'}
                    </button>
                    <button
                      onClick={() => handleAction(inv.id, 'approve')}
                      disabled={isLoading}
                      className="bg-[var(--accent-success)] text-black hover:brightness-110 px-6 py-2 min-w-[120px] font-bold disabled:opacity-50 border border-[var(--accent-success)]"
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

      {/* AUTO-EXECUTED SECTION */}
      <div className="flex flex-col gap-4 mt-8">
        <h3 className="font-['IBM_Plex_Mono'] text-sm tracking-wider uppercase text-[var(--text-secondary)] mb-2 border-b border-[var(--bg-border)] pb-2 flex items-center gap-2">
          <Clock size={16} /> Auto-Executed History
        </h3>

        {historyItems.length === 0 ? (
          <div className="text-[var(--text-muted)] font-['IBM_Plex_Mono'] text-xs">No execution history for this session.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {historyItems.map(inv => (
              <div key={inv.id} className="flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--bg-border)] p-3 hover:bg-[var(--bg-elevated)] transition-colors opacity-80">
                <div className="flex items-center gap-4">
                  <span className="font-['IBM_Plex_Mono'] text-xs font-bold text-[var(--text-primary)] w-20">
                    {inv.shipment_id}
                  </span>
                  <span className="font-['IBM_Plex_Mono'] text-xs text-[var(--text-secondary)]">
                    {inv.path}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[var(--text-muted)]">
                    Score: {inv.score.toFixed(2)}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-['IBM_Plex_Mono'] ${inv.outcome === 'SUCCESS'
                    ? 'text-[var(--accent-success)] bg-[var(--accent-success-dim)] border border-[var(--accent-success)]'
                    : inv.outcome === 'PENDING'
                      ? 'text-[var(--accent-warning)] bg-[var(--accent-warning-dim)] border border-[var(--accent-warning)]'
                      : 'text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--bg-border)]'
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
