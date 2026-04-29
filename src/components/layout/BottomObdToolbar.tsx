import { Bot, Camera, Expand, Keyboard, Maximize2, MousePointer2, ScanLine, SquareMousePointer, StopCircle, Type, Volume2 } from 'lucide-react';

import type { IntegrationStatus, ObdStatus } from '../../services';
import { Button } from '../ui/Button';

type Props = {
  executionLog: string[];
  regionVisible: boolean;
  onToggleRegion: () => void;
  onOpenTask: () => void;
  onExecuteEsp: () => void;
  onStop: () => void;
  onToast: (title: string, description?: string) => void;
  integrations: IntegrationStatus[];
  obdStatus: ObdStatus | null;
};

function isOnline(status?: string | null) {
  return status === 'online' || status === 'ready' || status === 'postgres';
}

export function BottomObdToolbar({ executionLog, regionVisible, onToggleRegion, onOpenTask, onExecuteEsp, onStop, onToast, integrations, obdStatus }: Props) {
  const esp32 = integrations.find((item) => item.id === 'esp32');
  const esp32Online = isOnline(esp32?.status);
  const obdOnline = isOnline(obdStatus?.status);

  return (
    <div className="relative z-10 mt-3 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={regionVisible ? 'outline' : 'secondary'} size="sm" onClick={onToggleRegion}>
          <SquareMousePointer className="h-4 w-4" /> Выделить область
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onToast('OCR выполнен', 'Распознано: Введите комментарий для клиента...')}>
          <ScanLine className="h-4 w-4" /> OCR
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onToast('Скриншот сохранён', 'Кадр добавлен в материалы кейса')}>
          <Camera className="h-4 w-4" /> Скриншот
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenTask}>
          <Bot className="h-4 w-4" /> Спросить агента
        </Button>
        <Button variant="outline" size="sm" onClick={onExecuteEsp}>
          <Type className="h-4 w-4" /> Вставить через ESP32
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onToast('Клавиатура открыта', 'Готово к отправке сочетаний клавиш')}>
          <Keyboard className="h-4 w-4" /> Клавиатура
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onToast('Режим мыши включён', 'Управление через ESP32 ожидает подтверждения')}>
          <MousePointer2 className="h-4 w-4" /> Мышь
        </Button>
        <Button variant="danger" size="sm" onClick={onStop}>
          <StopCircle className="h-4 w-4" /> Стоп управление
        </Button>

        <div className="ml-auto flex items-center gap-5 text-sm text-slate-600">
          <span className="hidden max-w-[260px] truncate rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 xl:inline">Лог: {executionLog[0] ?? 'ожидает действий'}</span>
          <span className="inline-flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${esp32Online ? 'bg-emerald-500' : 'bg-red-500'}`} /> ESP32: {esp32Online ? 'подключено' : 'нет связи'}</span>
          <span className="inline-flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${obdOnline ? 'bg-emerald-500' : 'bg-red-500'}`} /> OBD: {obdOnline ? `${Math.round(obdStatus?.fps ?? 0)} FPS` : 'нет связи'}</span>
          <div className="hidden items-center gap-3 lg:flex">
            <Volume2 className="h-4 w-4 text-slate-500" />
            <span className="text-lg leading-none text-slate-500">−</span>
            <div className="h-1 w-24 rounded-full bg-slate-200"><div className="h-1 w-14 rounded-full bg-blue-600" /></div>
            <span className="text-lg leading-none text-slate-500">+</span>
            <span className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">100%</span>
            <Expand className="h-4 w-4 text-slate-500" />
            <Maximize2 className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
