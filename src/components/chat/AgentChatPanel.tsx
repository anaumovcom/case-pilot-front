import { ChevronDown, MessageSquare, MonitorUp, Plus, Trash2, X } from 'lucide-react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { Attachment, ChatMessage as ChatMessageType } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Textarea } from '../ui/Input';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';

type Props = {
  messages: ChatMessageType[];
  onSendText: (text: string) => void;
  onExecuteAction: (cardId: string) => void;
  onToast: (title: string, description?: string) => void;
  draftAttachments?: Attachment[];
  onRemoveDraftAttachment?: (attachmentId: string) => void;
  onUpdateAttachmentComment?: (attachmentId: string, comment: string) => void;
  className?: string;
};

type CaseChat = {
  id: string;
  title: string;
  subtitle: string;
  messages?: ChatMessageType[];
};

const pastCaseChats: CaseChat[] = [
  {
    id: 'analysis',
    title: 'Анализ проблемы',
    subtitle: '3 сообщения · вчера',
    messages: [
      { id: 'analysis-1', role: 'user', authorName: 'Вы', time: '10:14', text: 'Проверь, почему клиент не может завершить настройку интеграции.' },
      { id: 'analysis-2', role: 'assistant', authorName: 'Агент', time: '10:15', text: 'Похоже, проблема связана с неполными данными заявки и отсутствующим подтверждением со стороны клиента.' },
      { id: 'analysis-3', role: 'user', authorName: 'Вы', time: '10:18', text: 'Сохрани это как гипотезу кейса.' },
    ],
  },
  {
    id: 'telegram-context',
    title: 'Telegram-контекст',
    subtitle: '5 сообщений · 20 мая',
    messages: [
      { id: 'telegram-1', role: 'user', authorName: 'Вы', time: '11:05', text: 'Собери важные факты из прикреплённых Telegram-сообщений.' },
      { id: 'telegram-2', role: 'assistant', authorName: 'Агент', time: '11:06', text: 'Главный факт: клиент просит подтвердить данные и получить короткий официальный комментарий без внутренних технических деталей.' },
    ],
  },
  {
    id: 'final-answer',
    title: 'Подготовка ответа',
    subtitle: '2 сообщения · 19 мая',
    messages: [
      { id: 'final-1', role: 'user', authorName: 'Вы', time: '17:42', text: 'Сформулируй нейтральный ответ клиенту по заявке.' },
      { id: 'final-2', role: 'assistant', authorName: 'Агент', time: '17:43', text: 'Можно использовать официальный тон: “Проверим данные по заявке и вернёмся с подтверждением после сверки.”' },
    ],
  },
];

export function AgentChatPanel({ messages, onSendText, onExecuteAction, onToast, draftAttachments = [], onRemoveDraftAttachment, onUpdateAttachmentComment, className = '' }: Props) {
  const panelRef = useRef<HTMLElement | null>(null);
  const [activeChatId, setActiveChatId] = useState('current-obd');
  const [chatListOpen, setChatListOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [newChats, setNewChats] = useState<CaseChat[]>([]);
  const [deletedChatIds, setDeletedChatIds] = useState<string[]>([]);
  const [width, setWidth] = useState(() => Number(window.localStorage.getItem('casepilot.chat.width')) || 410);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.width = `${width}px`;
    }
  }, [width]);
  const caseChats = useMemo<CaseChat[]>(() => [
    { id: 'current-obd', title: 'Работа с OBD-экраном', subtitle: `${messages.length} сообщения · сейчас` },
    ...newChats.filter((chat) => !deletedChatIds.includes(chat.id)),
    ...pastCaseChats.filter((chat) => !deletedChatIds.includes(chat.id)),
  ], [deletedChatIds, messages.length, newChats]);
  const activeChat = caseChats.find((chat) => chat.id === activeChatId) ?? caseChats[0];
  const visibleMessages = activeChat.id === 'current-obd' ? messages : activeChat.messages ?? [];

  const deleteChat = (chat: CaseChat) => {
    if (chat.id === 'current-obd') {
      onToast('Текущий чат нельзя удалить', 'Это активный рабочий чат OBD по текущему кейсу.');
      return;
    }
    setDeletedChatIds((current) => [...current, chat.id]);
    if (activeChatId === chat.id) {
      setActiveChatId('current-obd');
    }
    onToast('Чат удалён', chat.title);
  };

  const handleSendText = (text: string) => {
    if (activeChat.id !== 'current-obd') {
      onToast('Открыт прошлый чат', 'Чтобы писать новые сообщения, переключитесь на текущий чат OBD.');
      return;
    }
    onSendText(text);
  };

  const createNewChat = () => {
    const nextChat: CaseChat = {
      id: `new-chat-${Date.now()}`,
      title: `Новый чат ${newChats.length + 1}`,
      subtitle: '0 сообщений · сейчас',
      messages: [{ id: `system-${Date.now()}`, role: 'assistant', authorName: 'Агент', time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), text: 'Чат продолжен с контекстом кейса: выжимка, важные факты, Telegram и последние OBD-действия готовы к использованию.' }],
    };
    setNewChats((current) => [nextChat, ...current]);
    setActiveChatId(nextChat.id);
    onToast('Новый чат создан', 'Чат продолжен с контекстом текущего кейса.');
  };

  const startResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    const resize = (moveEvent: MouseEvent) => {
      const nextWidth = Math.min(620, Math.max(340, startWidth - (moveEvent.clientX - startX)));
      setWidth(nextWidth);
      window.localStorage.setItem('casepilot.chat.width', String(nextWidth));
    };

    const stopResize = () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    };

    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
  };

  return (
    <aside ref={panelRef} className={`relative min-h-0 min-w-0 flex shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="absolute left-0 top-0 z-20 h-full w-1 cursor-col-resize bg-transparent transition hover:bg-blue-200" onMouseDown={startResize} />
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
        <h2 className="font-semibold text-slate-950">Чат с агентом</h2>
        <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">
          Контекст: <span className="font-medium text-slate-700">Весь кейс</span> <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="border-b border-slate-200 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Чаты кейса</div>
          <button
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            onClick={createNewChat}
          >
            <Plus className="h-3.5 w-3.5" /> Новый
          </button>
        </div>

        <div className="relative">
          <button
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:bg-slate-50"
            onClick={() => setChatListOpen((current) => !current)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <MessageSquare className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-950">{activeChat.title}</span>
                <span className="block truncate text-xs text-slate-500">{activeChat.subtitle}</span>
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${chatListOpen ? 'rotate-180' : ''}`} />
          </button>

          {chatListOpen ? (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
              <div className="case-scrollbar max-h-72 overflow-y-auto p-2">
                {caseChats.map((chat) => {
                  const active = chat.id === activeChat.id;
                  return (
                    <button
                      key={chat.id}
                      className={`mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition last:mb-0 ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                      onClick={() => {
                        setActiveChatId(chat.id);
                        setChatListOpen(false);
                      }}
                    >
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{chat.title}</span>
                        <span className="block truncate text-xs opacity-75">{chat.subtitle}</span>
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        className={`rounded-lg p-1.5 transition ${chat.id === 'current-obd' ? 'cursor-not-allowed text-slate-300' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteChat(chat);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            event.stopPropagation();
                            deleteChat(chat);
                          }
                        }}
                        aria-label={`Удалить чат ${chat.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="case-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        {visibleMessages.map((message) => (
          <ChatMessage key={message.id} message={message} onExecuteAction={onExecuteAction} onOpenAttachmentDetails={setSelectedAttachment} onToast={onToast} />
        ))}
      </div>
      <div className="border-t border-slate-200 p-4">
        <ChatInput draftAttachments={draftAttachments} onRemoveDraftAttachment={onRemoveDraftAttachment} onOpenAttachmentDetails={setSelectedAttachment} onSend={handleSendText} onAttach={() => onToast('Выделите область на OBD', 'Зажмите Ctrl и выделите область мышью, затем выберите Скриншот/OCR.')} />
      </div>
      <AttachmentDetailsModal
        attachment={selectedAttachment}
        onClose={() => setSelectedAttachment(null)}
        onSave={(attachmentId, comment) => {
          onUpdateAttachmentComment?.(attachmentId, comment);
          setSelectedAttachment((current) => (current?.id === attachmentId ? { ...current, comment } : current));
        }}
      />
    </aside>
  );
}

function AttachmentDetailsModal({ attachment, onClose, onSave }: { attachment: Attachment | null; onClose: () => void; onSave: (attachmentId: string, comment: string) => void }) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    setComment(attachment?.comment ?? '');
  }, [attachment]);

  if (!attachment) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/30 p-6 backdrop-blur-sm" onMouseDown={onClose}>
      <Card className="w-full max-w-2xl p-0" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <MonitorUp className="h-4 w-4 shrink-0 text-blue-600" />
            <h3 className="truncate font-semibold text-slate-950">Детали выбранной области</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Закрыть">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-blue-600 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">OBD</span>
            {attachment.includedTypes?.includes('ocr') ? <span className="rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">OCR</span> : null}
            <span className="text-sm font-semibold text-slate-950">{attachment.title}</span>
          </div>
          {attachment.thumbnailDataUrl ? (
            <img src={attachment.thumbnailDataUrl} alt={attachment.title} className="max-h-72 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain" />
          ) : (
            <div className="case-grid-bg grid h-48 place-items-center rounded-2xl border border-dashed border-blue-300 bg-blue-50/40 text-sm font-medium text-blue-700">Миниатюра недоступна</div>
          )}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-950">Комментарий к этой области</label>
            <Textarea rows={4} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Добавьте комментарий к выбранной области..." />
          </div>
          {attachment.coordinates ? (
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Координаты области: x {attachment.coordinates.x}, y {attachment.coordinates.y}, w {attachment.coordinates.width}, h {attachment.coordinates.height}
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>Отмена</Button>
            <Button
              variant="primary"
              onClick={() => {
                onSave(attachment.id, comment.trim());
                onClose();
              }}
            >
              Сохранить комментарий
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
