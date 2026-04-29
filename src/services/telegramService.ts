import { isRealApiMode } from '../config/api';
import { apiClient } from './apiClient';

export const telegramService = {
  async listMessages() {
    if (isRealApiMode) {
      return apiClient.get('/api/telegram/messages');
    }
    return { items: [] };
  },

  async attachToCase(messageId: string, caseId: string) {
    if (isRealApiMode) {
      return apiClient.post(`/api/telegram/messages/${messageId}/attach-to-case`, { case_id: caseId });
    }
    return { id: `case-telegram-${Date.now()}`, messageId, caseId };
  },
};
