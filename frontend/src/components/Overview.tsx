import type { AgentState } from '../types';
import { NetworkMap } from './NetworkMap';

interface OverviewProps {
  state: AgentState;
  onHighlight: (id: string | null) => void;
}

export function Overview({ state, onHighlight }: OverviewProps) {
  const { shipments, tick, episode_count } = state;
  const list = Object.values(shipments);

  const atRiskList = list.filter(s => (s.failure_prob ?? 0) >= 0.75);
  const atRiskCount = atRiskList.length;
  const rescuedCount = list.filter(s => s.status === 'RESCUED').length;

  // Sorting risk feed by highest prob first
  const riskFeed = [...list]
    .filter(s => s.status === 'AT_RISK' || s.status === 'FAILED')
    .sort((a, b) => (b.failure_prob ?? 0) - (a.failure_prob ?? 0));

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <span className="bg-[var(--accent-danger)] text-black px-1.5 py-0.5 rounded-sm font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-wider">CRITICAL</span>;
      case 'HIGH': return <span className="bg-[var(--accent-warning)] text-black px-1.5 py-0.5 rounded-sm font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-wider">HIGH</span>;
      default: return <span className="bg-[var(--text-muted)] text-white px-1.5 py-0.5 rounded-sm font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-wider">STANDARD</span>;
    }
  };

  const getProbColor = (prob: number) => {
    if (prob >= 0.75) return 'var(--accent-danger)';
    if (prob >= 0.5) return 'var(--accent-warning)';
    return 'var(--accent-success)';
  };

  return (
    <div className="flex flex-col h-full gap-6">

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-4 gap-4">

        {/* TICK */}
        <div className="bg-[var(--bg-surface)] border-l-[3px] border-[var(--bg-border)] p-5 hover:shadow-[0_0_0_1px_var(--bg-border)] transition-shadow duration-200 group">
          <div className="font-['JetBrains_Mono'] text-4xl text-[var(--text-primary)] mb-1 group-hover:-translate-y-0.5 transition-transform duration-300">
            {tick}
          </div>
          <div className="font-['DM_Sans'] text-xs text-[var(--text-secondary)] uppercase tracking-[0.1em]">
            Current Tick
          </div>
        </div>

        {/* AT RISK */}
        <div className="bg-[var(--bg-surface)] border-l-[3px] border-[var(--accent-danger)] p-5 hover:shadow-[0_0_0_1px_var(--bg-border)] transition-shadow duration-200 group">
          <div className={`font-['JetBrains_Mono'] text-4xl text-[var(--accent-danger)] mb-1 group-hover:-translate-y-0.5 transition-transform duration-300 ${atRiskCount > 0 ? 'animate-[risk-pulse_2.5s_infinite]' : ''}`}>
            {atRiskCount}
          </div>
          <div className="font-['DM_Sans'] text-xs text-[var(--text-secondary)] uppercase tracking-[0.1em]">
            At Risk
          </div>
        </div>

        {/* RESCUED */}
        <div className="bg-[var(--bg-surface)] border-l-[3px] border-[var(--accent-success)] p-5 hover:shadow-[0_0_0_1px_var(--bg-border)] transition-shadow duration-200 group">
          <div className="font-['JetBrains_Mono'] text-4xl text-[var(--accent-success)] mb-1 group-hover:-translate-y-0.5 transition-transform duration-300">
            {rescuedCount}
          </div>
          <div className="font-['DM_Sans'] text-xs text-[var(--text-secondary)] uppercase tracking-[0.1em]">
            Rescued
          </div>
        </div>

        {/* MEMORY */}
        <div className="bg-[var(--bg-surface)] border-l-[3px] border-[var(--accent-primary)] p-5 hover:shadow-[0_0_0_1px_var(--bg-border)] transition-shadow duration-200 group">
          <div className="font-['JetBrains_Mono'] text-4xl text-[var(--accent-primary)] mb-1 group-hover:-translate-y-0.5 transition-transform duration-300">
            {episode_count}
          </div>
          <div className="font-['DM_Sans'] text-xs text-[var(--text-secondary)] uppercase tracking-[0.1em]">
            Memory Episodes
          </div>
        </div>

      </div>

      {/* 2-Column Grid */}
      <div className="flex-1 grid grid-cols-[60%_1fr] gap-6 min-h-[400px]">

        {/* Left Column: Network Map */}
        <div className="h-full bg-[var(--bg-surface)] flex flex-col">
          <div className="px-4 py-3 border-b border-[var(--bg-border)]">
            <h2 className="font-['IBM_Plex_Mono'] text-sm tracking-wider uppercase text-[var(--text-secondary)]">Live Network Map</h2>
          </div>
          <div className="flex-1 relative">
            <NetworkMap
              shipments={shipments}
              onHighlight={onHighlight}
            />
          </div>
        </div>

        {/* Right Column: Live Risk Feed */}
        <div className="h-full bg-[var(--bg-surface)] flex flex-col border border-[var(--bg-border)]">
          <div className="px-4 py-3 border-b border-[var(--bg-border)] flex justify-between items-center">
            <h2 className="font-['IBM_Plex_Mono'] text-sm tracking-wider uppercase text-[var(--text-secondary)]">Live Risk Feed</h2>
            <div className="font-['JetBrains_Mono'] text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5">
              {riskFeed.length} ACTIVE
            </div>
          </div>

          <div className="flex-1 overflow-y-auto w-full">
            {riskFeed.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-[var(--text-muted)] font-['IBM_Plex_Mono'] text-sm uppercase">
                All Shipments Nominal
              </div>
            ) : (
              <div className="flex flex-col w-full">
                {riskFeed.slice(0, 8).map(s => {
                  const prob = s.failure_prob ?? 0;
                  const color = getProbColor(prob);
                  const isExtremeRisk = prob > 0.85;

                  return (
                    <div
                      key={s.id}
                      className={`border-b border-[var(--bg-border)] p-4 flex flex-col gap-2 relative overflow-hidden group hover:bg-[var(--bg-elevated)] transition-colors animate-[slide-in-right_200ms_ease-out] ${isExtremeRisk ? 'bg-[var(--accent-danger-dim)]' : ''}`}
                      onMouseEnter={() => onHighlight(s.id)}
                      onMouseLeave={() => onHighlight(null)}
                    >
                      {/* Top row */}
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          {getPriorityBadge(s.priority)}
                          <div className="flex items-baseline gap-2">
                            <div className="font-['IBM_Plex_Mono'] font-bold text-[13px] tracking-wide text-[var(--text-primary)]">{s.id}</div>
                            <div className="font-['IBM_Plex_Mono'] text-[10px] text-[var(--text-muted)]">[{s.carrier}]</div>
                          </div>
                        </div>
                        <div className="font-['JetBrains_Mono'] text-sm" style={{ color }}>
                          {(prob * 100).toFixed(1)}%
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1 bg-[var(--bg-border)] mt-1 opacity-70">
                        <div className="h-full transition-all duration-300" style={{ width: `${prob * 100}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
