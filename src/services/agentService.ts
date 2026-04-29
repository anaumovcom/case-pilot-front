import { apiClient } from './apiClient';
import { isRealApiMode } from '../config/api';

export const agentService = {
  async sendObdTaskToAgent(taskId: string) {
    if (isRealApiMode) {
      return apiClient.post(`/api/obd-region-tasks/${taskId}/send-to-agent`);
    }
    return { agent_run: { id: `agent-run-${Date.now()}`, status: 'completed' }, proposed_action: { id: `action-${Date.now()}`, status: 'ready' } };
  },
};
