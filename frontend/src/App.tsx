import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { fetchState, runTick, approveIntervention, streamUrl } from './api';
import type { AgentState } from './types';
import { LandingPage } from './components/LandingPage';
import { CommandHeader } from './components/CommandHeader';
import { Sidebar, type ViewId } from './components/Sidebar';
import { Overview } from './components/Overview';
import { RiskMonitor } from './components/RiskMonitor';
import { AIReasoning } from './components/AIReasoning';
import { Interventions } from './components/Interventions';
import { Learning } from './components/Learning';

const STORAGE_KEY = 'phantom-fleet-entered';

export default function App() {
  const [entered, setEntered] = useState(() => typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY) === '1');
  const [state, setState] = useState<AgentState | null>(null);
  const [view, setView] = useState<ViewId>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const [approveLoadingId, setApproveLoadingId] = useState<string | null>(null);

  const enterDashboard = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setEntered(true);
  }, []);

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

  if (!entered) {
    return <LandingPage onEnterDashboard={enterDashboard} />;
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-base)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-[var(--accent)] border-t-transparent rounded-full"
        />
      </div>
    );
  }

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
      <Sidebar currentView={view} onNavigate={setView} state={state} />
      <div className="relative z-10 flex-1 flex flex-col min-h-0 ml-[260px]">
        <CommandHeader
          state={state}
          autoRun={autoRun}
          onToggleAutoRun={() => setAutoRun(v => !v)}
          onRunTick={handleRunTick}
          isLoading={loading}
          currentView={view}
        />
        <main className="flex-1 p-6 pb-8 flex flex-col min-h-0">
          {loading && (
            <div className="absolute top-0 left-[260px] right-0 h-0.5 skeleton z-[100]" />
          )}
          {error && (
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-[var(--danger-bg)] border border-[var(--danger)] text-[var(--danger)] p-4 mb-6 rounded-[var(--radius-lg)] font-medium text-sm"
            >
              {error}
            </motion.div>
          )}
          <motion.div
            key={view}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full flex flex-col"
          >
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
          </motion.div>
        </main>
      </div>
    </div>
  );
}
