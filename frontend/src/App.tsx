import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { fetchState, runTick, approveIntervention, streamUrl } from './api';
import type { AgentState } from './types';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/dashboard';

const STORAGE_KEY = 'phantom-fleet-entered';

export default function App() {
  const [entered, setEntered] = useState(() => typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY) === '1');
  const [state, setState] = useState<AgentState | null>(null);
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
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-[var(--blue)] border-t-transparent rounded-full"
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      {loading && <div className="fixed top-0 left-0 right-0 h-0.5 skeleton z-[100]" />}
      {error && (
        <motion.div
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-[var(--red-bg)] border border-[var(--red)] text-[var(--red)] px-4 py-3 rounded-lg font-medium text-sm shadow-lg"
        >
          {error}
        </motion.div>
      )}
      <Dashboard
        state={state}
        autoRun={autoRun}
        onToggleAutoRun={() => setAutoRun((v) => !v)}
        onRunTick={handleRunTick}
        onApprove={handleApprove}
        isLoading={loading}
        approveLoadingId={approveLoadingId}
      />
    </div>
  );
}
