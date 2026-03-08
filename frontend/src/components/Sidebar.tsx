import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Zap,
  BookOpen,
  Play,
  Square,
  FastForward
} from 'lucide-react';
import type { AgentState } from '../types';

export type ViewId = 'overview' | 'risk' | 'interventions' | 'reasoning' | 'learning';

const NAV: { id: ViewId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
  { id: 'risk', label: 'Risk Feed', icon: <AlertTriangle size={16} /> },
  { id: 'interventions', label: 'Interventions', icon: <Zap size={16} /> },
  { id: 'reasoning', label: 'Agent Reasoning', icon: <BrainCircuit size={16} /> },
  { id: 'learning', label: 'Learning Memory', icon: <BookOpen size={16} /> },
];

interface SidebarProps {
  currentView: ViewId;
  onNavigate: (view: ViewId) => void;
  state: AgentState;

  // Controls
  autoRun: boolean;
  onToggleAutoRun: () => void;
  onRunTick: () => void;
  isLoading: boolean;
}

export function Sidebar({ currentView, onNavigate, state, autoRun, onToggleAutoRun, onRunTick, isLoading }: SidebarProps) {
  const isRunning = autoRun || isLoading;
  const llmStatusColor = state.active_at_risk.length > 0 ? "var(--accent-primary)" : "var(--accent-success)";

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[var(--bg-surface)] border-r border-[var(--bg-border)] flex flex-col pt-6 pb-4 z-50">

      {/* Logo Area */}
      <div className="flex items-center gap-3 px-5 mb-10">
        <div className="w-8 h-8 flex items-center justify-center bg-[var(--accent-primary)] text-black font-['IBM_Plex_Mono'] font-bold text-sm">
          PF
        </div>
        <div className="text-[var(--text-primary)] font-['IBM_Plex_Mono'] font-bold text-[11px] tracking-[0.15em] leading-tight">
          PHANTOM<br />FLEET
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="flex flex-col gap-1">
          {NAV.map(({ id, label, icon }) => {
            const isActive = currentView === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onNavigate(id)}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs text-left transition-colors font-['IBM_Plex_Mono'] uppercase tracking-[0.08em] hover:bg-[var(--bg-border)] ${isActive
                    ? 'bg-[var(--accent-primary-dim)] text-[var(--accent-primary)] border-l-2 border-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] border-l-2 border-transparent'
                    }`}
                >
                  <span className={`${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {icon}
                  </span>
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Controls Area */}
      <div className="px-5 mb-6 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={onRunTick}
            disabled={isRunning}
            className="flex-1 flex items-center justify-center gap-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)] py-2 hover:border-[var(--accent-primary)] disabled:opacity-50"
          >
            <FastForward size={14} /> Tick
          </button>
          <button
            onClick={onToggleAutoRun}
            className={`flex-1 flex items-center justify-center gap-2 border py-2 ${autoRun
              ? 'bg-[var(--accent-warning-dim)] border-[var(--accent-warning)] text-[var(--accent-warning)]'
              : 'bg-[var(--bg-elevated)] border-[var(--bg-border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
              }`}
          >
            {autoRun ? <Square size={14} /> : <Play size={14} />} Auto
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="px-5 border-t border-[var(--bg-border)] pt-4 flex flex-col gap-2 font-['IBM_Plex_Mono'] text-[10px] text-[var(--text-secondary)] uppercase">
        <div className="text-[var(--text-muted)] mb-1 tracking-widest">System Status</div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'animate-pulse bg-[var(--accent-warning)]' : 'bg-[var(--accent-success)]'}`} />
          <span>Agent: {isRunning ? 'RUNNING' : 'IDLE'}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-success)]" style={{ backgroundColor: llmStatusColor }} />
          <span>LLM: CONNECTED</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
          <span>Memory: {state.episode_count} eps</span>
        </div>
      </div>

    </aside>
  );
}
