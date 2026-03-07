import type { Intervention } from '../types';

interface InterventionsProps {
  interventions: Record<string, Intervention>;
  pendingApprovals: string[];
  onApprove: (id: string, decision: 'approve' | 'reject') => void;
  loadingId: string | null;
}

export function Interventions({
  interventions,
  pendingApprovals,
  onApprove,
  loadingId,
}: InterventionsProps) {
  const list = Object.values(interventions).reverse();
  const pendingSet = new Set(pendingApprovals);

  return (
    <div className="panel">
      <div className="panel-header">Interventions</div>
      <div className="panel-body">
        {list.length === 0 ? (
          <p className="empty-state">No interventions yet.</p>
        ) : (
          list.map((inv) => {
            const pending = pendingSet.has(inv.id);
            const loading = loadingId === inv.id;
            return (
              <div
                key={inv.id}
                className={`intervention-card ${pending ? 'pending' : ''}`}
              >
                <div><strong>Shipment:</strong> {inv.shipment_id}</div>
                <div><strong>Route:</strong> {inv.path}</div>
                <div className="intervention-meta">
                  <span>ETA gain: {inv.predicted_eta_gain.toFixed(1)}h</span>
                  <span>Cost Δ: {inv.cost_delta_pct.toFixed(1)}%</span>
                  <span>Revival prob: {(inv.revival_prob * 100).toFixed(0)}%</span>
                  <span>Score: {inv.score.toFixed(2)}</span>
                </div>
                <div>
                  <span className={`badge badge-${pending ? 'warning' : inv.outcome === 'SUCCESS' ? 'success' : 'neutral'}`}>
                    {inv.execution} {inv.outcome !== 'PENDING' ? `· ${inv.outcome}` : ''}
                  </span>
                </div>
                {pending && (
                  <div className="intervention-actions">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => onApprove(inv.id, 'approve')}
                      disabled={loading}
                    >
                      {loading ? '…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => onApprove(inv.id, 'reject')}
                      disabled={loading}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
