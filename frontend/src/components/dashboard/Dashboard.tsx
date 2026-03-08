import { useState } from 'react';
import type { AgentState } from '../../types';
import type { TabId } from './DashboardSidebar';
import { DashboardSidebar } from './DashboardSidebar';
import { Topbar } from './Topbar';
import { TabStrip } from './TabStrip';
import { Ticker } from './Ticker';
import { KPIRow } from './KPIRow';
import { OrdalStrip } from './OrdalStrip';
import { MapRiskRow } from './MapRiskRow';
import { ActivityList } from './ActivityList';
import { LearningSection } from './LearningSection';
import { RightPanel } from './RightPanel';

interface DashboardProps {
  state: AgentState;
  autoRun: boolean;
  onToggleAutoRun: () => void;
  onRunTick: () => void;
  onApprove: (id: string, decision: 'approve' | 'reject') => void;
  isLoading: boolean;
  approveLoadingId: string | null;
}

export function Dashboard({
  state,
  autoRun,
  onToggleAutoRun,
  onRunTick,
  onApprove,
  isLoading,
  approveLoadingId,
}: DashboardProps) {
  const [tab, setTab] = useState<TabId>('overview');

  return (
    <div className="app-shell">
      <DashboardSidebar currentTab={tab} onNavigate={setTab} state={state} />

      <main className="flex flex-col overflow-hidden bg-[var(--bg)] min-w-0">
        <Topbar
          state={state}
          autoRun={autoRun}
          onToggleAutoRun={onToggleAutoRun}
          onRunTick={onRunTick}
          isLoading={isLoading}
        />
        <TabStrip currentTab={tab} onTab={setTab} state={state} />

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <Ticker />
          <KPIRow state={state} />
          <OrdalStrip state={state} />
          <MapRiskRow state={state} onHighlight={() => {}} />
          <ActivityList />

          <div className={tab === 'learning' ? '' : 'panel-hidden'}>
            <LearningSection state={state} />
          </div>
        </div>
      </main>

      <RightPanel state={state} onApprove={onApprove} loadingId={approveLoadingId} />
    </div>
  );
}
