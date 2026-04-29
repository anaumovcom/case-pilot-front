import { AlertTriangle, Cpu, FileText, Plus, ShieldCheck, X } from 'lucide-react';
import { Suspense, lazy, useState } from 'react';

import { CaseDetailsDrawer } from '../components/cases/CaseDetailsDrawer';
import { AppShell } from '../components/layout/AppShell';
import { HomeObdPage } from '../components/pages/HomeObdPage';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { ToastStack } from '../components/ui/Toast';
import { useCaseState } from '../hooks/useCaseState';
import { useChatState } from '../hooks/useChatState';
import { useExecutionState } from '../hooks/useExecutionState';
import { useObdRegionState } from '../hooks/useObdRegionState';
import { useSystemStatus } from '../hooks/useSystemStatus';
import { useToastState } from '../hooks/useToastState';
import type { ObdStatus } from '../services';
import type { AgentActionCard, AppSection } from '../types';

const CasesPage = lazy(() => import('../components/pages/CasesPage').then((module) => ({ default: module.CasesPage })));
const DiagnosticsPage = lazy(() => import('../components/pages/DiagnosticsPage').then((module) => ({ default: module.DiagnosticsPage })));
const GlobalSearchPage = lazy(() => import('../components/pages/GlobalSearchPage').then((module) => ({ default: module.GlobalSearchPage })));
const IntegrationsPage = lazy(() => import('../components/pages/IntegrationsPage').then((module) => ({ default: module.IntegrationsPage })));
const MacrosPage = lazy(() => import('../components/pages/MacrosPage').then((module) => ({ default: module.MacrosPage })));
const MemoryPage = lazy(() => import('../components/pages/MemoryPage').then((module) => ({ default: module.MemoryPage })));
const TelegramPage = lazy(() => import('../components/pages/TelegramPage').then((module) => ({ default: module.TelegramPage })));

function resolveObdStatus(obdStatus: ObdStatus | null, localCameraOnline: boolean): ObdStatus | null {
  if (!localCameraOnline) {
    return obdStatus;
  }

  return {
    status: 'online',
    fps: obdStatus?.fps ?? 0,
    latencyMs: obdStatus?.latencyMs ?? 0,
    screenWidth: obdStatus?.screenWidth ?? 0,
    screenHeight: obdStatus?.screenHeight ?? 0,
    source: 'obs-virtual-camera',
    sceneName: obdStatus?.sceneName,
    lastFrameAt: obdStatus?.lastFrameAt,
    error: undefined,
  };
}

function App() {
  const { toasts, showToast, dismissToast } = useToastState();
  const caseState = useCaseState(showToast);
  const chatState = useChatState(showToast, caseState.selectedCaseId);
  const obdRegion = useObdRegionState();
  const systemStatus = useSystemStatus(showToast);
  const execution = useExecutionState(chatState.messages, chatState.setMessages, showToast);
  const [activeSection, setActiveSection] = useState<AppSection>('home');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const [localObdOnline, setLocalObdOnline] = useState(false);
  const selectedCase = caseState.selectedCase;
  const effectiveObdStatus = resolveObdStatus(systemStatus.obdStatus, localObdOnline);

  const createCase = async (title: string) => {
    await caseState.createCase(title);
    setActiveSection('home');
    setNewCaseOpen(false);
  };

  const attachRegionToDraft = (attachment: Parameters<typeof chatState.attachRegionToDraft>[0]) => {
    chatState.attachRegionToDraft(attachment);
    obdRegion.hideRegionTask();
  };

  if (!selectedCase) {
    return (
      <div className="grid h-screen place-items-center bg-slate-50 p-6 text-center">
        <Card className="max-w-md p-6">
          <h1 className="text-xl font-semibold text-slate-950">Кейсов пока нет</h1>
          <p className="mt-2 text-sm text-slate-500">Создайте первый кейс, чтобы открыть рабочее место OBD.</p>
          <Button className="mt-5" variant="primary" onClick={() => setNewCaseOpen(true)}><Plus className="h-4 w-4" /> Новый кейс</Button>
        </Card>
        <NewCaseModal open={newCaseOpen} onClose={() => setNewCaseOpen(false)} onCreate={createCase} />
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <>
      <AppShell
        activeSection={activeSection}
        cases={caseState.visibleCases}
        selectedCase={selectedCase}
        searchQuery={caseState.caseSearch}
        filter={caseState.caseFilter}
        onSectionChange={setActiveSection}
        onCaseSelect={caseState.setSelectedCaseId}
        onSearchChange={caseState.setCaseSearch}
        onFilterChange={caseState.setCaseFilter}
        onCreateCase={() => setNewCaseOpen(true)}
        onOpenDetails={() => setDetailsOpen(true)}
        onOpenSummary={() => setSummaryOpen(true)}
        onNewChat={() => showToast('Новый чат создан', 'Чат продолжен с контекстом кейса.', 'success')}
        integrations={systemStatus.integrations}
        obdStatus={effectiveObdStatus}
      >
        {activeSection === 'home' ? (
          <HomeObdPage
            cases={caseState.visibleCases}
            selectedCase={selectedCase}
            activeSection={activeSection}
            searchQuery={caseState.caseSearch}
            filter={caseState.caseFilter}
            messages={chatState.messages}
            regionVisible={obdRegion.regionVisible}
            taskOpen={obdRegion.taskOpen}
            onOpenTask={obdRegion.openTask}
            onCloseTask={obdRegion.closeTask}
            onToggleRegion={obdRegion.toggleRegion}
            onAttachRegion={attachRegionToDraft}
            onSendText={chatState.sendTextMessage}
            onExecuteAction={execution.requestExecuteAction}
            onExecuteEsp={execution.requestLatestReadyAction}
            onStopExecution={execution.stopExecution}
            onObdMouseCommand={execution.sendObdMouseCommand}
            onObdWheelCommand={execution.sendObdWheelCommand}
            onObdKeyboardCommand={execution.sendObdKeyboardCommand}
            executionLog={execution.executionLog}
            draftAttachments={chatState.draftAttachments}
            onRemoveDraftAttachment={chatState.removeDraftAttachment}
            onUpdateAttachmentComment={chatState.updateAttachmentComment}
            onToast={showToast}
            onSectionChange={setActiveSection}
            onCaseSelect={caseState.setSelectedCaseId}
            onSearchChange={caseState.setCaseSearch}
            onFilterChange={caseState.setCaseFilter}
            onCreateCase={() => setNewCaseOpen(true)}
            integrations={systemStatus.integrations}
            obdStatus={effectiveObdStatus}
            onObdConnectionChange={setLocalObdOnline}
          />
        ) : (
          <Suspense fallback={<SectionFallback />}>
            {activeSection === 'cases' ? <CasesPage cases={caseState.cases} onCreateCase={() => setNewCaseOpen(true)} onCloseCase={(caseId) => void caseState.closeCase(caseId)} messages={chatState.messages} onSendText={chatState.sendTextMessage} onExecuteAction={execution.requestExecuteAction} onUpdateAttachmentComment={chatState.updateAttachmentComment} onToast={showToast} /> : null}
            {activeSection === 'search' ? <GlobalSearchPage /> : null}
            {activeSection === 'telegram' ? <TelegramPage cases={caseState.cases} onCreateCase={() => setNewCaseOpen(true)} onToast={showToast} /> : null}
            {activeSection === 'memory' ? <MemoryPage /> : null}
            {activeSection === 'macros' ? <MacrosPage onToast={showToast} /> : null}
            {activeSection === 'integrations' ? <IntegrationsPage /> : null}
            {activeSection === 'diagnostics' ? <DiagnosticsPage /> : null}
          </Suspense>
        )}
      </AppShell>

      <CaseDetailsDrawer open={detailsOpen} selectedCase={selectedCase} onClose={() => setDetailsOpen(false)} onSaved={() => showToast('Описание сохранено', 'Изменения отражены в деталях кейса.', 'success')} />
      <SummaryModal open={summaryOpen} onClose={() => setSummaryOpen(false)} />
      <NewCaseModal open={newCaseOpen} onClose={() => setNewCaseOpen(false)} onCreate={createCase} />
      <ExecutionConfirmModal action={execution.pendingAction} running={execution.running} onClose={() => execution.setPendingAction(null)} onConfirm={execution.confirmExecuteAction} />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

function SectionFallback() {
  return (
    <main className="min-h-0 flex-1 p-6">
      <Card className="grid h-full min-h-[320px] place-items-center p-8 text-sm font-medium text-slate-500">Загрузка раздела...</Card>
    </main>
  );
}

function ExecutionConfirmModal({ action, running, onClose, onConfirm }: { action: AgentActionCard | null; running: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!action) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/25 p-6 backdrop-blur-sm" onMouseDown={onClose}>
      <Card className="w-full max-w-2xl p-6" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600"><ShieldCheck className="h-4 w-4" /> Подтверждение действия ESP32</div>
            <h2 className="text-xl font-semibold text-slate-950">Проверьте действие перед выполнением</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Закрыть подтверждение"><X className="h-5 w-5" /></button>
        </div>
        {action.dangerous ? (
          <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Это потенциально опасное действие. Выполняйте его только если проверили цель и последствия.
          </div>
        ) : null}
        <div className="space-y-4 text-sm text-slate-700">
          {action.targetRegion ? (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Целевая область: x {action.targetRegion.x}, y {action.targetRegion.y}, w {action.targetRegion.width}, h {action.targetRegion.height}
            </div>
          ) : null}
          {action.textToInsert ? (
            <div>
              <div className="mb-1 font-semibold text-slate-950">Текст для ввода</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-700">“{action.textToInsert}”</div>
            </div>
          ) : null}
          <div>
            <div className="mb-2 font-semibold text-slate-950">План выполнения</div>
            <ol className="space-y-2">
              {(action.executionPlan ?? ['Выполнить действие через ESP32.', 'Сохранить результат в хронологию кейса.']).map((item, index) => (
                <li key={item} className="flex gap-2"><span className="font-semibold text-blue-600">{index + 1}.</span><span>{item}</span></li>
              ))}
            </ol>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onClose} disabled={running}>Отмена</Button>
          <Button variant="primary" onClick={onConfirm} disabled={running}><Cpu className="h-4 w-4" /> {running ? 'Выполняется...' : 'Подтвердить и выполнить'}</Button>
        </div>
      </Card>
    </div>
  );
}

function SummaryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/25 p-6 backdrop-blur-sm" onMouseDown={onClose}>
      <Card className="w-full max-w-2xl p-6" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600"><FileText className="h-4 w-4" /> Автоматическая выжимка</div><h2 className="text-xl font-semibold text-slate-950">CASE-024 Заполнить форму</h2></div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Закрыть выжимку"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 text-sm leading-6 text-slate-600">
          <p><strong className="text-slate-950">Суть кейса:</strong> нужно заполнить комментарий для клиента в CRM на основе Telegram-контекста и данных заявки.</p>
          <p><strong className="text-slate-950">Что известно:</strong> клиент ТехноЛюкс просит подтверждение данных; внутренние технические детали показывать нельзя.</p>
          <p><strong className="text-slate-950">Следующий шаг:</strong> подтвердить ввод текста через ESP32, сделать контрольный скриншот и сохранить результат в ленту.</p>
        </div>
        <div className="mt-6 flex justify-end"><Button variant="primary" onClick={onClose}>Готово</Button></div>
      </Card>
    </div>
  );
}

function NewCaseModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (title: string) => void }) {
  const [title, setTitle] = useState('Новый рабочий кейс');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/25 p-6 backdrop-blur-sm" onMouseDown={onClose}>
      <Card className="w-full max-w-lg p-6" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-950">Новый кейс</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Закрыть создание кейса"><X className="h-5 w-5" /></button>
        </div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Название</label>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        <label className="mb-2 mt-4 block text-sm font-semibold text-slate-700">Описание</label>
        <Textarea rows={4} placeholder="Кратко опишите рабочую ситуацию..." />
        <div className="mt-6 flex justify-end gap-2"><Button onClick={onClose}>Отмена</Button><Button variant="primary" onClick={() => onCreate(title)}><Plus className="h-4 w-4" /> Создать</Button></div>
      </Card>
    </div>
  );
}

export default App;
