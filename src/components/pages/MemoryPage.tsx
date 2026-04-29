import { CheckCircle2, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PageShell } from './CasesPage';

const facts = [
  ['Память кейса', 'Клиент просит подтвердить данные по заявке CASE-024.', 'CASE-024'],
  ['Общая память', 'Для ТехноЛюкс использовать официальный стиль без внутренних деталей.', 'ТехноЛюкс'],
  ['Факт', 'OCR области распознал поле комментария для клиента.', 'OBD'],
];

export function MemoryPage() {
  return (
    <PageShell title="Память">
      <div className="mb-4 flex gap-2">
        {['Память кейса', 'Общая память', 'Факты'].map((tab) => <button key={tab} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 first:border-blue-200 first:bg-blue-50 first:text-blue-700 hover:bg-slate-50">{tab}</button>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {facts.map(([type, text, source]) => (
          <Card key={text} className="p-5">
            <Badge variant="blue">{type}</Badge>
            <p className="mt-4 text-sm leading-6 text-slate-700">{text}</p>
            <div className="mt-3 text-xs text-slate-500">Источник: {source}</div>
            <div className="mt-5 flex gap-2"><Button size="sm"><Pencil className="h-4 w-4" /> Изменить</Button><Button size="sm"><Trash2 className="h-4 w-4" /> Удалить</Button><Button size="sm" variant="outline"><CheckCircle2 className="h-4 w-4" /> Подтвердить</Button></div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
