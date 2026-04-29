import { useEffect, useState } from 'react';

import { chatService } from '../services';
import type { Attachment, ChatMessage } from '../types';

export function useChatState(showToast: (title: string, description?: string, type?: 'success' | 'warning' | 'info') => void, selectedCaseId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => chatService.getCachedMessages());
  const [chatId, setChatId] = useState<string | undefined>();
  const [draftAttachments, setDraftAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCaseId) return;
    chatService.listCurrentMessages(selectedCaseId)
      .then((response) => {
        setChatId(response.chatId);
        setMessages(response.messages);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Не удалось загрузить чат');
        showToast('Ошибка загрузки чата', 'Показана локальная история сообщений.', 'warning');
      });
  }, [selectedCaseId, showToast]);

  const attachRegionToDraft = (attachment: Attachment) => {
    setDraftAttachments((current) => [...current, attachment]);
    showToast('Область прикреплена', 'Она добавлена в подготовку сообщения агенту.', 'success');
  };

  const removeDraftAttachment = (attachmentId: string) => {
    setDraftAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  };

  const updateAttachmentComment = (attachmentId: string, comment: string) => {
    setDraftAttachments((current) => current.map((attachment) => (attachment.id === attachmentId ? { ...attachment, comment } : attachment)));
    setMessages((current) => current.map((message) => ({
      ...message,
      attachments: message.attachments?.map((attachment) => (attachment.id === attachmentId ? { ...attachment, comment } : attachment)),
    })));
    showToast('Комментарий обновлён', 'Комментарий к выбранной области сохранён.', 'success');
  };

  const sendTaskToAgent = async (instruction = 'Напиши, что ввести в это поле') => {
    setSending(true);
    try {
      const created = await chatService.sendTaskToAgent(instruction, draftAttachments);
      setMessages((current) => [...current, ...created]);
      setDraftAttachments([]);
      setError(null);
      showToast('Задача отправлена агенту', 'Контекстный пакет собран и добавлен в чат.', 'success');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Ошибка отправки задачи агенту');
      showToast('Ошибка отправки задачи', 'Попробуйте повторить позже.', 'warning');
    } finally {
      setSending(false);
    }
  };

  const sendTextMessage = async (text: string) => {
    setSending(true);
    try {
      const attachments = draftAttachments;
      const created = attachments.length > 0 ? await chatService.sendTaskToAgent(text, attachments) : await chatService.sendTextMessage(chatId, text, attachments);
      setMessages((current) => [...current, ...created]);
      setDraftAttachments([]);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Ошибка отправки сообщения');
      showToast('Ошибка отправки сообщения', 'Черновик сохранён локально.', 'warning');
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    setMessages,
    chatId,
    draftAttachments,
    sending,
    error,
    attachRegionToDraft,
    removeDraftAttachment,
    updateAttachmentComment,
    sendTaskToAgent,
    sendTextMessage,
  };
}
