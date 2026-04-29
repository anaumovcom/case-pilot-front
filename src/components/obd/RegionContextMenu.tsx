import { Bot, Camera, ClipboardList, ScanText } from 'lucide-react';

type Props = {
  onOpenTask: () => void;
  onToast: (title: string, description?: string) => void;
};

export function RegionContextMenu({ onOpenTask, onToast }: Props) {
  const items = [
    { label: 'Спросить агента', icon: Bot, action: onOpenTask },
    { label: 'OCR', icon: ScanText, action: () => onToast('OCR выполнен', 'Распознано: Введите комментарий для клиента...') },
    { label: 'Скриншот', icon: Camera, action: () => onToast('Скриншот области сохранён', 'Выделенная область добавлена в материалы кейса') },
    { label: 'Создать задачу', icon: ClipboardList, action: onOpenTask },
  ];

  return (
    <div className="absolute left-[31%] top-[56%] z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.label} onClick={item.action} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50">
            <Icon className="h-3.5 w-3.5 text-slate-500" /> {item.label}
          </button>
        );
      })}
    </div>
  );
}
