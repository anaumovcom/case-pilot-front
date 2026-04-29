import { initialChatMessages } from '../data/mockChat';
import { isRealApiMode } from '../config/api';
import type { Attachment, ChatMessage } from '../types';
import { apiClient } from './apiClient';

let mockMessages = initialChatMessages.map((item) => ({ ...item }));

const currentTime = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

type ApiMessage = {
  id: string;
  chat_id: string;
  role: ChatMessage['role'];
  author_name?: string;
  content_md?: string | null;
  content_json?: { action_id?: string } | null;
  attachments?: Array<Record<string, unknown>>;
  created_at: string;
};

type WorkspaceSnapshot = {
  current_chat: { id: string };
  recent_messages: ApiMessage[];
};

function mapAttachment(item: Record<string, unknown>): Attachment {
  return {
    id: String(item.id ?? `att-${Date.now()}`),
    type: item.type === 'obd_region' ? 'obd-region' : (item.type as Attachment['type']) ?? 'obd-region',
    title: String(item.title ?? 'Вложение'),
    previewText: item.preview_text ? String(item.preview_text) : undefined,
    thumbnailDataUrl: item.thumbnail_data_url ? String(item.thumbnail_data_url) : undefined,
  };
}

function mapMessage(item: ApiMessage): ChatMessage {
  return {
    id: item.id,
    role: item.role,
    authorName: item.author_name ?? (item.role === 'assistant' ? 'Агент' : 'Вы'),
    time: new Date(item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    text: item.content_md ?? (item.content_json?.action_id ? 'Готова карточка действия. Откройте действие для подтверждения.' : ''),
    attachments: item.attachments?.map(mapAttachment),
  };
}

export const chatService = {
  getCachedMessages(): ChatMessage[] {
    return mockMessages.map((item) => ({ ...item }));
  },

  async listCurrentMessages(caseId?: string): Promise<{ chatId?: string; messages: ChatMessage[] }> {
    if (isRealApiMode && caseId) {
      const snapshot = await apiClient.get<WorkspaceSnapshot>(`/api/cases/${caseId}/workspace-snapshot`);
      return { chatId: snapshot.current_chat.id, messages: snapshot.recent_messages.map(mapMessage) };
    }

    return { messages: this.getCachedMessages() };
  },

  async sendTextMessage(chatId: string | undefined, text: string, attachments: Attachment[]): Promise<ChatMessage[]> {
    if (isRealApiMode && chatId) {
      const message = await apiClient.post<ApiMessage>(`/api/chats/${chatId}/messages`, {
        content_md: text,
        attachments: attachments.map((attachment) => ({
          id: attachment.id,
          type: attachment.type,
          title: attachment.title,
          preview_text: attachment.previewText,
          thumbnail_data_url: attachment.thumbnailDataUrl,
          comment: attachment.comment,
          coordinates: attachment.coordinates,
        })),
      });
      return [mapMessage(message)];
    }

    return this.sendMockTextMessage(text, attachments);
  },

  async sendMockTextMessage(text: string, attachments: Attachment[]): Promise<ChatMessage[]> {
    const time = currentTime();
    const assistantText = attachments.length > 0
      ? 'Принял задачу и прикреплённые OBD-области. Проанализирую скриншоты/OCR вместе с текстом задания.'
      : 'Принял задачу. Для точного действия лучше прикрепить OBD-область или OCR.';

    const created: ChatMessage[] = [
      { id: `msg-user-${Date.now()}`, role: 'user', authorName: 'Вы', time, text, attachments: attachments.length > 0 ? attachments : undefined },
      { id: `msg-agent-${Date.now()}`, role: 'assistant', authorName: 'Агент', time, text: assistantText },
    ];
    mockMessages = [...mockMessages, ...created];
    return created;
  },

  async sendTaskToAgent(instruction: string, attachments: Attachment[]): Promise<ChatMessage[]> {
    const time = currentTime();
    const fallbackAttachment: Attachment = {
      id: `att-${Date.now()}`,
      type: 'obd-region',
      title: 'OBD-область',
      previewText: 'Введите комментарий для клиента...',
    };
    const created: ChatMessage[] = [
      {
        id: `msg-user-${Date.now()}`,
        role: 'user',
        authorName: 'Вы',
        time,
        text: instruction,
        attachments: attachments.length > 0 ? attachments : [fallbackAttachment],
      },
      {
        id: `msg-agent-${Date.now()}`,
        role: 'assistant',
        authorName: 'Агент',
        time,
        actionCard: {
          id: `action-${Date.now()}`,
          type: 'text-input',
          title: 'Агент предлагает действие',
          textToInsert: 'Просьба проверить и подтвердить данные по кейсу CASE-024.',
          explanation: 'Сформулировано на основе выбранной OBD-области, OCR, памяти кейса и Telegram-контекста.',
          executionPlan: [
            'Кликнуть в центр выделенной области.',
            'Выделить текущий текст через Ctrl+A.',
            'Очистить поле.',
            'Ввести предложенный текст.',
            'Сделать контрольный скриншот и записать событие в кейс.',
          ],
          requiresConfirmation: true,
          riskLevel: 'low',
          targetRegion: { x: 640, y: 420, width: 380, height: 42 },
          status: 'ready',
        },
      },
    ];
    mockMessages = [...mockMessages, ...created];
    return created;
  },
};
