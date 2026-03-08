import { motion } from 'motion/react';
import type { AgentState } from '../types';
import { NetworkMap } from './NetworkMap';
import { Activity, AlertTriangle, CheckCircle, Database } from 'lucide-react';

interface OverviewProps {
  state: AgentState;
  onHighlight: (id: string | null) => void;
}

export function Overview({ state, onHighlight }: OverviewProps) {
  const { shipments, tick, episode_count } = state;
  const list = Object.values(shipments);
  const atRiskCount = list.filter(s => (s.failure_prob ?? 0) >= 0.75).length;
  const rescuedCount = list.filter(s => s.status === 'RESCUED').length;
  const riskFeed = [...list]
    .filter(s => s.status === 'AT_RISK' || s.status === 'FAILED')
    .sort((a, b) => (b.failure_prob ?? 0) - (a.failure_prob ?? 0));

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, { bg: string; label: string }> = {
      CRITICAL: { bg: 'var(--danger)', label: 'Critical' },
      HIGH: { bg: 'var(--warning)', label: 'High' },
    };
    const { bg, label } = map[priority] || { bg: 'var(--text-muted)', label: 'Standard' };
    return (
      <span
        className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-white"
        style={{ background: bg }}
      >
        {label}
      </span>
    );
  };

  const getProbColor = (prob: number) => {
    if (prob >= 0.75) return 'var(--danger)';
    if (prob >= 0.5) return 'var(--warning)';
    return 'var(--success)';
  };

  const kpis = [
    { label: 'Current tick', value: tick, icon: Activity, color: 'var(--text-primary)', glow: 'var(--bg-elevated)' },
    { label: 'At risk', value: atRiskCount, icon: AlertTriangle, color: 'var(--danger)', glow: 'var(--danger-bg)', pulse: atRiskCount > 0 },
    { label: 'Rescued', value: rescuedCount, icon: CheckCircle, color: 'var(--success)', glow: 'var(--success-bg)' },
    { label: 'Memory episodes', value: episode_count, icon: Database, color: 'var(--accent)', glow: 'var(--accent-bg)' },
  ];

  return (
    <div className="flex flex-col h-full gap-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="card p-6 relative overflow-hidden group"
          >
            {kpi.pulse && (
              <div
                className="absolute top-4 right-4 h-2 w-2 rounded-full animate-pulse opacity-80"
                style={{ background: kpi.color }}
              />
            )}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-semibold tabular-nums tracking-tight mb-1" style={{ color: kpi.color }}>
                  {kpi.value}
                </p>
                <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
                  {kpi.label}
                </p>
              </div>
              <div
                className="rounded-lg p-2 transition-transform duration-300 group-hover:scale-110"
                style={{ background: kpi.glow, color: kpi.color }}
              >
                <kpi.icon size={20} strokeWidth={2} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main grid: Map + Risk feed */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 min-h-[420px]"
      >
        {/* Network map panel */}
        <div className="card flex flex-col overflow-hidden min-h-[400px]">
          <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[var(--accent-bg)] text-[var(--accent)]">
              <Activity size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Live network map
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Shipments and routes
              </p>
            </div>
          </div>
          <div className="flex-1 relative min-h-[320px]">
            <NetworkMap shipments={shipments} onHighlight={onHighlight} />
          </div>
        </div>

        {/* Risk feed panel */}
        <div className="card flex flex-col overflow-hidden min-h-[400px]">
          <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[var(--danger-bg)] text-[var(--danger)]">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Risk feed
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {riskFeed.length} active
                </p>
              </div>
            </div>
            {riskFeed.length > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-[var(--danger-bg)] text-[var(--danger)]">
                Live
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {riskFeed.length === 0 ? (
              <div className="flex h-full min-h-[280px] items-center justify-center px-6 text-center">
                <p className="text-sm font-medium text-[var(--text-muted)]">
                  All shipments nominal
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {riskFeed.slice(0, 10).map((s, i) => {
                  const prob = s.failure_prob ?? 0;
                  const color = getProbColor(prob);
                  const isCritical = prob > 0.85;
                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`px-5 py-4 hover:bg-[var(--bg-hover)] transition-colors cursor-default ${isCritical ? 'bg-[var(--danger-bg)]' : ''}`}
                      onMouseEnter={() => onHighlight(s.id)}
                      onMouseLeave={() => onHighlight(null)}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {getPriorityBadge(s.priority)}
                          <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
                            {s.id}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] shrink-0">
                            {s.carrier}
                          </span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color }}>
                          {(prob * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${prob * 100}%` }}
                          transition={{ duration: 0.5, delay: i * 0.03 }}
                          className="h-full rounded-full"
                          style={{ background: color }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
