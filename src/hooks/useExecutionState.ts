import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { executionService } from '../services';
import type { AgentActionCard, ChatMessage } from '../types';

export function useExecutionState(
  messages: ChatMessage[],
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  showToast: (title: string, description?: string, type?: 'success' | 'warning' | 'info') => void,
) {
  const [pendingAction, setPendingAction] = useState<AgentActionCard | null>(null);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const markActionExecuted = (cardId: string) => {
    setMessages((current) => current.map((message) => (message.actionCard?.id === cardId ? { ...message, actionCard: { ...message.actionCard, status: 'executed' } } : message)));
  };

  const requestExecuteAction = (cardId: string) => {
    const card = messages.find((message) => message.actionCard?.id === cardId)?.actionCard;
    if (!card || card.status === 'executed') {
      showToast('Нет действия для выполнения', 'Сначала получите готовую карточку действия агента.', 'warning');
      return;
    }
    setPendingAction(card);
  };

  const requestLatestReadyAction = () => {
    const card = [...messages].reverse().find((message) => message.actionCard?.status === 'ready')?.actionCard;
    if (!card) {
      showToast('Нет готовой карточки действия', 'Сначала отправьте выделенную область агенту.', 'warning');
      return;
    }
    setPendingAction(card);
  };

  const confirmExecuteAction = async () => {
    if (!pendingAction) return;
    setRunning(true);
    try {
      const session = await executionService.executeAction(pendingAction.id);
      markActionExecuted(pendingAction.id);
      setExecutionLog((current) => [`${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · ${session.commands.length} HID-команды выполнены`, ...current].slice(0, 8));
      showToast('Действие отправлено на ESP32', 'Поле очищено, текст введён, контрольный скриншот сохранён.', 'success');
      setPendingAction(null);
    } catch {
      showToast('Ошибка выполнения действия', 'Команды не были отправлены. Проверьте ESP32.', 'warning');
    } finally {
      setRunning(false);
    }
  };

  const stopExecution = async () => {
    await executionService.stop();
    setExecutionLog((current) => [`${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · stop отправлен`, ...current].slice(0, 8));
    showToast('Стоп управление отправлен', 'Активная очередь ESP32 остановлена.', 'warning');
  };

  const sendObdClick = async (x: number, y: number) => {
    try {
      await executionService.clickObd(x, y);
      setExecutionLog((current) => [`${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · клик ${x},${y} отправлен`, ...current].slice(0, 8));
      showToast('Клик отправлен на ESP32', `Координаты: ${x}, ${y}`, 'success');
    } catch {
      showToast('Ошибка отправки клика', 'Команда mouse.click не была отправлена на ESP32.', 'warning');
    }
  };

  const sendObdMouseCommand = async (type: 'mouse.move' | 'mouse.down' | 'mouse.up', x: number, y: number) => {
    await executionService.sendHidCommand(type, { x, y, button: 'left' });
  };

  const sendObdWheelCommand = async (x: number, y: number, deltaX: number, deltaY: number) => {
    await executionService.sendHidCommand('mouse.scroll', { x, y, deltaX, deltaY });
  };

  const sendObdKeyboardCommand = async (type: 'keyboard.type' | 'keyboard.key' | 'keyboard.hotkey', payload: Record<string, unknown>) => {
    await executionService.sendHidCommand(type, payload);
  };

  return {
    pendingAction,
    setPendingAction,
    executionLog,
    running,
    requestExecuteAction,
    requestLatestReadyAction,
    confirmExecuteAction,
    stopExecution,
    sendObdClick,
    sendObdMouseCommand,
    sendObdWheelCommand,
    sendObdKeyboardCommand,
  };
}
