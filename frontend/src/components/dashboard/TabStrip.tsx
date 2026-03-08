import type { TabId } from './DashboardSidebar';
import type { AgentState } from '../../types';

interface TabStripProps {
  currentTab: TabId;
  onTab: (tab: TabId) => void;
  state: AgentState;
}

const TABS: { id: TabId; label: string; showCount?: keyof AgentState }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'shipments', label: 'Shipments', showCount: 'shipments' },
  { id: 'map', label: 'Network Map' },
  { id: 'learning', label: 'Learning', showCount: 'episode_count' },
];

export function TabStrip({ currentTab, onTab, state }: TabStripProps) {
  return (
    <div className="flex items-center gap-0 px-6 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
      {TABS.map(({ id, label, showCount }) => {
        const isActive = currentTab === id;
        const count = showCount === 'shipments' ? Object.keys(state.shipments).length : showCount === 'episode_count' ? state.episode_count : null;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTab(id)}
            className={`
              flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 transition-all
              ${isActive
                ? 'text-[var(--text-primary)] border-[var(--blue)] font-semibold'
                : 'text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)]'}
            `}
          >
            {label}
            {count != null && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md font-mono ${isActive
                  ? 'bg-[var(--blue)]/15 text-[var(--blue)]'
                  : 'bg-[var(--surface-3)] text-[var(--text-tertiary)]'
                }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
