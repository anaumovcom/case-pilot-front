import type { ChatMessage } from '../types';

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-user-1',
    role: 'user',
    authorName: 'Вы',
    time: '11:32',
    text: 'Напиши, что ввести в это поле',
    attachments: [
      {
        id: 'att-region-1',
        type: 'obd-region',
        title: 'OBD-область',
        previewText: 'Введите комментарий для клиента...',
      },
    ],
  },
  {
    id: 'msg-agent-1',
    role: 'assistant',
    authorName: 'Агент',
    time: '11:32',
    actionCard: {
      id: 'action-1',
      type: 'text-input',
      title: 'Агент предлагает действие',
      textToInsert: 'Просьба проверить и подтвердить данные по кейсу CASE-024.',
      explanation: 'Сформулировано на основе контекста кейса и последних сообщений.',
      executionPlan: ['Кликнуть в центр выделенной области.', 'Выделить текущий текст через Ctrl+A.', 'Очистить поле.', 'Ввести предложенный текст.', 'Сделать контрольный скриншот и записать событие в кейс.'],
      requiresConfirmation: true,
      targetRegion: {
        x: 640,
        y: 420,
        width: 380,
        height: 42,
      },
      status: 'ready',
    },
  },
];
