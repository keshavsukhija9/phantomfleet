import { useState, useEffect, useCallback } from 'react';
import { fetchState, runTick, approveIntervention, streamUrl } from './api';
import type { AgentState } from './types';
import { Sidebar, type ViewId } from './components/Sidebar';
import { Overview } from './components/Overview';
import { RiskMonitor } from './components/RiskMonitor';
import { AIReasoning } from './components/AIReasoning';
import { Interventions } from './components/Interventions';
import { Learning } from './components/Learning';

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
    <div className="flex min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* 220px Fixed Sidebar */}
      <Sidebar
        currentView={view}
        onNavigate={setView}
        state={state}
        autoRun={autoRun}
        onToggleAutoRun={() => setAutoRun(v => !v)}
        onRunTick={handleRunTick}
        isLoading={loading}
      />

      {/* Main Content Area (Fluid) */}
      <main className="flex-1 ml-[220px] p-8 flex flex-col relative overflow-hidden transition-opacity duration-200">

        {/* Skeleton Shimmer during long compute */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-1 skeleton z-[100]" />
        )}

        {error && (
          <div className="bg-[var(--accent-danger-dim)] border border-[var(--accent-danger)] text-[var(--accent-danger)] p-4 mb-6 font-['IBM_Plex_Mono'] text-sm tracking-wide">
            SYSTEM ERR: {error}
          </div>
        )}

        {/* View Routing */}
        <div key={view} className="fade-enter h-full flex flex-col">
          {view === 'overview' && (
            <Overview
              state={state}
              onHighlight={() => { }}
            />
          )}

          {view === 'risk' && (
            <RiskMonitor
              shipments={state.shipments}
              activeAtRisk={state.active_at_risk}
              onHighlight={() => { }}
            />
          )}

          {view === 'interventions' && (
            <Interventions
              interventions={state.interventions}
              pendingApprovals={state.pending_approvals}
              onApprove={handleApprove}
              loadingId={approveLoadingId}
              causalMap={state.causal_map}
            />
          )}

          {view === 'reasoning' && (
            <AIReasoning
              causalMap={state.causal_map}
              shapMap={state.shap_map}
              activeAtRisk={state.active_at_risk}
            />
          )}

          {view === 'learning' && (
            <Learning
              episodeCount={state.episode_count}
              calibrationBoost={state.calibration_boost}
              storedEpisodes={state.stored_episodes}
            />
          )}
        </div>

      </main>
    </div>
  );
}
