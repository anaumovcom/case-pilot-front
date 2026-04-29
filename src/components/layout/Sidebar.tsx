import { MoreVertical, Plus, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

import type { AppSection, CaseItem, CaseStatus } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';


const filterItems: Array<'Все' | Extract<CaseStatus, 'В работе' | 'Ждёт ответа'>> = ['Все', 'В работе', 'Ждёт ответа'];

const dotColor: Record<CaseStatus, string> = {
  Новый: 'bg-blue-500',
  'В работе': 'bg-blue-600',
  'Ждёт ответа': 'bg-amber-500',
  'Нужен анализ': 'bg-red-500',
  'Есть решение': 'bg-emerald-500',
  Закрыт: 'bg-slate-400',
  Отложен: 'bg-slate-400',
};

type Props = {
  activeSection: AppSection;
  cases: CaseItem[];
  selectedCaseId: string;
  searchQuery: string;
  filter: 'Все' | 'В работе' | 'Ждёт ответа';
  onSectionChange: (section: AppSection) => void;
  onCaseSelect: (caseId: string) => void;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: 'Все' | 'В работе' | 'Ждёт ответа') => void;
  onCreateCase: () => void;
};

export function Sidebar({ activeSection, cases, selectedCaseId, searchQuery, filter, onSectionChange, onCaseSelect, onSearchChange, onFilterChange, onCreateCase }: Props) {
  const panelRef = useRef<HTMLElement | null>(null);
  const [width, setWidth] = useState(() => Number(window.localStorage.getItem('casepilot.sidebar.width')) || 288);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.width = `${width}px`;
    }
  }, [width]);

  const startResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    const resize = (moveEvent: MouseEvent) => {
      const nextWidth = Math.min(420, Math.max(240, startWidth + moveEvent.clientX - startX));
      setWidth(nextWidth);
      window.localStorage.setItem('casepilot.sidebar.width', String(nextWidth));
    };

    const stopResize = () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    };

    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
  };

  return (
    <aside ref={panelRef} className="relative flex h-full shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-4">
      <div className="flex min-h-0 flex-1 flex-col">
        <h2 className="mb-3 px-1 text-sm font-semibold text-slate-950">Кейсы</h2>
        <div className="relative mb-3">
          <Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Поиск кейса..." className="pr-9" />
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {filterItems.map((item) => (
            <button
              key={item}
              onClick={() => onFilterChange(item)}
              className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${filter === item ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="case-scrollbar -mx-1 min-h-0 flex-1 space-y-1 overflow-y-auto px-1">
          {cases.map((item) => {
            const selected = item.id === selectedCaseId;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onCaseSelect(item.id);
                  onSectionChange('home');
                }}
                className={`group flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${selected ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm' : 'border-transparent text-slate-700 hover:bg-slate-50'}`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor[item.status]}`} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.publicId} {item.title}</span>
                <MoreVertical className="h-4 w-4 shrink-0 text-slate-400 opacity-80 group-hover:text-slate-600" />
              </button>
            );
          })}
        </div>
        <Button variant="primary" className="mt-4 w-full" onClick={onCreateCase}>
          <Plus className="h-4 w-4" /> Новый кейс
        </Button>
      </div>
      <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent transition hover:bg-blue-200" onMouseDown={startResize} />
    </aside>
  );
}
