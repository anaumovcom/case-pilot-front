import { Bot, CheckCircle2, Clock3, Crosshair, GripVertical, Keyboard, ListPlus, MousePointer2, Pencil, Play, Plus, Save, Square, TerminalSquare, Trash2, Type, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { PageShell } from './CasesPage';

type MacroStepType = 'key' | 'hotkey' | 'typeText' | 'moveMouse' | 'clickAbsolute' | 'delay' | 'setParameter' | 'askAgent';

type MacroStep = {
  id: string;
  type: MacroStepType;
  value: string;
  description: string;
  delayMs?: number;
  paramName?: string;
  outputParam?: string;
};

type Macro = {
  id: string;
  name: string;
  description: string;
  parameterName?: string;
  steps: MacroStep[];
  lastRun?: string;
};

type MacroRunState = 'idle' | 'running' | 'stopped' | 'completed';
type StepInsertPosition = number | 'append' | 'start';

const stepLabels: Record<MacroStepType, string> = {
  key: 'Клавиша',
  hotkey: 'Комбинация',
  typeText: 'Печать текста',
  moveMouse: 'Движение мыши',
  clickAbsolute: 'Клик по координатам',
  delay: 'Задержка',
  setParameter: 'Параметр',
  askAgent: 'Спросить агента',
};

const stepDescriptions: Record<MacroStepType, string> = {
  key: 'Нажать одну клавишу.',
  hotkey: 'Нажать популярную комбинацию клавиш.',
  typeText: 'Напечатать текст посимвольно.',
  moveMouse: 'Переместить курсор в абсолютную позицию.',
  clickAbsolute: 'Кликнуть мышкой по абсолютным координатам.',
  delay: 'Подождать указанное количество миллисекунд.',
  setParameter: 'Установить значение параметра макроса.',
  askAgent: 'Отправить шаблон агенту и сохранить ответ в параметр.',
};

const stepIcons: Record<MacroStepType, typeof Keyboard> = {
  key: Keyboard,
  hotkey: TerminalSquare,
  typeText: Type,
  moveMouse: MousePointer2,
  clickAbsolute: Crosshair,
  delay: Clock3,
  setParameter: TerminalSquare,
  askAgent: Bot,
};

const hotkeyOptions = ['Ctrl+C', 'Ctrl+V', 'Ctrl+A', 'Ctrl+X', 'Ctrl+Z', 'Ctrl+Y', 'Alt+Tab', 'Alt+F4', 'Win+D', 'Win+R', 'Ctrl+L', 'Ctrl+T', 'Ctrl+W'];

const keyOptions = ['Windows', 'Enter', 'Tab', 'Esc', 'Backspace', 'Delete', 'Space', 'F5', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

const initialMacroParameters = {
  url: 'https://casepilot.local/cases/CASE-024',
  caseId: 'CASE-024',
};

const parameterNamePattern = /^[A-Za-z][A-Za-z0-9_-]*$/;

const initialMacros: Macro[] = [
  {
      id: 'macro-open-link',
      name: 'Открыть ссылку в браузере',
      description: 'Запускает Chrome на удалённом OBD и открывает переданную ссылку.',
      steps: [
        { id: 'step-win', type: 'key', value: 'Windows', description: 'Нажать кнопку Windows' },
        { id: 'step-chrome', type: 'typeText', value: 'Chrome', description: 'Напечатать Chrome посимвольно' },
        { id: 'step-enter-app', type: 'key', value: 'Enter', description: 'Нажать Enter' },
        { id: 'step-link', type: 'typeText', value: '{{url}}', description: 'Напечатать значение параметра {{url}}' },
        { id: 'step-enter-link', type: 'key', value: 'Enter', description: 'Нажать Enter' },
      ],
  },
  {
      id: 'macro-refresh-obd',
      name: 'Обновить страницу OBD',
      description: 'Возвращает фокус в удалённое окно и обновляет текущую страницу.',
      steps: [
        { id: 'step-move', type: 'moveMouse', value: '960,540', description: 'Переместить мышку в центр удалённого OBD' },
        { id: 'step-focus', type: 'clickAbsolute', value: '960,540', description: 'Кликнуть по центру удалённого OBD' },
        { id: 'step-refresh', type: 'key', value: 'F5', description: 'Нажать F5' },
        { id: 'step-wait', type: 'delay', value: '2000', description: 'Задержка 2000 мс' },
      ],
  },
];

const emptyStep: Omit<MacroStep, 'id'> = {
  type: 'key',
  value: 'Enter',
  description: '',
  delayMs: 300,
  paramName: '',
  outputParam: 'agentAnswer',
};

type Props = {
  onToast: (title: string, description?: string, type?: 'success' | 'warning' | 'info') => void;
};

export function MacrosPage({ onToast }: Props) {
  const [macros, setMacros] = useState<Macro[]>(initialMacros);
  const [selectedMacroId, setSelectedMacroId] = useState(initialMacros[0].id);
  const [macroParameters, setMacroParameters] = useState<Record<string, string>>(initialMacroParameters);
  const [newParamName, setNewParamName] = useState('');
  const [newParamValue, setNewParamValue] = useState('');
  const [newMacroName, setNewMacroName] = useState('');
  const [newStep, setNewStep] = useState<Omit<MacroStep, 'id'>>(emptyStep);
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [insertPosition, setInsertPosition] = useState<StepInsertPosition>('append');
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [draggingStepIndex, setDraggingStepIndex] = useState<number | null>(null);
  const [runState, setRunState] = useState<MacroRunState>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const timerRef = useRef<number | null>(null);
  const parametersRef = useRef<Record<string, string>>(initialMacroParameters);

  const selectedMacro = useMemo(() => macros.find((macro) => macro.id === selectedMacroId), [macros, selectedMacroId]);
  const currentStep = selectedMacro && currentStepIndex !== null ? selectedMacro.steps[currentStepIndex] : undefined;

  useEffect(() => {
    stopTimer();
    setRunState('idle');
    setCurrentStepIndex(null);
    setCompletedStepIds([]);
  }, [selectedMacroId]);

  useEffect(() => () => stopTimer(), []);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const updateMacroParameters = (updater: (current: Record<string, string>) => Record<string, string>) => {
    const next = updater(parametersRef.current);
    parametersRef.current = next;
    setMacroParameters(next);
  };

  const renderTemplate = (template: string) => template.replace(/{{\s*([A-Za-z][A-Za-z0-9_-]*)\s*}}/g, (_, key: string) => parametersRef.current[key] ?? `{{${key}}}`);

  const getStepValue = (step: MacroStep) => {
    if (step.type === 'setParameter') return `${step.paramName || 'parameterName'} = ${renderTemplate(step.value)}`;
    if (step.type === 'typeText' || step.type === 'askAgent') return renderTemplate(step.value);
    return step.value;
  };

  const getAgentAnswer = (prompt: string) => `Ответ агента на: ${prompt}`;

  const executeStepEffect = (step: MacroStep) => {
    if (step.type === 'askAgent' && step.outputParam?.trim()) {
      const prompt = renderTemplate(step.value);
      updateMacroParameters((current) => ({ ...current, [step.outputParam!.trim()]: getAgentAnswer(prompt) }));
    }

    if (step.type === 'setParameter' && parameterNamePattern.test(step.paramName?.trim() ?? '')) {
      updateMacroParameters((current) => ({ ...current, [step.paramName!.trim()]: renderTemplate(step.value) }));
    }
  };

  const getStepDuration = (step: MacroStep) => {
    const delay = step.delayMs ?? 0;
    if (step.type === 'delay') {
      const waitMs = Number.parseInt(step.value, 10);
      return Math.max(0, Number.isFinite(waitMs) ? waitMs : 0) + delay;
    }
    if (step.type === 'typeText' || step.type === 'setParameter') return Math.max(350, getStepValue(step).length * 35) + delay;
    if (step.type === 'askAgent') return 1200 + delay;
    return 550 + delay;
  };

  const getDefaultValueForType = (type: MacroStepType) => {
    if (type === 'key') return 'Enter';
    if (type === 'hotkey') return 'Ctrl+V';
    if (type === 'moveMouse' || type === 'clickAbsolute') return '960,540';
    if (type === 'delay') return '1000';
    if (type === 'setParameter') return '';
    if (type === 'askAgent') return 'Проанализируй кейс {{caseId}} и подготовь короткий ответ для {{url}}';
    return '';
  };

  const getAutoDescription = (step: Omit<MacroStep, 'id'>) => {
    if (step.type === 'key') return `Нажать клавишу ${step.value}`;
    if (step.type === 'hotkey') return `Нажать ${step.value}`;
    if (step.type === 'typeText') return 'Напечатать текст посимвольно';
    if (step.type === 'moveMouse') return `Переместить мышку в ${step.value}`;
    if (step.type === 'clickAbsolute') return `Кликнуть по координатам ${step.value}`;
    if (step.type === 'delay') return `Задержка ${step.value} мс`;
    if (step.type === 'setParameter') return `Установить параметр ${step.paramName || 'parameterName'}`;
    return `Спросить у агента и сохранить ответ в ${step.outputParam || 'agentAnswer'}`;
  };

  const createParameter = () => {
    const name = newParamName.trim();
    if (!parameterNamePattern.test(name)) {
      onToast('Имя параметра должно быть латиницей', 'Например: clientReply или agent_answer.', 'warning');
      return;
    }
    updateMacroParameters((current) => ({ ...current, [name]: newParamValue }));
    setNewParamName('');
    setNewParamValue('');
    onToast('Параметр создан', `{{${name}}}`, 'success');
  };

  const updateParameterValue = (name: string, value: string) => {
    updateMacroParameters((current) => ({ ...current, [name]: value }));
  };

  const deleteParameter = (name: string) => {
    updateMacroParameters((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
    onToast('Параметр удалён', `{{${name}}}`, 'success');
  };

  const markRunTime = (macroId: string) => {
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    setMacros((current) => current.map((macro) => (macro.id === macroId ? { ...macro, lastRun: time } : macro)));
  };

  const validateRun = () => {
    if (!selectedMacro || selectedMacro.steps.length === 0) return false;
    return true;
  };

  const finishRun = (macroId: string) => {
    markRunTime(macroId);
    setRunState('completed');
    setCurrentStepIndex(null);
  };

  const runStepSequence = (macroId: string, stepIndex: number) => {
    const macro = macros.find((item) => item.id === macroId);
    if (!macro) return;

    if (stepIndex >= macro.steps.length) {
      finishRun(macroId);
      onToast('Макрос выполнен', `${macro.name}: ${macro.steps.length} шагов`, 'success');
      return;
    }

    setCurrentStepIndex(stepIndex);
    executeStepEffect(macro.steps[stepIndex]);
    timerRef.current = window.setTimeout(() => {
      setCompletedStepIds((current) => [...new Set([...current, macro.steps[stepIndex].id])]);
      runStepSequence(macroId, stepIndex + 1);
    }, getStepDuration(macro.steps[stepIndex]));
  };

  const createMacro = () => {
    const name = newMacroName.trim();
    if (!name) {
      onToast('Введите название макроса', 'Название нужно, чтобы сохранить последовательность.', 'warning');
      return;
    }

    const macro: Macro = {
      id: `macro-${Date.now()}`,
      name,
      description: 'Новая последовательность действий для удалённого OBD.',
      steps: [],
    };

    setMacros((current) => [macro, ...current]);
    setSelectedMacroId(macro.id);
    setNewMacroName('');
    onToast('Макрос создан', name, 'success');
  };

  const openStepModal = (position: StepInsertPosition) => {
    if (!selectedMacro) {
      onToast('Сначала создайте макрос', 'После этого можно добавлять действия.', 'warning');
      return;
    }
    setEditingStepIndex(null);
    setInsertPosition(position);
    setNewStep(emptyStep);
    setStepModalOpen(true);
  };

  const openEditStepModal = (stepIndex: number) => {
    const step = selectedMacro?.steps[stepIndex];
    if (!step) return;
    setEditingStepIndex(stepIndex);
    setNewStep({ type: step.type, value: step.value, description: step.description, delayMs: step.delayMs, paramName: step.paramName, outputParam: step.outputParam });
    setStepModalOpen(true);
  };

  const closeStepModal = () => {
    setStepModalOpen(false);
    setEditingStepIndex(null);
  };

  const saveStep = () => {
    if (!selectedMacro) return;
    if (newStep.type === 'setParameter' && !newStep.paramName?.trim()) {
      onToast('Введите имя параметра', 'Стартовое значение можно оставить пустым.', 'warning');
      return;
    }
    if (newStep.type === 'setParameter' && !parameterNamePattern.test(newStep.paramName?.trim() ?? '')) {
      onToast('Имя параметра должно быть латиницей', 'Например: clientReply или agent_answer.', 'warning');
      return;
    }
    if (newStep.type !== 'setParameter' && !newStep.value.trim()) {
      onToast('Заполните действие', 'Укажите клавишу, комбинацию, текст, координаты или задержку.', 'warning');
      return;
    }
    if (newStep.type === 'askAgent' && newStep.outputParam?.trim() && !parameterNamePattern.test(newStep.outputParam.trim())) {
      onToast('Имя параметра должно быть латиницей', 'Например: agentAnswer или client_reply.', 'warning');
      return;
    }

    const description = newStep.description.trim() || getAutoDescription(newStep);
    const step: MacroStep = {
      id: `step-${Date.now()}`,
      type: newStep.type,
      value: newStep.value.trim(),
      description,
      delayMs: newStep.delayMs,
      paramName: newStep.paramName?.trim() || undefined,
      outputParam: newStep.outputParam?.trim() || undefined,
    };

    if (editingStepIndex !== null) {
      setMacros((current) => current.map((macro) => {
        if (macro.id !== selectedMacro.id) return macro;
        return { ...macro, steps: macro.steps.map((item, index) => (index === editingStepIndex ? { ...step, id: item.id } : item)) };
      }));
      closeStepModal();
      onToast('Шаг обновлён', description, 'success');
      return;
    }

    const insertIndex = insertPosition === 'append' ? selectedMacro.steps.length : insertPosition === 'start' ? 0 : insertPosition + 1;
    setMacros((current) => current.map((macro) => {
      if (macro.id !== selectedMacro.id) return macro;
      const nextSteps = [...macro.steps];
      nextSteps.splice(insertIndex, 0, step);
      return { ...macro, steps: nextSteps };
    }));
    setNewStep({ ...emptyStep, type: newStep.type, value: getDefaultValueForType(newStep.type) });
    closeStepModal();
    onToast('Шаг добавлен', description, 'success');
  };

  const deleteStep = (stepIndex: number) => {
    if (!selectedMacro) return;
    stopTimer();
    setRunState('idle');
    setCurrentStepIndex(null);
    setCompletedStepIds([]);
    const deletedStep = selectedMacro.steps[stepIndex];
    setMacros((current) => current.map((macro) => (macro.id === selectedMacro.id ? { ...macro, steps: macro.steps.filter((_, index) => index !== stepIndex) } : macro)));
    onToast('Шаг удалён', deletedStep.description, 'success');
  };

  const deleteSelectedMacro = () => {
    if (!selectedMacro) return;
    stopTimer();
    const deletedId = selectedMacro.id;
    const deletedName = selectedMacro.name;
    const remaining = macros.filter((macro) => macro.id !== deletedId);
    setMacros(remaining);
    setSelectedMacroId(remaining[0]?.id ?? '');
    setRunState('idle');
    setCurrentStepIndex(null);
    setCompletedStepIds([]);
    setStepModalOpen(false);
    onToast('Макрос удалён', deletedName, 'success');
  };

  const reorderSteps = (fromIndex: number, toIndex: number) => {
    if (!selectedMacro || fromIndex === toIndex || runState === 'running') return;
    setMacros((current) => current.map((macro) => {
      if (macro.id !== selectedMacro.id) return macro;
      const nextSteps = [...macro.steps];
      const [moved] = nextSteps.splice(fromIndex, 1);
      nextSteps.splice(toIndex, 0, moved);
      return { ...macro, steps: nextSteps };
    }));
    setDraggingStepIndex(null);
    setCurrentStepIndex(null);
  };

  const runMacro = () => {
    if (!validateRun()) return;

    stopTimer();
    setRunState('running');
    setCompletedStepIds([]);
    runStepSequence(selectedMacro!.id, 0);
    onToast('Макрос запущен', selectedMacro!.name, 'info');
  };

  const runSingleStep = (stepIndex: number) => {
    if (!validateRun()) return;

    stopTimer();
    setRunState('running');
    setCurrentStepIndex(stepIndex);
    setCompletedStepIds([]);
    const step = selectedMacro!.steps[stepIndex];
    executeStepEffect(step);
    timerRef.current = window.setTimeout(() => {
      markRunTime(selectedMacro!.id);
      setRunState('completed');
      setCurrentStepIndex(null);
      setCompletedStepIds([step.id]);
    }, getStepDuration(step));
  };

  const stopMacro = () => {
    stopTimer();
    setRunState('stopped');
    setCompletedStepIds([]);
    onToast('Выполнение остановлено', currentStep ? currentStep.description : selectedMacro?.name, 'warning');
  };

  if (!selectedMacro) {
    return (
      <PageShell title="Макросы">
        <Card className="mx-auto max-w-xl p-6 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><ListPlus className="h-6 w-6" /></div>
          <h2 className="text-xl font-semibold text-slate-950">Макросов пока нет</h2>
          <p className="mt-2 text-sm text-slate-500">Создайте новый макрос, чтобы добавлять действия и отлаживать выполнение на OBD.</p>
          <div className="mt-5 flex gap-2">
            <Input value={newMacroName} onChange={(event) => setNewMacroName(event.target.value)} placeholder="Название макроса" />
            <Button variant="primary" onClick={createMacro}><Plus className="h-4 w-4" /> Создать</Button>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title="Макросы" action={(
      <div className="flex gap-2">
        <Button variant="primary" onClick={runMacro} disabled={!selectedMacro || selectedMacro.steps.length === 0 || runState === 'running'}><Play className="h-4 w-4" /> Запустить макрос</Button>
        <Button variant="danger" onClick={stopMacro} disabled={runState !== 'running'}><Square className="h-4 w-4" /> Остановить</Button>
      </div>
    )}>
      <div className="grid min-w-0 gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><ListPlus className="h-5 w-5" /></span>
              <div>
                <h2 className="font-semibold text-slate-950">Новый макрос</h2>
                <p className="text-sm text-slate-500">Создайте свою последовательность действий.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input value={newMacroName} onChange={(event) => setNewMacroName(event.target.value)} placeholder="Название макроса" />
              <Button variant="outline" onClick={createMacro}><Plus className="h-4 w-4" /> Создать</Button>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950">Библиотека макросов</div>
            <div className="divide-y divide-slate-100">
              {macros.map((macro) => {
                const active = macro.id === selectedMacro?.id;
                return (
                  <button
                    key={macro.id}
                    className={`w-full px-4 py-3 text-left transition ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    onClick={() => setSelectedMacroId(macro.id)}
                  >
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <span className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-slate-950'}`}>{macro.name}</span>
                      <Badge variant={macro.steps.length > 0 ? 'blue' : 'slate'}>{macro.steps.length} шагов</Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-500">{macro.description}</p>
                    {macro.lastRun ? <div className="mt-2 text-xs text-slate-400">Последний запуск: {macro.lastRun}</div> : null}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600"><Keyboard className="h-4 w-4" /> Последовательность для ESP32 HID</div>
                <h2 className="text-xl font-semibold text-slate-950">{selectedMacro.name}</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">{selectedMacro.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={runState === 'running' ? 'blue' : runState === 'stopped' ? 'yellow' : runState === 'completed' ? 'green' : 'slate'}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {runState === 'running' ? 'Выполняется' : runState === 'stopped' ? 'Остановлен' : runState === 'completed' ? 'Выполнен' : 'Готов к отладке'}
                </Badge>
                <Button size="sm" variant="danger" onClick={deleteSelectedMacro} disabled={runState === 'running'}><Trash2 className="h-4 w-4" /> Удалить макрос</Button>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Параметры макроса</div>
                  <p className="mt-1 text-sm text-slate-500">Используйте их в шаблонах как {`{{parameterName}}`}.</p>
                </div>
              </div>
              <div className="mb-4 grid gap-3 md:grid-cols-2">
                {Object.entries(macroParameters).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="truncate rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{`{{${key}}}`}</span>
                      <Button size="sm" variant="danger" onClick={() => deleteParameter(key)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <Input value={value} onChange={(event) => updateParameterValue(key, event.target.value)} className="h-9" />
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-3">
                <div className="mb-2 text-sm font-semibold text-slate-950">Создать параметр</div>
                <div className="grid gap-2 md:grid-cols-[220px_1fr_auto]">
                  <Input value={newParamName} onChange={(event) => setNewParamName(event.target.value)} placeholder="Имя параметра" />
                  <Input value={newParamValue} onChange={(event) => setNewParamValue(event.target.value)} placeholder="Стартовое значение" />
                  <Button variant="outline" onClick={createParameter}><Plus className="h-4 w-4" /> Создать</Button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[56px_150px_1fr_330px] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>№</span><span>Тип</span><span>Действие</span><span>Действия</span>
              </div>
              {selectedMacro.steps.length > 0 ? (
                <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
                  <Button size="sm" variant="ghost" onClick={() => openStepModal('start')} disabled={runState === 'running'}><Plus className="h-4 w-4" /> Добавить в начало</Button>
                </div>
              ) : null}
              {selectedMacro.steps.length > 0 ? selectedMacro.steps.map((step, index) => {
                const Icon = stepIcons[step.type];
                const active = runState === 'running' && currentStepIndex === index;
                const completed = completedStepIds.includes(step.id);
                return (
                  <div
                    key={step.id}
                    draggable={runState !== 'running'}
                    onDragStart={() => setDraggingStepIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => draggingStepIndex !== null && reorderSteps(draggingStepIndex, index)}
                    onDragEnd={() => setDraggingStepIndex(null)}
                    className={`grid grid-cols-[56px_150px_1fr_330px] items-center border-t border-slate-100 px-4 py-3 text-sm transition ${active ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : completed ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-100' : ''} ${draggingStepIndex === index ? 'opacity-50' : ''}`}
                  >
                    <span className="flex items-center gap-2 font-semibold text-slate-500"><GripVertical className="h-4 w-4 cursor-grab text-slate-400" /> {index + 1}</span>
                    <span className="flex items-center gap-2 text-slate-600"><Icon className={`h-4 w-4 ${completed ? 'text-emerald-600' : 'text-blue-600'}`} /> {stepLabels[step.type]}</span>
                    <div>
                      <div className="flex items-center gap-2 font-medium text-slate-950">
                        {step.description}
                        {active ? <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">выполняется</span> : null}
                        {completed ? <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">выполнено</span> : null}
                      </div>
                      <div className="text-xs text-slate-500">Значение: {getStepValue(step)} · задержка после шага: {step.delayMs ?? 0} мс{step.outputParam ? ` · ответ → {{${step.outputParam}}}` : ''}</div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => runSingleStep(index)} disabled={runState === 'running'}><Play className="h-4 w-4" /> Шаг</Button>
                      <Button size="sm" variant="secondary" onClick={() => openEditStepModal(index)} disabled={runState === 'running'}><Pencil className="h-4 w-4" /> Ред.</Button>
                      <Button size="sm" variant="ghost" onClick={() => openStepModal(index)} disabled={runState === 'running'}><Plus className="h-4 w-4" /> Ниже</Button>
                      <Button size="sm" variant="danger" onClick={() => deleteStep(index)} disabled={runState === 'running'}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                );
              }) : (
                <div className="border-t border-slate-100 px-4 py-8 text-center text-sm text-slate-500">
                  <div className="mb-3">Добавьте первый шаг макроса.</div>
                  <Button variant="outline" onClick={() => openStepModal('append')}><Plus className="h-4 w-4" /> Добавить действие</Button>
                </div>
              )}
              {selectedMacro.steps.length > 0 ? (
                <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-center">
                  <Button variant="outline" onClick={() => openStepModal('append')} disabled={runState === 'running'}><Plus className="h-4 w-4" /> Добавить действие</Button>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
      {stepModalOpen ? (
        <StepModal
          step={newStep}
          title={editingStepIndex !== null ? `Редактировать шаг ${editingStepIndex + 1}` : insertPosition === 'append' ? 'Добавить действие в конец' : insertPosition === 'start' ? 'Добавить действие в начало' : `Добавить действие после шага ${insertPosition + 1}`}
          saveLabel={editingStepIndex !== null ? 'Сохранить изменения' : 'Добавить шаг'}
          getAutoDescription={getAutoDescription}
          getDefaultValueForType={getDefaultValueForType}
          onChange={setNewStep}
          onClose={closeStepModal}
          onSave={saveStep}
        />
      ) : null}
    </PageShell>
  );
}

function StepModal({ step, title, saveLabel, getAutoDescription, getDefaultValueForType, onChange, onClose, onSave }: {
  step: Omit<MacroStep, 'id'>;
  title: string;
  saveLabel: string;
  getAutoDescription: (step: Omit<MacroStep, 'id'>) => string;
  getDefaultValueForType: (type: MacroStepType) => string;
  onChange: (step: Omit<MacroStep, 'id'>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/25 p-6 backdrop-blur-sm" onMouseDown={onClose}>
      <Card className="case-scrollbar max-h-[calc(100vh-48px)] w-full max-w-5xl overflow-y-auto p-5" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-blue-600"><ListPlus className="h-4 w-4" /> Шаг макроса</div>
            <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Закрыть"><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(stepLabels) as MacroStepType[]).map((type) => {
            const Icon = stepIcons[type];
            const active = step.type === type;
            return (
              <button
                key={type}
                className={`rounded-2xl border p-3 text-left transition ${active ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                onClick={() => onChange({ ...step, type, value: getDefaultValueForType(type), description: '' })}
              >
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4" /> {stepLabels[type]}</div>
                <div className="text-xs leading-4 text-slate-500">{stepDescriptions[type]}</div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(220px,280px)_160px_1fr]">
            <label>
              <span className="mb-1 block text-xs font-semibold text-slate-500">Тип действия</span>
              <Select value={step.type} onChange={(event) => {
                const type = event.target.value as MacroStepType;
                onChange({ ...step, type, value: getDefaultValueForType(type), description: '' });
              }}>
                <option value="key">Нажать клавишу</option>
                <option value="hotkey">Нажать комбинацию клавиш</option>
                <option value="typeText">Напечатать текст</option>
                <option value="moveMouse">Переместить мышку</option>
                <option value="clickAbsolute">Кликнуть по абсолютным координатам</option>
                <option value="delay">Задержка</option>
                <option value="setParameter">Установить параметр</option>
                <option value="askAgent">Спросить у агента</option>
              </Select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-slate-500">Пауза после, мс</span>
              <Input type="number" min="0" step="100" value={step.delayMs ?? 0} onChange={(event) => onChange({ ...step, delayMs: Number(event.target.value) })} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-slate-500">Описание</span>
              <Textarea rows={2} value={step.description} onChange={(event) => onChange({ ...step, description: event.target.value })} placeholder={getAutoDescription(step)} />
            </label>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-950">Параметры действия</div>
                <div className="text-xs text-slate-500">Заполните значение, координаты, текст или шаблон сообщения.</div>
              </div>
              <Badge variant="blue">{stepLabels[step.type]}</Badge>
            </div>

            {step.type === 'hotkey' ? (
              <label className="block max-w-sm">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Комбинация клавиш</span>
                <Select value={step.value} onChange={(event) => onChange({ ...step, value: event.target.value })}>
                  {hotkeyOptions.map((option) => <option key={option}>{option}</option>)}
                </Select>
              </label>
            ) : step.type === 'key' ? (
              <label className="block max-w-sm">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Клавиша</span>
                <Select value={step.value} onChange={(event) => onChange({ ...step, value: event.target.value })}>
                  {keyOptions.map((option) => <option key={option}>{option}</option>)}
                </Select>
              </label>
            ) : step.type === 'setParameter' ? (
              <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Имя параметра</span>
                  <Input value={step.paramName ?? ''} onChange={(event) => onChange({ ...step, paramName: event.target.value })} placeholder="Имя параметра" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Стартовое значение</span>
                  <Textarea rows={6} value={step.value} onChange={(event) => onChange({ ...step, value: event.target.value })} placeholder="Стартовое значение (необязательно)" />
                </label>
              </div>
            ) : step.type === 'typeText' || step.type === 'askAgent' ? (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">{step.type === 'askAgent' ? 'Шаблон сообщения агенту' : 'Текст для печати'}</span>
                <Textarea rows={8} value={step.value} onChange={(event) => onChange({ ...step, value: event.target.value })} placeholder={step.type === 'askAgent' ? 'Шаблон сообщения с {{parameterName}}' : 'Текст для посимвольной печати'} />
              </label>
            ) : (
              <label className="block max-w-sm">
                <span className="mb-1 block text-xs font-semibold text-slate-500">{step.type === 'delay' ? 'Задержка, мс' : 'Значение'}</span>
                <Input type={step.type === 'delay' ? 'number' : 'text'} min="0" value={step.value} onChange={(event) => onChange({ ...step, value: event.target.value })} placeholder={step.type === 'moveMouse' || step.type === 'clickAbsolute' ? 'x,y' : step.type === 'delay' ? '1000' : 'Текст или параметр'} />
              </label>
            )}
          </div>
        </div>

        {step.type === 'askAgent' ? (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <label className="block max-w-sm">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Сохранить ответ агента в параметр</span>
              <Input value={step.outputParam ?? ''} onChange={(event) => onChange({ ...step, outputParam: event.target.value })} placeholder="agentAnswer" />
            </label>
            <p className="mt-2 text-xs text-slate-500">В шаблоне используйте параметры в формате {`{{parameterName}}`}. Сохранённый ответ можно подставить в других действиях, например в печати текста.</p>
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={onSave}><Save className="h-4 w-4" /> {saveLabel}</Button>
        </div>
      </Card>
    </div>
  );
}
