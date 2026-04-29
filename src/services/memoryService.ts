import { isRealApiMode } from '../config/api';
import type { MemoryItem } from '../types';
import { apiClient } from './apiClient';

export const memoryService = {
  async listCaseMemory(caseId: string): Promise<MemoryItem[]> {
    if (isRealApiMode) {
      const response = await apiClient.get<{ items: MemoryItem[] }>(`/api/cases/${caseId}/memory`);
      return response.items;
    }
    return [];
  },
};
