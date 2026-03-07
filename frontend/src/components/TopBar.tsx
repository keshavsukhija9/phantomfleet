
interface TopBarProps {
  tick: number;
  autoRun: boolean;
  onToggleAutoRun: () => void;
  onRunTick: () => void;
  isLoading: boolean;
}

export function TopBar({ tick, autoRun, onToggleAutoRun, onRunTick, isLoading }: TopBarProps) {
  return (
    <header className="top-bar">
      <span className="top-bar-brand">Phantom Fleet</span>
      <div className="top-bar-meta">
        <span className="top-bar-tick">Tick {tick}</span>
        <span className={autoRun ? 'auto-run-badge active' : 'auto-run-badge'}>
          {autoRun ? 'Auto-run on' : 'Auto-run off'}
        </span>
        <button
          type="button"
          className="btn-icon"
          onClick={onToggleAutoRun}
          title={autoRun ? 'Stop auto-run' : 'Start auto-run'}
          aria-label={autoRun ? 'Stop auto-run' : 'Start auto-run'}
        >
          {autoRun ? '⏸' : '▶'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onRunTick}
          disabled={isLoading || autoRun}
          title="Run one tick"
        >
          {isLoading ? 'Running…' : 'Run tick'}
        </button>
      </div>
    </header>
  );
}
