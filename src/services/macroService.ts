import { isRealApiMode } from '../config/api';
import { apiClient } from './apiClient';

export const macroService = {
  async listMacros() {
    if (isRealApiMode) {
      return apiClient.get('/api/macros');
    }
    return { items: [] };
  },

  async runMacro(macroId: string, parameters: Record<string, string> = {}) {
    if (isRealApiMode) {
      return apiClient.post(`/api/macros/${macroId}/runs`, { parameters });
    }
    return { run: { id: `macro-run-${Date.now()}`, macro_id: macroId, parameters, status: 'completed' } };
  },
};
