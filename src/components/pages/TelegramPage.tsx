import { Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { CaseItem } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { PageShell } from './CasesPage';

const messages = [
  { id: 'tg-1', author: 'Петр Петров', chat: 'ТехноЛюкс / интеграция', date: '20.05.2024 11:24', text: 'Нужно подтвердить данные по заявке и написать клиенту аккуратный комментарий.', probabilities: [92, 76, 61] },
  { id: 'tg-2', author: 'Анна Смирнова', chat: 'Поддержка CRM', date: '20.05.2024 11:19', text: 'Перед сохранением формы проверьте, что комментарий не содержит внутренних технических деталей.', probabilities: [88, 69, 58] },
  { id: 'tg-3', author: 'Иванов И. И.', chat: 'Операторы OBD', date: '20.05.2024 11:18', text: 'Экран открыт, поле комментария готово к заполнению.', probabilities: [84, 72, 55] },
];

type Props = {
  cases: CaseItem[];
  onCreateCase: () => void;
  onToast: (title: string, description?: string) => void;
};

export function TelegramPage({ cases, onCreateCase, onToast }: Props) {
  const [modalMessageId, setModalMessageId] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState(cases[0]?.id ?? '');
  const [caseSearch, setCaseSearch] = useState('');

  const modalMessage = messages.find((message) => message.id === modalMessageId);
  const visibleCases = useMemo(() => cases.filter((item) => `${item.publicId} ${item.title}`.toLowerCase().includes(caseSearch.toLowerCase())), [caseSearch, cases]);

  const attachMessage = (messageId: string, caseId: string) => {
    const message = messages.find((item) => item.id === messageId);
    const targetCase = cases.find((item) => item.id === caseId);
    onToast('Telegram-сообщение прикреплено', `${message?.author ?? 'Сообщение'} → ${targetCase?.publicId ?? caseId}`);
    setModalMessageId(null);
  };

  return (
    <>
      <PageShell title="Telegram">
        <div className="grid gap-4 lg:grid-cols-3">
          {messages.map((message) => {
            const suggestedCases = cases.slice(0, 3);
            return (
              <Card key={message.id} className="p-5">
                <div className="text-sm font-semibold text-slate-950">{message.author}</div>
                <div className="mt-1 text-xs text-slate-500">{message.chat} · {message.date}</div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{message.text}</p>

                <div className="mt-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Вероятные кейсы</div>
                  <div className="space-y-2">
                    {suggestedCases.map((item, index) => (
                      <button
                        key={`${message.id}-${item.id}`}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm transition hover:border-blue-200 hover:bg-blue-50"
                        onClick={() => attachMessage(message.id, item.id)}
                      >
                        <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{item.publicId} {item.title}</span>
                        <span className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{message.probabilities[index]}%</span>
                      </button>
                    ))}
                    <button
                      className="flex w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => {
                        setSelectedCaseId(cases[0]?.id ?? '');
                        setCaseSearch('');
                        setModalMessageId(message.id);
                      }}
                    >
                      Другой кейс
                    </button>
                  </div>
                </div>

                <Button className="mt-4 w-full" size="sm" onClick={onCreateCase}>
                  <Plus className="h-4 w-4" /> Создать кейс
                </Button>
              </Card>
            );
          })}
        </div>
      </PageShell>

      {modalMessage ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/25 p-6 backdrop-blur-sm" onMouseDown={() => setModalMessageId(null)}>
          <Card className="w-full max-w-2xl p-6" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Выбрать кейс</h2>
                <p className="mt-1 text-sm text-slate-500">Прикрепление сообщения от {modalMessage.author}</p>
              </div>
              <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => setModalMessageId(null)} aria-label="Закрыть выбор кейса">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Input className="mb-4" value={caseSearch} onChange={(event) => setCaseSearch(event.target.value)} placeholder="Найти кейс..." />
            <div className="case-scrollbar max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {visibleCases.map((item) => (
                <button
                  key={item.id}
                  className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${selectedCaseId === item.id ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  onClick={() => setSelectedCaseId(item.id)}
                >
                  <span>
                    <span className="block font-semibold text-slate-950">{item.publicId} {item.title}</span>
                    <span className="mt-1 block text-sm text-slate-500">{item.summary}</span>
                  </span>
                  <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{item.status}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setModalMessageId(null)}>Отмена</Button>
              <Button variant="primary" onClick={() => attachMessage(modalMessage.id, selectedCaseId)} disabled={!selectedCaseId}>Прикрепить</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
