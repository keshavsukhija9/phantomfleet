import { motion } from 'motion/react';
import {
  LayoutDashboard,
  AlertTriangle,
  Zap,
  BrainCircuit,
  Database,
} from 'lucide-react';
import type { AgentState } from '../types';

export type ViewId = 'overview' | 'risk' | 'interventions' | 'reasoning' | 'learning';

const NAV: { id: ViewId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} strokeWidth={2} /> },
  { id: 'risk', label: 'Risk Feed', icon: <AlertTriangle size={18} strokeWidth={2} /> },
  { id: 'interventions', label: 'Interventions', icon: <Zap size={18} strokeWidth={2} /> },
  { id: 'reasoning', label: 'Reasoning', icon: <BrainCircuit size={18} strokeWidth={2} /> },
  { id: 'learning', label: 'Learning', icon: <Database size={18} strokeWidth={2} /> },
];

interface SidebarProps {
  currentView: ViewId;
  onNavigate: (view: ViewId) => void;
  state: AgentState;
}

export function Sidebar({ currentView, onNavigate, state }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] flex flex-col z-50 border-r border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-[var(--border)]">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-white font-semibold text-sm">
          PF
        </div>
        <div>
          <div className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">
            Phantom Fleet
          </div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
            V3.0 Intelligence
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-0.5">
          {NAV.map(({ id, label, icon }) => {
            const isActive = currentView === id;
            return (
              <li key={id}>
                <motion.button
                  type="button"
                  onClick={() => onNavigate(id)}
                  initial={false}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--accent-bg)] text-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className={isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}>
                    {icon}
                  </span>
                  {label}
                </motion.button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4 border-t border-[var(--border)]">
        <div className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Status
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            <span>Memory {state.episode_count} episodes</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
