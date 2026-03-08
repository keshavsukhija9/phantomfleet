import type { AgentState } from '../../types';

export type TabId = 'overview' | 'shipments' | 'map' | 'learning';

const NAV: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'shipments', label: 'Shipments' },
  { id: 'map', label: 'Network Map' },
  { id: 'learning', label: 'Learning' },
];

interface DashboardSidebarProps {
  currentTab: TabId;
  onNavigate: (tab: TabId) => void;
  state: AgentState;
}

export function DashboardSidebar({ currentTab, onNavigate, state }: DashboardSidebarProps) {
  const atRiskCount = Object.values(state.shipments).filter(s => (s.failure_prob ?? 0) >= 0.75).length;

  return (
    <aside
      className="flex flex-col w-[220px] bg-[var(--navy-900)] border-r border-white/[0.06] overflow-hidden shrink-0"
      style={{ fontFamily: 'var(--font)' }}
    >
      <div className="flex items-center gap-2 px-4 h-[54px] border-b border-white/[0.06] shrink-0">
        <div className="w-[26px] h-[26px] rounded-[6px] bg-[var(--blue)] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
            <polygon points="8,1 14,4.5 14,11.5 8,15 2,11.5 2,4.5" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="8" cy="8" r="2" fill="white" />
          </svg>
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="text-[13px] font-bold text-white tracking-tight leading-tight">Phantom Fleet</div>
          <div className="text-[9px] text-white/30 tracking-wider uppercase font-mono">Ops Intelligence</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/20">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" style={{ boxShadow: '0 0 0 2px rgba(34,197,94,0.3)' }} />
          <span className="text-[9px] font-mono font-semibold text-[var(--green)] tracking-wider uppercase">Live</span>
        </div>
      </div>

      <nav className="flex-1 py-2 px-2 overflow-y-auto flex flex-col gap-px">
        <div className="text-[10px] font-mono tracking-widest uppercase text-white/20 px-2 pt-2 pb-1">Workspace</div>
        {NAV.map(({ id, label }) => {
          const isActive = currentTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`
                flex items-center gap-2 px-2 py-1.5 rounded-md text-[12.5px] font-medium transition-all text-left
                ${isActive ? 'bg-[var(--blue)]/12 text-white border border-[var(--blue)]/20' : 'text-white/50 hover:bg-white/5 hover:text-white/80 border border-transparent'}
              `}
            >
              <NavIcon id={id} active={isActive} />
              {label}
              {id === 'shipments' && atRiskCount > 0 && (
                <span className="ml-auto text-[10px] font-mono font-semibold bg-[var(--red)]/20 text-[var(--red)] px-1.5 py-0.5 rounded-md border border-[var(--red)]/20 min-w-[18px] text-center">
                  {atRiskCount}
                </span>
              )}
            </button>
          );
        })}
        <div className="h-px bg-white/5 my-1.5 mx-2" />
        <div className="text-[10px] font-mono tracking-widest uppercase text-white/20 px-2 pt-1 pb-1">Agent</div>
        <button type="button" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[12.5px] font-medium text-white/50 hover:bg-white/5 hover:text-white/80 transition-all text-left">
          <AgentGraphIcon />
          Agent Graph
        </button>
        <button type="button" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[12.5px] font-medium text-white/50 hover:bg-white/5 hover:text-white/80 transition-all text-left">
          <EventLogIcon />
          Event Log
        </button>
      </nav>

      <div className="p-3 pt-2.5 border-t border-white/[0.06] shrink-0 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/25 tracking-widest uppercase">Agent</span>
          <span className="text-[10px] font-mono font-semibold text-[var(--green)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" /> Online
          </span>
        </div>
        <div className="flex items-center justify-between px-2 py-1.5 bg-white/5 border border-white/6 rounded-md">
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Tick</span>
          <span className="text-[14px] font-bold text-white font-mono leading-none">{state.tick}</span>
        </div>
      </div>
    </aside>
  );
}

function NavIcon({ id, active }: { id: TabId; active: boolean }) {
  const cls = `w-3.5 h-3.5 shrink-0 ${active ? 'opacity-100 text-[var(--blue-light)]' : 'opacity-55'}`;
  switch (id) {
    case 'overview':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="6" height="6" rx="1.5" />
          <rect x="9" y="1" width="6" height="6" rx="1.5" />
          <rect x="1" y="9" width="6" height="6" rx="1.5" />
          <rect x="9" y="9" width="6" height="6" rx="1.5" />
        </svg>
      );
    case 'shipments':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 4h14M1 4l2-3h10l2 3M1 4v9a1 1 0 001 1h12a1 1 0 001-1V4" />
          <path d="M6 8h4" />
        </svg>
      );
    case 'map':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="1,3 6,1 10,3 15,1 15,13 10,15 6,13 1,15" />
          <line x1="6" y1="1" x2="6" y2="13" />
          <line x1="10" y1="3" x2="10" y2="15" />
        </svg>
      );
    case 'learning':
      return (
        <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 12 Q 8 2 14 12" />
          <circle cx="8" cy="8" r="2.5" />
        </svg>
      );
    default:
      return null;
  }
}

function AgentGraphIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 opacity-55" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="4" r="2.5" />
      <circle cx="2" cy="12" r="2" />
      <circle cx="14" cy="12" r="2" />
      <line x1="8" y1="6.5" x2="3.7" y2="10.3" />
      <line x1="8" y1="6.5" x2="12.3" y2="10.3" />
    </svg>
  );
}

function EventLogIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 opacity-55" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3" width="14" height="10" rx="2" />
      <line x1="4" y1="7" x2="12" y2="7" />
      <line x1="4" y1="10" x2="9" y2="10" />
    </svg>
  );
}
