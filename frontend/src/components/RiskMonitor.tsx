import { useMemo, useState } from 'react';
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
    if (sortKey !== key) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-[var(--accent-primary)]" /> : <ArrowDown size={12} className="text-[var(--accent-primary)]" />;
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'HEALTHY': return <span className="text-[var(--text-muted)] border border-[var(--text-muted)] px-2 py-0.5 rounded-sm bg-transparent font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-wider">HEALTHY</span>;
      case 'AT_RISK': return <span className="text-[var(--accent-warning)] border border-[var(--accent-warning)] bg-[var(--accent-warning-dim)] px-2 py-0.5 rounded-sm font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-wider shadow-[0_0_8px_var(--accent-warning-dim)]">AT RISK</span>;
      case 'RESCUED': return <span className="text-[var(--accent-success)] border border-[var(--accent-success)] bg-[var(--accent-success-dim)] px-2 py-0.5 rounded-sm font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-wider shadow-[0_0_8px_var(--accent-success-dim)]">RESCUED</span>;
      case 'FAILED': return <span className="text-[var(--accent-danger)] border border-[var(--accent-danger)] bg-[var(--accent-danger-dim)] px-2 py-0.5 rounded-sm font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-wider shadow-[0_0_8px_var(--accent-danger-dim)]">FAILED</span>;
      default: return status;
    }
  };

  return (
    <div className="flex flex-col h-full h-screen-main border border-[var(--bg-border)] bg-[var(--bg-base)]">

      {/* Header & Filter */}
      <div className="p-4 border-b border-[var(--bg-border)] bg-[var(--bg-surface)] flex justify-between items-center shrink-0">
        <div>
          <h1 className="font-['IBM_Plex_Mono'] text-lg font-bold tracking-wider text-[var(--text-primary)]">RISK FEED</h1>
          <p className="text-[11px] text-[var(--text-secondary)] font-['DM_Sans']">Tracking {filteredAndSorted.length} shipments</p>
        </div>

        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Filter by Carrier, Status, Priority..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--bg-border)] focus:border-[var(--accent-primary)] text-xs py-2 pl-9 pr-3 outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-[var(--bg-elevated)] border-b border-[var(--bg-border)] shadow-sm">
            <tr>
              {[
                { key: 'id', label: 'ID' },
                { key: 'carrier', label: 'CARRIER' },
                { key: 'priority', label: 'PRIORITY' },
                { key: 'eta_drift_pct', label: 'ETA DRIFT' },
                { key: 'carrier_reliability', label: 'RELIABILITY' },
                { key: 'warehouse_pressure', label: 'WH PRESSURE' },
                { key: 'weather_risk', label: 'WEATHER' },
                { key: 'failure_prob', label: 'FAILURE PROB' },
                { key: 'status', label: 'STATUS' }
              ].map(({ key, label }) => (
                <th key={key} className="py-3 px-4 font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => toggleSort(key as SortKey)}>
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
                <td colSpan={9} className="py-12 text-center text-[var(--text-muted)] font-['IBM_Plex_Mono'] text-sm uppercase">
                  No matching shipments found
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((s, idx) => {
                const isEven = idx % 2 === 0;
                let bgClass = isEven ? 'bg-[var(--bg-base)]' : 'bg-[var(--bg-surface)]';

                let borderLeftClass = 'border-l-[3px] border-transparent';
                if (s.status === 'AT_RISK') borderLeftClass = 'border-l-[3px] border-[var(--accent-warning)]';
                else if (s.status === 'RESCUED') borderLeftClass = 'border-l-[3px] border-[var(--accent-success)]';

                const failureProb = s.failure_prob ?? 0;
                let probColor = 'var(--text-muted)';
                if (failureProb >= 0.75) probColor = 'var(--accent-danger)';
                else if (failureProb >= 0.5) probColor = 'var(--accent-warning)';

                return (
                  <tr
                    key={s.id}
                    className={`${bgClass} border-b border-[var(--bg-border)] hover:bg-[var(--bg-elevated)] transition-colors duration-150 group`}
                    onMouseEnter={() => onHighlight(s.id)}
                    onMouseLeave={() => onHighlight(null)}
                  >
                    <td className={`py-3 px-4 ${borderLeftClass} font-['IBM_Plex_Mono'] font-bold text-[13px] ${activeAtRisk.includes(s.id) ? 'text-[var(--accent-warning)]' : 'text-[var(--text-primary)]'}`}>
                      {s.id}
                    </td>
                    <td className="py-3 px-4 font-['IBM_Plex_Mono'] text-xs text-[var(--text-secondary)]">
                      {s.carrier}
                    </td>
                    <td className="py-3 px-4 font-['IBM_Plex_Mono'] text-xs">
                      <span style={{ color: s.priority === 'CRITICAL' ? 'var(--accent-danger)' : s.priority === 'HIGH' ? 'var(--accent-warning)' : 'var(--text-muted)' }}>
                        {s.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-['JetBrains_Mono'] text-xs text-[var(--text-primary)]">
                      {s.eta_drift_pct != null ? `${s.eta_drift_pct.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-3 px-4 font-['JetBrains_Mono'] text-xs text-[var(--text-primary)]">
                      {s.carrier_reliability?.toFixed(2) ?? '-'}
                    </td>
                    <td className="py-3 px-4 font-['JetBrains_Mono'] text-xs text-[var(--text-primary)]">
                      {s.warehouse_pressure?.toFixed(2) ?? '-'}
                    </td>
                    <td className="py-3 px-4 font-['JetBrains_Mono'] text-xs text-[var(--text-primary)]">
                      {s.weather_risk?.toFixed(2) ?? '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 w-32">
                        <span className="font-['JetBrains_Mono'] text-[11px] w-10 text-right" style={{ color: probColor }}>
                          {(failureProb * 100).toFixed(1)}%
                        </span>
                        <div className="h-1 flex-1 bg-[var(--bg-border)]">
                          <div className="h-full transition-all duration-300" style={{ width: `${failureProb * 100}%`, backgroundColor: probColor }} />
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
    </div>
  );
}
