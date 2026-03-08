const TICKER_EVENTS = [
  { color: 'var(--amber)', text: 'Tick 3 incoming — C4 carrier degradation scheduled' },
  { color: 'var(--red)', text: 'S042 flagged — 83% failure prob — CARRIER_DEGRADATION' },
  { color: 'var(--blue)', text: 'Agent API — hypothesis generated for S042 — 91% confidence' },
  { color: 'var(--green)', text: 'S017 auto-rescued — rerouted W1→D1 — +3.5h ETA gain' },
  { color: 'var(--amber)', text: 'Tick 5 — Weather event Region B — 12 shipments affected' },
  { color: 'var(--red)', text: 'Escalation — S091 CRITICAL — awaiting human approval' },
  { color: 'var(--green)', text: 'ChromaDB — 7 episodes stored — C4 boost updated to ×0.82' },
  { color: 'var(--amber)', text: 'Tick 7 — W3 warehouse congestion — pressure 0.35→0.91' },
  { color: 'var(--blue)', text: 'Learning — C5 success rate 0.80 — boost multiplier 1.12' },
];

export function Ticker() {
  const duplicated = [...TICKER_EVENTS, ...TICKER_EVENTS];
  return (
    <div className="rounded-lg overflow-hidden flex items-center h-[34px] bg-[var(--navy-900)] shrink-0">
      <div className="flex items-center gap-1.5 px-3 h-full border-r border-white/10 bg-white/5 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" style={{ boxShadow: '0 0 0 2px rgba(34,197,94,0.3)' }} />
        <span className="text-[9.5px] font-mono font-semibold text-white/50 uppercase tracking-wider">Dispatch</span>
      </div>
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div className="ticker-inner flex gap-10 whitespace-nowrap">
          {duplicated.map((ev, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-white/50 font-mono shrink-0">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ev.color }} />
              {ev.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
