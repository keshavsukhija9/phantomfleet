
type ViewId = 'overview' | 'network' | 'risk' | 'reasoning' | 'interventions' | 'learning';

const NAV: { id: ViewId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '◉' },
  { id: 'network', label: 'Network', icon: '◎' },
  { id: 'risk', label: 'Risk Monitor', icon: '⚠' },
  { id: 'reasoning', label: 'AI Reasoning', icon: '◆' },
  { id: 'interventions', label: 'Interventions', icon: '→' },
  { id: 'learning', label: 'Learning', icon: '◇' },
];

interface SidebarProps {
  currentView: ViewId;
  onNavigate: (view: ViewId) => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav>
        <ul className="sidebar-nav">
          {NAV.map(({ id, label, icon }) => (
            <li key={id} className="sidebar-nav-item">
              <button
                type="button"
                className={`sidebar-nav-link ${currentView === id ? 'active' : ''}`}
                onClick={() => onNavigate(id)}
              >
                <span className="sidebar-nav-icon" aria-hidden>{icon}</span>
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export type { ViewId };
