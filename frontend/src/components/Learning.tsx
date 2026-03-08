import { useMemo } from 'react';
import type { AgentState } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { Database, Percent, Award, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface LearningProps {
  episodeCount: number;
  calibrationBoost: AgentState['calibration_boost'];
  storedEpisodes: string[];
}

interface ParsedEpisode {
  raw: string;
  id: string;
  path: string;
  outcome: string;
  score: string;
  carrier: string;
}

export function Learning({ episodeCount, calibrationBoost, storedEpisodes }: LearningProps) {

  // Parse episode strings (format: "TX_SXXX | path | OUTCOME | score")
  const parsedEpisodes = useMemo<ParsedEpisode[]>(() => {
    return storedEpisodes.map(ep => {
      const parts = ep.split('|').map(p => p.trim());
      const id = parts[0] || 'UNKNOWN';
      const path = parts[1] || 'UNKNOWN ROUTE';
      const outcome = parts[2] || 'PENDING';
      const score = parts[3] ? parts[3].replace('score:', '').trim() : '0.00';

      // Extract carrier from path e.g., "W1 -> [TRUCK C1] -> D2"
      const carrierMatch = path.match(/\[(.*?)\]/);
      const carrier = carrierMatch ? carrierMatch[1] : 'UNKNOWN_CARRIER';

      return { raw: ep, id, path, outcome, score, carrier };
    }).reverse();
  }, [storedEpisodes]);

  // Derived Stats
  const successRate = useMemo(() => {
    if (parsedEpisodes.length === 0) return 0;
    const successes = parsedEpisodes.filter(e => e.outcome === 'SUCCESS').length;
    return (successes / parsedEpisodes.length) * 100;
  }, [parsedEpisodes]);

  const mostReliableCarrier = useMemo(() => {
    const entries = Object.entries(calibrationBoost);
    if (entries.length === 0) return 'NONE';
    return entries.reduce((a, b) => b[1] > a[1] ? b : a)[0];
  }, [calibrationBoost]);

  // Chart Data
  const chartData = useMemo(() => {
    return Object.entries(calibrationBoost).map(([carrier, boost]) => ({
      name: carrier,
      boost: boost
    })).sort((a, b) => b.boost - a.boost);
  }, [calibrationBoost]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const boost = payload[0].value;
      const color = boost > 1.0 ? 'var(--accent-success)' : boost < 1.0 ? 'var(--accent-danger)' : 'var(--text-muted)';
      return (
        <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] p-3 shadow-xl font-['IBM_Plex_Mono']">
          <p className="text-[10px] text-[var(--text-secondary)] mb-1 uppercase tracking-wider">{label}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-primary)]">BOOST MULTIPLIER:</span>
            <span className="font-bold text-xs" style={{ color }}>{boost.toFixed(2)}x</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full gap-6">

      {/* Top Stat Cards */}
      <div className="grid grid-cols-3 gap-6">

        {/* Episodes */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] p-5 flex items-center justify-between group hover:border-[var(--accent-primary)] transition-colors">
          <div>
            <div className="font-['DM_Sans'] text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-2">Total Episodes</div>
            <div className="font-['JetBrains_Mono'] text-3xl text-[var(--text-primary)]">{episodeCount}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-[var(--accent-primary-dim)] flex items-center justify-center text-[var(--accent-primary)] group-hover:scale-110 transition-transform">
            <Database size={20} />
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] p-5 flex items-center justify-between group hover:border-[var(--accent-success)] transition-colors">
          <div>
            <div className="font-['DM_Sans'] text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-2">Avg Success Rate</div>
            <div className="font-['JetBrains_Mono'] text-3xl text-[var(--accent-success)]">{successRate.toFixed(1)}%</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-[var(--accent-success-dim)] flex items-center justify-center text-[var(--accent-success)] group-hover:scale-110 transition-transform">
            <Percent size={20} />
          </div>
        </div>

        {/* Most Reliable */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] p-5 flex items-center justify-between group hover:border-[var(--accent-warning)] transition-colors">
          <div>
            <div className="font-['DM_Sans'] text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-2">Most Reliable Carrier</div>
            <div className="font-['IBM_Plex_Mono'] text-xl tracking-wider text-[var(--accent-warning)] mt-1">{mostReliableCarrier}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-[var(--accent-warning-dim)] flex items-center justify-center text-[var(--accent-warning)] group-hover:scale-110 transition-transform">
            <Award size={20} />
          </div>
        </div>

      </div>

      {/* Main 2-Panel Content */}
      <div className="flex-1 grid grid-cols-2 gap-6 min-h-[400px]">

        {/* Left: Episode Log */}
        <div className="h-full bg-[var(--bg-surface)] border border-[var(--bg-border)] flex flex-col">
          <div className="p-4 border-b border-[var(--bg-border)]">
            <h2 className="font-['IBM_Plex_Mono'] text-sm tracking-wider uppercase text-[var(--text-primary)]">Episode Log</h2>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-['DM_Sans']">Historical intervention outcomes retrieved from Chroma DB</p>
          </div>

          <div className="flex-1 overflow-auto">
            {parsedEpisodes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)] font-['IBM_Plex_Mono'] text-sm uppercase">
                Memory Empty. Awaiting Interventions.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[var(--bg-elevated)] border-b border-[var(--bg-border)]">
                  <tr>
                    {['ID', 'Path', 'Outcome', 'Score', 'Boost'].map(h => (
                      <th key={h} className="py-2 px-4 font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedEpisodes.map((ep, i) => {
                    const boost = calibrationBoost[ep.carrier] || 1.0;
                    return (
                      <tr key={i} className="border-b border-[var(--bg-border)] hover:bg-[var(--bg-elevated)] transition-colors">
                        <td className="py-3 px-4 font-['IBM_Plex_Mono'] text-xs font-bold text-[var(--text-primary)]">{ep.id}</td>
                        <td className="py-3 px-4 font-['IBM_Plex_Mono'] text-[10px] text-[var(--text-secondary)]">{ep.path}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-['IBM_Plex_Mono'] ${ep.outcome === 'SUCCESS' ? 'text-[var(--accent-success)] bg-[var(--accent-success-dim)] border border-[var(--accent-success)]'
                              : ep.outcome === 'FAILED' ? 'text-[var(--accent-danger)] bg-[var(--accent-danger-dim)] border border-[var(--accent-danger)]'
                                : 'text-[var(--accent-warning)] bg-[var(--accent-warning-dim)] border border-[var(--accent-warning)]'
                            }`}>
                            {ep.outcome}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-['JetBrains_Mono'] text-xs text-[var(--text-primary)]">{ep.score}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-['JetBrains_Mono'] text-xs">
                            {boost > 1.0 ? <ArrowUp size={12} className="text-[var(--accent-success)]" /> : boost < 1.0 ? <ArrowDown size={12} className="text-[var(--accent-danger)]" /> : <Minus size={12} className="text-[var(--text-muted)]" />}
                            <span style={{ color: boost > 1.0 ? 'var(--accent-success)' : boost < 1.0 ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
                              {boost.toFixed(2)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Calibration Boost Chart */}
        <div className="h-full bg-[var(--bg-surface)] border border-[var(--bg-border)] flex flex-col">
          <div className="p-4 border-b border-[var(--bg-border)]">
            <h2 className="font-['IBM_Plex_Mono'] text-sm tracking-wider uppercase text-[var(--text-primary)]">Calibration Boost Multiplier</h2>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-['DM_Sans']">Carrier reliability adjustments over time</p>
          </div>

          <div className="flex-1 p-6 flex flex-col">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)] font-['IBM_Plex_Mono'] text-sm uppercase">
                No Calibration Data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <ReferenceLine y={1.0} stroke="var(--text-muted)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                    dy={10}
                  />
                  <YAxis
                    domain={[0, 'dataMax + 0.5']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }} />
                  <Bar
                    dataKey="boost"
                    radius={[2, 2, 0, 0]}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  >
                    {chartData.map((entry, index) => {
                      const color = entry.boost > 1.0 ? 'var(--accent-success)' : entry.boost < 1.0 ? 'var(--accent-danger)' : 'var(--text-muted)';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
