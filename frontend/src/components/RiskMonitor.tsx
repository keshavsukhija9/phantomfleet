import { useMemo, useState } from 'react';
import type { Shipment } from '../types';

interface RiskMonitorProps {
  shipments: Record<string, Shipment>;
  activeAtRisk: string[];
  highlightedId: string | null;
  onHighlight: (id: string | null) => void;
}

type SortKey = 'id' | 'failure_prob' | 'priority';

export function RiskMonitor({ shipments, activeAtRisk, highlightedId, onHighlight }: RiskMonitorProps) {
  const [sortKey, setSortKey] = useState<SortKey>('failure_prob');

  const rows = useMemo(() => {
    const list = Object.values(shipments).filter((s) => s.status === 'AT_RISK' || activeAtRisk.includes(s.id));
    const sorted = [...list].sort((a, b) => {
      if (sortKey === 'failure_prob') return b.failure_prob - a.failure_prob;
      if (sortKey === 'priority') {
        const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, STANDARD: 2 };
        return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      }
      return a.id.localeCompare(b.id);
    });
    return sorted;
  }, [shipments, activeAtRisk, sortKey]);

  const sort = (key: SortKey) => setSortKey(key);

  return (
    <div className="panel">
      <div className="panel-header">At-risk shipments</div>
      <div className="panel-body table-wrap">
        {rows.length === 0 ? (
          <p className="empty-state">No at-risk shipments in this tick.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th><button type="button" onClick={() => sort('id')}>Shipment ID</button></th>
                <th><button type="button" onClick={() => sort('priority')}>Priority</button></th>
                <th><button type="button" onClick={() => sort('failure_prob')}>Failure probability</button></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className={highlightedId === s.id ? 'highlight' : ''}
                  onMouseEnter={() => onHighlight(s.id)}
                  onMouseLeave={() => onHighlight(null)}
                >
                  <td className="num-cell">{s.id}</td>
                  <td>
                    <span className={`badge badge-${s.priority === 'CRITICAL' ? 'critical' : 'warning'}`}>
                      {s.priority}
                    </span>
                  </td>
                  <td className="num-cell">{(s.failure_prob * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
