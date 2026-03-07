import type { AgentState } from '../types';
import { NetworkMap } from './NetworkMap';
import { RiskMonitor } from './RiskMonitor';

interface OverviewProps {
  state: AgentState;
  highlightedId: string | null;
  onHighlight: (id: string | null) => void;
}

export function Overview({ state, highlightedId, onHighlight }: OverviewProps) {
  const { shipments, active_at_risk, pending_approvals, tick, episode_count } = state;
  const total = Object.keys(shipments).length;
  const atRisk = active_at_risk.length;
  const healthy = Object.values(shipments).filter((s) => s.status === 'HEALTHY').length;
  const rescued = Object.values(shipments).filter((s) => s.status === 'RESCUED').length;

  return (
    <>
      <div className="workspace-header">
        <h1 className="workspace-title">Overview</h1>
        <p className="workspace-subtitle">
          Current tick: {tick} · {total} shipments · {atRisk} at risk · {rescued} rescued
        </p>
      </div>
      <div className="workspace-grid" style={{ gridTemplateColumns: '1fr 360px', gap: 'var(--space-5)' }}>
        <div className="panel">
          <div className="panel-header">Network</div>
          <div className="panel-body" style={{ padding: 0 }}>
            <NetworkMap
              shipments={shipments}
              highlightedId={highlightedId}
              onHighlight={onHighlight}
            />
          </div>
        </div>
        <div>
          <RiskMonitor
            shipments={shipments}
            activeAtRisk={active_at_risk}
            highlightedId={highlightedId}
            onHighlight={onHighlight}
          />
          <div className="panel" style={{ marginTop: 'var(--space-5)' }}>
            <div className="panel-header">Summary</div>
            <div className="panel-body">
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-value">{total}</div>
                  <div className="stat-label">Total shipments</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{healthy}</div>
                  <div className="stat-label">Healthy</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{atRisk}</div>
                  <div className="stat-label">At risk</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{pending_approvals.length}</div>
                  <div className="stat-label">Pending approval</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{episode_count}</div>
                  <div className="stat-label">Episodes learned</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
