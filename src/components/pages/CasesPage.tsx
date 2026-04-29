import { ChevronDown, Link2, Plus, Send } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import type { CaseItem, ChatMessage as ChatMessageType } from '../../types';
import { AgentChatPanel } from '../chat/AgentChatPanel';
import { CaseStatusBadge } from '../cases/CaseStatusBadge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type Props = {
  cases: CaseItem[];
  onCreateCase: () => void;
  onCloseCase: (caseId: string) => void;
  messages: ChatMessageType[];
  onSendText: (text: string) => void;
  onExecuteAction: (cardId: string) => void;
  onUpdateAttachmentComment: (attachmentId: string, comment: string) => void;
  onToast: (title: string, description?: string) => void;
};

const activitySuggestions = [
  { type: 'Telegram', title: 'Сообщение от Петра Петрова', text: 'Нужно подтвердить данные по заявке и написать клиенту аккуратный комментарий.', probability: 94 },
  { type: 'Telegram', title: 'Сообщение из чата “Поддержка CRM”', text: 'Перед сохранением формы проверьте, что комментарий не содержит внутренних деталей.', probability: 87 },
  { type: 'OCR', title: 'OCR области OBD', text: 'Введите комментарий для клиента...', probability: 82 },
  { type: 'OBD', title: 'Скриншот поля комментария', text: 'Выделена область поля “Комментарий для клиента”.', probability: 76 },
];

export function CasesPage({ cases, onCreateCase, onCloseCase, messages, onSendText, onExecuteAction, onUpdateAttachmentComment, onToast }: Props) {
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>('CASE-024');

  return (
    <PageShell title="Кейсы" action={<Button variant="primary" onClick={onCreateCase}><Plus className="h-4 w-4" /> Новый кейс</Button>}>
      <div className="flex min-w-0 gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap gap-2">
            {['Все', 'В работе', 'Ждёт ответа', 'Нужен анализ', 'Закрытые'].map((item) => <button key={item} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">{item}</button>)}
          </div>
          <Card className="overflow-hidden">
            <div className="case-scrollbar overflow-x-auto">
              <div className="min-w-[820px]">
                <div className="grid grid-cols-[1.7fr_130px_110px_105px_70px_95px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Кейс</span><span>Статус</span><span>Приоритет</span><span>Обновлён</span><span>Чатов</span><span>Материалов</span>
                </div>
                {cases.map((item) => {
                  const expanded = expandedCaseId === item.id;
                  return (
                    <div key={item.id} className="border-b border-slate-100 last:border-0">
                      <button
                        className={`grid w-full grid-cols-[1.7fr_130px_110px_105px_70px_95px] items-center px-5 py-4 text-left text-sm transition ${expanded ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                        onClick={() => setExpandedCaseId((current) => (current === item.id ? null : item.id))}
                      >
                        <div>
                          <div className="flex items-center gap-2 font-semibold text-slate-950">
                            <ChevronDown className={`h-4 w-4 text-slate-400 transition ${expanded ? 'rotate-180' : ''}`} />
                            {item.publicId} {item.title}
                          </div>
                          <div className="mt-1 pl-6 text-slate-500">{item.summary}</div>
                        </div>
                        <CaseStatusBadge status={item.status} />
                        <span className="text-slate-700">{item.priority}</span>
                        <span className="text-slate-500">{item.updatedAt}</span>
                        <span className="font-medium text-slate-700">{item.chats}</span>
                        <span className="font-medium text-slate-700">{item.materials}</span>
                      </button>

                      {expanded ? (
                        <div className="bg-white px-5 pb-5 pt-1">
                          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div>
                                <h3 className="font-semibold text-slate-950">Рекомендуется прикрепить к кейсу</h3>
                                <p className="mt-1 text-sm text-slate-500">Элементы активности с вероятностью соответствия этому кейсу.</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="rounded-xl bg-white px-3 py-1 text-xs font-semibold text-blue-700">{activitySuggestions.length} предложения</span>
                                {item.status !== 'Закрыт' ? (
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onCloseCase(item.id);
                                    }}
                                  >
                                    Закрыть кейс
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              {activitySuggestions.map((activity) => (
                                <div key={`${item.id}-${activity.title}`} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                  <div className="mb-2 flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                                        {activity.type === 'Telegram' ? <Send className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-slate-950">{activity.title}</div>
                                        <div className="text-xs text-slate-500">{activity.type}</div>
                                      </div>
                                    </div>
                                    <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{activity.probability}%</span>
                                  </div>
                                  <p className="min-h-10 text-sm leading-5 text-slate-600">{activity.text}</p>
                                  <Button
                                    className="mt-3 w-full"
                                    size="sm"
                                    variant="outline"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onToast('Активность прикреплена', `${activity.title} → ${item.publicId}`);
                                    }}
                                  >
                                    <Link2 className="h-4 w-4" /> Прикрепить
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        <AgentChatPanel
          className="h-[calc(100vh-188px)]"
          messages={messages}
          onSendText={onSendText}
          onExecuteAction={onExecuteAction}
          onUpdateAttachmentComment={onUpdateAttachmentComment}
          onToast={onToast}
        />
      </div>
    </PageShell>
  );
}

export function PageShell({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <main className="case-scrollbar min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-semibold text-slate-950">{title}</h1><p className="mt-1 text-sm text-slate-500">Данные загружаются из backend CasePilot и активных интеграций.</p></div>
        {action}
      </div>
      {children}
    </main>
  );
}
