import type { AgentState } from '../types';

interface LearningProps {
  episodeCount: number;
  calibrationBoost: AgentState['calibration_boost'];
  storedEpisodes: string[];
}

export function Learning({ episodeCount, calibrationBoost, storedEpisodes }: LearningProps) {
  const carriers = Object.entries(calibrationBoost).sort((a, b) => b[1] - a[1]);

  return (
    <div className="workspace-grid workspace-grid-2">
      <div className="panel">
        <div className="panel-header">Learning metrics</div>
        <div className="panel-body">
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{episodeCount}</div>
              <div className="stat-label">Intervention episodes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{storedEpisodes.length}</div>
              <div className="stat-label">Stored in memory</div>
            </div>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">Carrier calibration (memory boost)</div>
        <div className="panel-body">
          {carriers.length === 0 ? (
            <p className="empty-state">No calibration data yet. Run ticks to see learning.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Carrier</th>
                  <th>Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {carriers.map(([carrier, mult]) => (
                  <tr key={carrier}>
                    <td>{carrier}</td>
                    <td className="num-cell">{mult.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
