import type { AgentState } from '../types';

interface AIReasoningProps {
  causalMap: AgentState['causal_map'];
  activeAtRisk: string[];
}

export function AIReasoning({ causalMap, activeAtRisk }: AIReasoningProps) {
  const entries = activeAtRisk.slice(0, 5).map((sid) => ({ shipmentId: sid, data: causalMap[sid] })).filter((e) => e.data);

  return (
    <div className="panel">
      <div className="panel-header">AI causal analysis</div>
      <div className="panel-body">
        {entries.length === 0 ? (
          <p className="empty-state">No causal reasoning for this tick.</p>
        ) : (
          entries.map(({ shipmentId, data }) => (
            <div key={shipmentId} className="insight-card">
              <div className="insight-ship-id">{shipmentId}</div>
              <div className="insight-cause">{data.primary_cause ?? '—'}</div>
              <p className="insight-hypothesis">{data.hypothesis ?? '—'}</p>
              {data.confidence != null && (
                <div className="insight-confidence">Confidence: {(data.confidence * 100).toFixed(0)}%</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
