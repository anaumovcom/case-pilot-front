import { Activity, Bot, Briefcase, Database, FileText, Info, Keyboard, MessageSquarePlus, Monitor, Puzzle, Search, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

import { formatAppVersion, subscribeAppVersion } from '../../config/version';
import type { IntegrationStatus, ObdStatus } from '../../services';
import type { AppSection, NavItem } from '../../types';
import { Button } from '../ui/Button';

const navItems: NavItem[] = [
  { id: 'home', label: 'Главная / OBD', icon: Monitor },
  { id: 'cases', label: 'Кейсы', icon: Briefcase },
  { id: 'search', label: 'Глобальный поиск', icon: Search },
  { id: 'telegram', label: 'Telegram', icon: Send },
  { id: 'memory', label: 'Память', icon: Database },
  { id: 'macros', label: 'Макросы', icon: Keyboard },
  { id: 'integrations', label: 'Интеграции', icon: Puzzle },
  { id: 'diagnostics', label: 'Диагностика', icon: Activity },
];

type Props = {
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  onOpenDetails: () => void;
  onOpenSummary: () => void;
  onNewChat: () => void;
  integrations: IntegrationStatus[];
  obdStatus: ObdStatus | null;
};

function statusLabel(status?: string | null) {
  return status === 'online' || status === 'ready' || status === 'postgres' ? 'подключено' : 'нет связи';
}

function statusDot(status?: string | null) {
  return status === 'online' || status === 'ready' || status === 'postgres' ? 'bg-emerald-500' : 'bg-red-500';
}

export function TopBar({ activeSection, onSectionChange, onOpenDetails, onOpenSummary, onNewChat, integrations, obdStatus }: Props) {
  const esp32 = integrations.find((item) => item.id === 'esp32');
  const esp32Status = esp32?.status;
  const obd = obdStatus?.status;
  const [appVersion, setAppVersion] = useState(() => formatAppVersion());

  useEffect(() => subscribeAppVersion(() => setAppVersion(formatAppVersion())), []);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex w-60 shrink-0 items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-xl font-bold tracking-tight text-slate-950">CasePilot</span>
          <span className="text-xs font-medium text-slate-400">{appVersion}</span>
        </div>
      </div>

      <nav className="case-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm transition ${active ? 'border-blue-200 bg-blue-50 font-medium text-blue-700' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 xl:flex">
          <span className="inline-flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${statusDot(esp32Status)}`} /> ESP32: {statusLabel(esp32Status)}</span>
          <span className="h-4 w-px bg-slate-200" />
          <span className="inline-flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${statusDot(obd)}`} /> OBD: {obd === 'online' ? 'онлайн' : 'нет связи'}</span>
        </div>
        <Button variant="secondary" size="sm" onClick={onOpenDetails}>
          <Info className="h-4 w-4" /> Детали кейса
        </Button>
        <Button variant="outline" size="sm" onClick={onNewChat}>
          <MessageSquarePlus className="h-4 w-4" /> Новый чат
        </Button>
        <Button variant="secondary" size="sm" onClick={onOpenSummary}>
          <FileText className="h-4 w-4" /> Выжимка
        </Button>
        <div className="relative ml-2 h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-amber-200 to-slate-300 shadow-sm">
          <div className="absolute inset-x-0 bottom-0 h-5 bg-slate-700/20" />
          <div className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 rounded-full bg-amber-800" />
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        </div>
      </div>
    </header>
  );
}
