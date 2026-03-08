import type { AgentState } from '../../types';
import { ReasoningCard } from './ReasoningCard';
import { EscalationCards } from './EscalationCards';

interface RightPanelProps {
  state: AgentState;
  onApprove: (id: string, decision: 'approve' | 'reject') => void;
  loadingId: string | null;
}

export function RightPanel({ state, onApprove, loadingId }: RightPanelProps) {
  return (
    <aside className="flex flex-col bg-[var(--surface)] border-l border-[var(--border)] overflow-hidden w-[340px] shrink-0">
      <ReasoningCard state={state} />
      <EscalationCards state={state} onApprove={onApprove} loadingId={loadingId} />
    </aside>
  );
}
