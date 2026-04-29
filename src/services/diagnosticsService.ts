import { isRealApiMode } from '../config/api';
import { apiClient } from './apiClient';

export type IntegrationStatus = {
  id: string;
  name: string;
  status: string | null;
  configured: boolean;
  details?: Record<string, unknown>;
};

export type ComponentStatus = {
  id: string;
  name: string;
  status: string | null;
  latency_ms?: number | null;
  details?: unknown;
};

export const diagnosticsService = {
  async components() {
    if (isRealApiMode) {
      return apiClient.get<{ items: ComponentStatus[]; generated_at: string }>('/api/diagnostics/components');
    }
    return { items: [] };
  },

  async integrations() {
    if (isRealApiMode) {
      return apiClient.get<{ items: IntegrationStatus[]; generated_at: string }>('/api/integrations/statuses');
    }
    return { items: [] };
  },
};
