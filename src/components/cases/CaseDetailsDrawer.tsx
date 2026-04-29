import { FileText, History, MessageSquare, Save, Tag } from 'lucide-react';
import { useState } from 'react';

import type { CaseItem } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Drawer } from '../ui/Drawer';
import { Textarea } from '../ui/Input';
import { CaseStatusBadge } from './CaseStatusBadge';

type Props = {
  open: boolean;
  selectedCase: CaseItem;
  onClose: () => void;
  onSaved: () => void;
};

export function CaseDetailsDrawer({ open, selectedCase, onClose, onSaved }: Props) {
  const [description, setDescription] = useState('Нужно заполнить комментарий для клиента в CRM на основе контекста переписки и данных кейса. Важно использовать нейтральный официальный стиль и не раскрывать внутренние детали обработки заявки.');

  return (
    <Drawer open={open} onClose={onClose} title="Детали кейса" widthClass="max-w-2xl">
      <div className="space-y-5">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-600">{selectedCase.publicId}</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-950">{selectedCase.title}</h3>
            </div>
            <CaseStatusBadge status={selectedCase.status} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="slate">Приоритет: {selectedCase.priority}</Badge>
            {selectedCase.tags.map((tag) => (
              <Badge key={tag} variant="blue">
                <Tag className="mr-1 h-3 w-3" /> {tag}
              </Badge>
            ))}
          </div>
        </div>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
            <FileText className="h-4 w-4 text-blue-600" /> Описание
          </div>
          <Textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} />
          <div className="mt-3 flex gap-2">
            <Button variant="primary" size="sm" onClick={onSaved}>
              <Save className="h-4 w-4" /> Сохранить
            </Button>
            <Button size="sm" onClick={() => setDescription(selectedCase.summary)}>
              Отмена
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h4 className="mb-3 font-semibold text-slate-950">Выжимка</h4>
          <p className="text-sm leading-6 text-slate-600">Клиент просит подтвердить данные по заявке. Нужно аккуратно сформулировать комментарий без лишних деталей, проверить корректность текста в поле CRM и сохранить результат в ленту кейса.</p>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2 font-semibold text-slate-950">
            <History className="h-4 w-4 text-blue-600" /> Хронология
          </div>
          <div className="space-y-3 text-sm">
            {[
              ['11:20', 'Создан кейс'],
              ['11:24', 'Прикреплены Telegram-сообщения'],
              ['11:31', 'Выделена область OBD'],
              ['11:32', 'Агент предложил текст для вставки'],
              ['11:33', 'Действие выполнено через ESP32'],
            ].map(([time, text]) => (
              <div key={time + text} className="flex gap-3">
                <span className="w-12 shrink-0 text-slate-400">{time}</span>
                <span className="text-slate-700">{text}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-950">
            <MessageSquare className="h-4 w-4 text-blue-600" /> Материалы
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {['OBD-скриншот', 'OCR области', 'Telegram-сообщения'].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">{item}</div>
            ))}
          </div>
        </Card>
      </div>
    </Drawer>
  );
}
