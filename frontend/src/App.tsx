import { useState, useEffect, useCallback } from 'react';
import { fetchState, runTick, approveIntervention, streamUrl } from './api';
import type { AgentState } from './types';
import { TopBar } from './components/TopBar';
import { Sidebar, type ViewId } from './components/Sidebar';
import { Overview } from './components/Overview';
import { NetworkMap } from './components/NetworkMap';
import { RiskMonitor } from './components/RiskMonitor';
import { AIReasoning } from './components/AIReasoning';
import { Interventions } from './components/Interventions';
import { Learning } from './components/Learning';
import './App.css';

const defaultState: AgentState = {
  shipments: {},
  interventions: {},
  risk_map: {},
  pending_approvals: [],
  tick: 0,
  episode_count: 0,
  calibration_boost: {},
  active_at_risk: [],
  causal_map: {},
  shap_map: {},
  stored_episodes: [],
};

export default function App() {
  const [state, setState] = useState<AgentState>(defaultState);
  const [view, setView] = useState<ViewId>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [approveLoadingId, setApproveLoadingId] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchState();
      setState(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load state');
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (!autoRun) return;
    const es = new EventSource(streamUrl());
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as AgentState;
        setState(data);
      } catch {
        // ignore parse errors
      }
    };
    es.onerror = () => {
      es.close();
      setAutoRun(false);
    };
    return () => es.close();
  }, [autoRun]);

  const handleRunTick = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runTick();
      setState(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tick failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (interventionId: string, decision: 'approve' | 'reject') => {
    setApproveLoadingId(interventionId);
    setError(null);
    try {
      const data = await approveIntervention(interventionId, decision);
      setState(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decision failed');
    } finally {
      setApproveLoadingId(null);
    }
  };

  return (
    <div className="app-layout">
      <TopBar
        tick={state.tick}
        autoRun={autoRun}
        onToggleAutoRun={() => setAutoRun((v) => !v)}
        onRunTick={handleRunTick}
        isLoading={loading}
      />
      {loading && <div className="loading-bar" />}
      <div className="app-main-row">
        <Sidebar currentView={view} onNavigate={setView} />
        <main className="workspace">
          {error && (
            <div className="err-banner" role="alert">
              {error}
            </div>
          )}
          {view === 'overview' && (
            <Overview state={state} highlightedId={highlightedId} onHighlight={setHighlightedId} />
          )}
          {view === 'network' && (
            <>
              <div className="workspace-header">
                <h1 className="workspace-title">Network</h1>
                <p className="workspace-subtitle">Shipments and routes</p>
              </div>
              <div className="panel">
                <div className="panel-body" style={{ padding: 0 }}>
                  <NetworkMap
                    shipments={state.shipments}
                    highlightedId={highlightedId}
                    onHighlight={setHighlightedId}
                  />
                </div>
              </div>
            </>
          )}
          {view === 'risk' && (
            <>
              <div className="workspace-header">
                <h1 className="workspace-title">Risk Monitor</h1>
                <p className="workspace-subtitle">Shipments with highest failure probability</p>
              </div>
              <RiskMonitor
                shipments={state.shipments}
                activeAtRisk={state.active_at_risk}
                highlightedId={highlightedId}
                onHighlight={setHighlightedId}
              />
            </>
          )}
          {view === 'reasoning' && (
            <>
              <div className="workspace-header">
                <h1 className="workspace-title">AI Reasoning</h1>
                <p className="workspace-subtitle">Causal analysis from the system</p>
              </div>
              <AIReasoning causalMap={state.causal_map} activeAtRisk={state.active_at_risk} />
            </>
          )}
          {view === 'interventions' && (
            <>
              <div className="workspace-header">
                <h1 className="workspace-title">Interventions</h1>
                <p className="workspace-subtitle">Recommended actions and approvals</p>
              </div>
              <Interventions
                interventions={state.interventions}
                pendingApprovals={state.pending_approvals}
                onApprove={handleApprove}
                loadingId={approveLoadingId}
              />
            </>
          )}
          {view === 'learning' && (
            <>
              <div className="workspace-header">
                <h1 className="workspace-title">Learning</h1>
                <p className="workspace-subtitle">How the system improves from outcomes</p>
              </div>
              <Learning
                episodeCount={state.episode_count}
                calibrationBoost={state.calibration_boost}
                storedEpisodes={state.stored_episodes}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
