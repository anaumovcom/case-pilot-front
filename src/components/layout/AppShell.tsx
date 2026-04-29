import type { ReactNode } from 'react';

import type { AppSection, CaseItem } from '../../types';
import type { IntegrationStatus, ObdStatus } from '../../services';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

type Props = {
  children: ReactNode;
  activeSection: AppSection;
  cases: CaseItem[];
  selectedCase: CaseItem;
  searchQuery: string;
  filter: 'Все' | 'В работе' | 'Ждёт ответа';
  onSectionChange: (section: AppSection) => void;
  onCaseSelect: (caseId: string) => void;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: 'Все' | 'В работе' | 'Ждёт ответа') => void;
  onCreateCase: () => void;
  onOpenDetails: () => void;
  onOpenSummary: () => void;
  onNewChat: () => void;
  integrations: IntegrationStatus[];
  obdStatus: ObdStatus | null;
};

export function AppShell({ children, activeSection, cases, selectedCase, searchQuery, filter, onSectionChange, onCaseSelect, onSearchChange, onFilterChange, onCreateCase, onOpenDetails, onOpenSummary, onNewChat, integrations, obdStatus }: Props) {
  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-950">
      <TopBar activeSection={activeSection} onSectionChange={onSectionChange} onOpenDetails={onOpenDetails} onOpenSummary={onOpenSummary} onNewChat={onNewChat} integrations={integrations} obdStatus={obdStatus} />
      <div className="flex min-h-0 flex-1">
        <Sidebar activeSection={activeSection} cases={cases} selectedCaseId={selectedCase.id} searchQuery={searchQuery} filter={filter} onSectionChange={onSectionChange} onCaseSelect={onCaseSelect} onSearchChange={onSearchChange} onFilterChange={onFilterChange} onCreateCase={onCreateCase} />
        {children}
      </div>
    </div>
  );
}
