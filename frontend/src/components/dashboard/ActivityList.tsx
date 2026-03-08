const ACTIVITIES = [
  { type: 'observe', title: 'Tick processed — 50 shipments updated', meta: 'observe.py · SimulationEngine.step()', time: 'now', cls: 'bg-[#EFF6FF] text-[var(--blue)]' },
  { type: 'risk', title: '4 shipments flagged at risk', meta: 'XGBoost · threshold 0.75 · SHAP computed', time: '5s', cls: 'bg-[var(--red-bg)] text-[var(--red)]' },
  { type: 'reason', title: 'Agent API — hypothesis for S042', meta: 'CARRIER_DEGRADATION · 91% confidence', time: '8s', cls: 'bg-[var(--blue-glow)] text-[var(--blue)]' },
  { type: 'rescue', title: 'S017 auto-rescued via W1→D1', meta: 'score 0.84 · +3.5h ETA · +2.1% cost', time: '9s', cls: 'bg-[var(--green-bg)] text-[var(--green)]' },
  { type: 'escalate', title: 'S042 escalated — CRITICAL priority', meta: 'Guardrail G3 failed · awaiting approval', time: '9s', cls: 'bg-[var(--amber-bg)] text-[var(--amber)]' },
  { type: 'learn', title: '3 episodes stored in ChromaDB', meta: 'C4 boost ×0.82 · C5 boost ×1.12', time: '10s', cls: 'bg-[var(--green-bg)] text-[var(--green)]' },
];

const ICONS: Record<string, React.ReactNode> = {
  observe: (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5" /><path d="M7 4v3l2 2" />
    </svg>
  ),
  risk: (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 1L13 12H1Z" /><line x1="7" y1="5" x2="7" y2="8.5" />
    </svg>
  ),
  reason: (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5" /><path d="M5 5.5 Q7 3 9 5.5 Q7 8 5 5.5" />
    </svg>
  ),
  rescue: (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 7L5.5 10.5 L12 4" />
    </svg>
  ),
  escalate: (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 2v7M4 6l3-4 3 4" /><line x1="4" y1="12" x2="10" y2="12" />
    </svg>
  ),
  learn: (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 11 Q7 3 12 11" /><circle cx="7" cy="7" r="2" />
    </svg>
  ),
};

export function ActivityList() {
  return (
    <div className="panel">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
        <div className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">Agent Activity</div>
        <span className="text-[11.5px] font-medium text-[var(--blue)] cursor-pointer px-2 py-1 rounded-md hover:bg-[var(--blue-glow)] transition-colors">View all</span>
      </div>
      <div className="max-h-[180px] overflow-y-auto py-1">
        {ACTIVITIES.map((a, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-2.5 border-b border-[var(--border)] last:border-0 animate-[rowIn_0.3s_ease_forwards]"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className={`w-[26px] h-[26px] rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${a.cls}`}>
              {ICONS[a.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium text-[var(--text-primary)] tracking-tight truncate">{a.title}</div>
              <div className="text-[11px] text-[var(--text-tertiary)] font-mono mt-0.5">{a.meta}</div>
            </div>
            <div className="text-[10.5px] text-[var(--text-tertiary)] font-mono shrink-0 mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
