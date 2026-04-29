import { useEffect, useRef, useState } from 'react';

import type { IntegrationStatus, ObdStatus } from '../../services';
import type { AppSection, Attachment, CaseItem, ChatMessage } from '../../types';
import { AgentChatPanel } from '../chat/AgentChatPanel';
import { BottomObdToolbar } from '../layout/BottomObdToolbar';
import { Sidebar } from '../layout/Sidebar';
import { ObdWorkspace } from '../obd/ObdWorkspace';

type Props = {
  cases: CaseItem[];
  selectedCase: CaseItem;
  activeSection: AppSection;
  searchQuery: string;
  filter: 'Все' | 'В работе' | 'Ждёт ответа';
  messages: ChatMessage[];
  regionVisible: boolean;
  taskOpen: boolean;
  onOpenTask: () => void;
  onCloseTask: () => void;
  onToggleRegion: () => void;
  onAttachRegion: (attachment: Attachment) => void;
  onSendText: (text: string) => void;
  onExecuteAction: (cardId: string) => void;
  onExecuteEsp: () => void;
  onStopExecution: () => void;
  onObdMouseCommand: (type: 'mouse.move' | 'mouse.down' | 'mouse.up', x: number, y: number) => void | Promise<void>;
  onObdWheelCommand: (x: number, y: number, deltaX: number, deltaY: number) => void | Promise<void>;
  onObdKeyboardCommand: (type: 'keyboard.type' | 'keyboard.key' | 'keyboard.hotkey', payload: Record<string, unknown>) => void | Promise<void>;
  executionLog: string[];
  draftAttachments: Attachment[];
  onRemoveDraftAttachment: (attachmentId: string) => void;
  onUpdateAttachmentComment: (attachmentId: string, comment: string) => void;
  onToast: (title: string, description?: string) => void;
  onSectionChange: (section: AppSection) => void;
  onCaseSelect: (caseId: string) => void;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: 'Все' | 'В работе' | 'Ждёт ответа') => void;
  onCreateCase: () => void;
  integrations: IntegrationStatus[];
  obdStatus: ObdStatus | null;
  onObdConnectionChange: (online: boolean) => void;
};

export function HomeObdPage({ cases, selectedCase, activeSection, searchQuery, filter, messages, regionVisible, taskOpen, onOpenTask, onCloseTask, onToggleRegion, onAttachRegion, onSendText, onExecuteAction, onExecuteEsp, onStopExecution, onObdMouseCommand, onObdWheelCommand, onObdKeyboardCommand, executionLog, draftAttachments, onRemoveDraftAttachment, onUpdateAttachmentComment, onToast, onSectionChange, onCaseSelect, onSearchChange, onFilterChange, onCreateCase, integrations, obdStatus, onObdConnectionChange }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);

  useEffect(() => {
    const syncFullscreen = () => {
      if (!document.fullscreenElement) {
        setFullscreen(false);
        setLeftPanelVisible(false);
        setRightPanelVisible(false);
      }
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    if (fullscreen) {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setFullscreen(false);
      setLeftPanelVisible(false);
      setRightPanelVisible(false);
      return;
    }

    setFullscreen(true);
    await rootRef.current?.requestFullscreen?.();
  };

  return (
    <div ref={rootRef} className={`min-w-0 flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 ${fullscreen ? 'fixed inset-0 z-50 p-0' : 'p-4'}`}>
      <div className={`flex min-h-0 min-w-0 flex-1 overflow-hidden ${fullscreen ? 'relative gap-0' : 'gap-4'}`}>
        <ObdWorkspace fullscreen={fullscreen} onToggleFullscreen={toggleFullscreen} regionVisible={regionVisible} taskOpen={taskOpen} onOpenTask={onOpenTask} onCloseTask={onCloseTask} onAttachRegion={onAttachRegion} onToast={onToast} onObdMouseCommand={onObdMouseCommand} onObdWheelCommand={onObdWheelCommand} onObdKeyboardCommand={onObdKeyboardCommand} obdStatus={obdStatus} onConnectionChange={onObdConnectionChange} />
        {!fullscreen ? <AgentChatPanel messages={messages} draftAttachments={draftAttachments} onRemoveDraftAttachment={onRemoveDraftAttachment} onUpdateAttachmentComment={onUpdateAttachmentComment} onSendText={onSendText} onExecuteAction={onExecuteAction} onToast={onToast} /> : null}

        {fullscreen ? (
          <>
            <div className="absolute left-0 top-0 z-20 h-full w-[10px]" onMouseEnter={() => setLeftPanelVisible(true)} />
            <div className={`absolute bottom-0 left-0 top-0 z-30 h-screen transition-transform duration-200 ${leftPanelVisible ? 'translate-x-0' : '-translate-x-full'}`} onMouseLeave={() => setLeftPanelVisible(false)}>
              <Sidebar activeSection={activeSection} cases={cases} selectedCaseId={selectedCase.id} searchQuery={searchQuery} filter={filter} onSectionChange={onSectionChange} onCaseSelect={onCaseSelect} onSearchChange={onSearchChange} onFilterChange={onFilterChange} onCreateCase={onCreateCase} />
            </div>
            <div className="absolute right-0 top-0 z-20 h-full w-[10px]" onMouseEnter={() => setRightPanelVisible(true)} />
            <div className={`absolute bottom-0 right-0 top-0 z-30 h-screen transition-transform duration-200 ${rightPanelVisible ? 'translate-x-0' : 'translate-x-full'}`} onMouseLeave={() => setRightPanelVisible(false)}>
              <AgentChatPanel className="h-full rounded-none" messages={messages} draftAttachments={draftAttachments} onRemoveDraftAttachment={onRemoveDraftAttachment} onUpdateAttachmentComment={onUpdateAttachmentComment} onSendText={onSendText} onExecuteAction={onExecuteAction} onToast={onToast} />
            </div>
          </>
        ) : null}
      </div>
      <BottomObdToolbar
        executionLog={executionLog}
        regionVisible={regionVisible}
        onToggleRegion={onToggleRegion}
        onOpenTask={onOpenTask}
        onExecuteEsp={onExecuteEsp}
        onStop={onStopExecution}
        onToast={onToast}
        integrations={integrations}
        obdStatus={obdStatus}
      />
    </div>
  );
}
