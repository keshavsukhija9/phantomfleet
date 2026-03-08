import { motion } from 'motion/react';
import { Play, Square, FastForward } from 'lucide-react';
import type { AgentState } from '../types';

interface CommandHeaderProps {
  state: AgentState;
  autoRun: boolean;
  onToggleAutoRun: () => void;
  onRunTick: () => void;
  isLoading: boolean;
  currentView: string;
}

export function CommandHeader({
  state,
  autoRun,
  onToggleAutoRun,
  onRunTick,
  isLoading,
  currentView,
}: CommandHeaderProps) {
  const isRunning = autoRun || isLoading;

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface)]"
    >
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Command Center
        </h1>
        <span className="text-sm text-[var(--text-muted)] capitalize">
          {currentView.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium tabular-nums text-[var(--text-primary)]">
            Tick {state.tick}
          </span>
          <span className="text-[var(--text-muted)]">·</span>
          <span className="text-[var(--text-secondary)]">
            {state.episode_count} episodes
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRunTick}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium text-sm hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] disabled:opacity-50 transition-all duration-200"
          >
            <FastForward size={16} />
            Run tick
          </button>
          <button
            type="button"
            onClick={onToggleAutoRun}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-all duration-200 ${
              autoRun
                ? 'border-[var(--warning)] bg-[var(--warning-bg)] text-[var(--warning)]'
                : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }`}
          >
            {autoRun ? <Square size={16} /> : <Play size={16} />}
            {autoRun ? 'Stop' : 'Auto'}
          </button>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isRunning ? 'animate-pulse bg-[var(--warning)]' : 'bg-[var(--success)]'}`}
            />
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {isRunning ? 'Running' : 'Idle'}
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
