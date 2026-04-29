import type { ExecutionSession } from '../types';
import { isRealApiMode } from '../config/api';
import { apiClient } from './apiClient';

type ExecutionResponse = {
  execution: {
    id: string;
    proposed_action_id?: string;
    obd_region_task_id?: string;
    status: ExecutionSession['status'];
    risk_level: ExecutionSession['riskLevel'];
    error?: string | null;
    created_at: string;
    updated_at: string;
  };
  commands: Array<{
    id: string;
    command_type: ExecutionSession['commands'][number]['type'];
    payload: Record<string, unknown>;
    status: ExecutionSession['commands'][number]['status'];
  }>;
};

function mapExecution(response: ExecutionResponse): ExecutionSession {
  return {
    id: response.execution.id,
    actionId: response.execution.proposed_action_id,
    taskId: response.execution.obd_region_task_id,
    status: response.execution.status,
    riskLevel: response.execution.risk_level,
    error: response.execution.error ?? undefined,
    createdAt: response.execution.created_at,
    updatedAt: response.execution.updated_at,
    commands: response.commands.map((command) => ({
      id: command.id,
      type: command.command_type,
      payload: command.payload,
      status: command.status,
    })),
  };
}

export const executionService = {
  async executeAction(actionId: string): Promise<ExecutionSession> {
    if (isRealApiMode) {
      return mapExecution(await apiClient.post<ExecutionResponse>(`/api/actions/${actionId}/execute`, { confirmed: true }));
    }

    const now = new Date().toISOString();
    return {
      id: `execution-${Date.now()}`,
      actionId,
      status: 'executed',
      riskLevel: 'low',
      commands: [
        { id: `cmd-${Date.now()}-1`, type: 'mouse.click', status: 'done', payload: { x: 830, y: 441, button: 'left' } },
        { id: `cmd-${Date.now()}-2`, type: 'keyboard.hotkey', status: 'done', payload: { keys: ['Ctrl', 'A'] } },
        { id: `cmd-${Date.now()}-3`, type: 'keyboard.key', status: 'done', payload: { key: 'Backspace' } },
        { id: `cmd-${Date.now()}-4`, type: 'keyboard.type', status: 'done', payload: { text: 'Просьба проверить и подтвердить данные по кейсу CASE-024.' } },
      ],
      createdAt: now,
      updatedAt: now,
    };
  },

  async stop(): Promise<void> {
    if (isRealApiMode) {
      await apiClient.post('/api/esp32/stop');
      return;
    }
    return undefined;
  },

  async clickObd(x: number, y: number): Promise<void> {
    if (isRealApiMode) {
      await apiClient.post('/api/esp32/click', { x, y, button: 'left' });
      return;
    }
    return undefined;
  },

  async sendHidCommand(type: 'mouse.move' | 'mouse.down' | 'mouse.up' | 'mouse.scroll' | 'keyboard.type' | 'keyboard.key' | 'keyboard.hotkey' | 'system.stop', payload: Record<string, unknown>, timeoutMs?: number): Promise<void> {
    if (isRealApiMode) {
      await apiClient.post('/api/esp32/command', { type, payload, timeout_ms: timeoutMs });
      return;
    }
    return undefined;
  },
};
