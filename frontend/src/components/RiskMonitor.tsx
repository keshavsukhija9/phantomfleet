import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-react';
import type { Shipment } from '../types';

interface RiskMonitorProps {
  shipments: Record<string, Shipment>;
  activeAtRisk: string[];
  onHighlight: (id: string | null) => void;
}

type SortKey = 'id' | 'carrier' | 'priority' | 'eta_drift_pct' | 'carrier_reliability' | 'warehouse_pressure' | 'weather_risk' | 'failure_prob' | 'status';
type SortDirection = 'asc' | 'desc';

export function RiskMonitor({ shipments, activeAtRisk, onHighlight }: RiskMonitorProps) {
  const [sortKey, setSortKey] = useState<SortKey>('failure_prob');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [filterText, setFilterText] = useState('');

  const list = useMemo(() => Object.values(shipments), [shipments]);

  const filteredAndSorted = useMemo(() => {
    // 1. Filter
    let result = list;
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      result = result.filter(s =>
        s.id.toLowerCase().includes(q) ||
        s.carrier.toLowerCase().includes(q) ||
        s.priority.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
      );
    }

    // 2. Sort
    result.sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];

      // Handle specific sorts
      if (sortKey === 'priority') {
        const pMap: Record<string, number> = { CRITICAL: 3, HIGH: 2, STANDARD: 1 };
        valA = pMap[a.priority] || 0;
        valB = pMap[b.priority] || 0;
      }

      // Default to 0 for missing numbers
      if (typeof valA === 'number' && isNaN(valA)) valA = 0;
      if (typeof valB === 'number' && isNaN(valB)) valB = 0;
      if (valA == null) valA = 0;
      if (valB == null) valB = 0;

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [list, filterText, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown size={12} className="opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-[var(--accent)]" /> : <ArrowDown size={12} className="text-[var(--accent)]" />;
  };

  const renderStatus = (status: string) => {
    const styles: Record<string, string> = {
      HEALTHY: 'text-[var(--text-muted)] border border-[var(--text-muted)] bg-transparent',
      AT_RISK: 'text-[var(--warning)] border border-[var(--warning)] bg-[var(--warning-bg)]',
      RESCUED: 'text-[var(--success)] border border-[var(--success)] bg-[var(--success-bg)]',
      FAILED: 'text-[var(--danger)] border border-[var(--danger)] bg-[var(--danger-bg)]',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${styles[status] || ''}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="card flex flex-col h-full overflow-hidden"
    >
      <div className="p-5 border-b border-[var(--border)] flex flex-wrap justify-between items-center gap-4 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Risk feed</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{filteredAndSorted.length} shipments</p>
        </div>
        <div className="relative w-56 sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Filter by carrier, status…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-btn)] focus:border-[var(--accent)] text-sm py-2 pl-9 pr-3 outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
            <tr>
              {[
                { key: 'id', label: 'ID' },
                { key: 'carrier', label: 'Carrier' },
                { key: 'priority', label: 'Priority' },
                { key: 'eta_drift_pct', label: 'ETA drift' },
                { key: 'carrier_reliability', label: 'Reliability' },
                { key: 'warehouse_pressure', label: 'WH pressure' },
                { key: 'weather_risk', label: 'Weather' },
                { key: 'failure_prob', label: 'Failure %' },
                { key: 'status', label: 'Status' }
              ].map(({ key, label }) => (
                <th key={key} className="py-3 px-4 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => toggleSort(key as SortKey)}>
                  <div className="flex items-center gap-1.5">
                    {label}
                    {getSortIcon(key as SortKey)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[var(--text-muted)] font-[var(--font-sans)] text-sm uppercase">
                  No matching shipments
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((s, idx) => {
                const isEven = idx % 2 === 0;
                let bgClass = isEven ? 'bg-[var(--bg-base)]' : 'bg-[var(--bg-surface)]';

                let borderLeftClass = 'border-l-[3px] border-transparent';
                if (s.status === 'AT_RISK') borderLeftClass = 'border-l-[3px] border-[var(--warning)]';
                else if (s.status === 'RESCUED') borderLeftClass = 'border-l-[3px] border-[var(--success)]';

                const failureProb = s.failure_prob ?? 0;
                let probColor = 'var(--text-muted)';
                if (failureProb >= 0.75) probColor = 'var(--danger)';
                else if (failureProb >= 0.5) probColor = 'var(--warning)';

                return (
                  <tr
                    key={s.id}
                    className={`${bgClass} border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors duration-150 group`}
                    onMouseEnter={() => onHighlight(s.id)}
                    onMouseLeave={() => onHighlight(null)}
                  >
                    <td className={`py-3 px-4 ${borderLeftClass} font-semibold text-sm ${activeAtRisk.includes(s.id) ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]'}`}>
                      {s.id}
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                      {s.carrier}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span style={{ color: s.priority === 'CRITICAL' ? 'var(--danger)' : s.priority === 'HIGH' ? 'var(--warning)' : 'var(--text-muted)' }}>
                        {s.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm tabular-nums text-[var(--text-primary)]">
                      {s.eta_drift_pct != null ? `${s.eta_drift_pct.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm tabular-nums text-[var(--text-primary)]">
                      {s.carrier_reliability?.toFixed(2) ?? '-'}
                    </td>
                    <td className="py-3 px-4 text-sm tabular-nums text-[var(--text-primary)]">
                      {s.warehouse_pressure?.toFixed(2) ?? '-'}
                    </td>
                    <td className="py-3 px-4 text-sm tabular-nums text-[var(--text-primary)]">
                      {s.weather_risk?.toFixed(2) ?? '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 w-32">
                        <span className="text-xs font-semibold w-10 text-right tabular-nums" style={{ color: probColor }}>
                          {(failureProb * 100).toFixed(1)}%
                        </span>
                        <div className="h-1 flex-1 bg-[var(--border)] rounded-full overflow-hidden">
                          <div className="h-full transition-all duration-300 rounded-full" style={{ width: `${failureProb * 100}%`, backgroundColor: probColor }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {renderStatus(s.status)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
