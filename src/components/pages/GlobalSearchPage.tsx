import { Search } from 'lucide-react';

import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { PageShell } from './CasesPage';

const results = [
  ['Кейс', 'CASE-024 Заполнить форму', 'Нужно заполнить комментарий для клиента в CRM.'],
  ['Telegram', 'Сообщение от Петра', 'Проверьте и подтвердите данные перед отправкой.'],
  ['OCR', '“Введите комментарий для клиента...”', 'Распознано на выделенной области OBD.'],
  ['Память', 'Официальный стиль для ТехноЛюкс', 'Для клиента ТехноЛюкс использовать краткие формулировки без внутренних деталей.'],
];

export function GlobalSearchPage() {
  return (
    <PageShell title="Глобальный поиск">
      <Card className="p-5">
        <div className="relative">
          <Input placeholder="Искать по кейсам, чатам, Telegram, OCR, памяти и OBD..." className="h-12 pl-11 text-base" />
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Кейсы', 'Чаты', 'Telegram', 'OCR', 'Память', 'OBD'].map((filter) => <button key={filter} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">{filter}</button>)}
        </div>
      </Card>
      <div className="mt-5 grid gap-3">
        {results.map(([type, title, text]) => <Card key={title} className="p-4"><div className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">{type}</div><div className="font-semibold text-slate-950">{title}</div><p className="mt-1 text-sm text-slate-500">{text}</p></Card>)}
      </div>
    </PageShell>
  );
}
