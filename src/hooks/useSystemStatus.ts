import { useCallback, useEffect, useState } from 'react';

import { diagnosticsService, obdService } from '../services';
import type { IntegrationStatus, ObdStatus } from '../services';

export function useSystemStatus(showToast?: (title: string, description?: string, type?: 'success' | 'warning' | 'info') => void) {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [obdStatus, setObdStatus] = useState<ObdStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [integrationResponse, nextObdStatus] = await Promise.all([
        diagnosticsService.integrations(),
        obdService.getStatus(),
      ]);
      setIntegrations(integrationResponse.items ?? []);
      setObdStatus(nextObdStatus);
      setLastUpdatedAt(new Date().toISOString());
    } catch (reason) {
      showToast?.('Ошибка статусов', reason instanceof Error ? reason.message : 'Не удалось получить статусы backend', 'warning');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 10000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const byId = useCallback((id: string) => integrations.find((item) => item.id === id), [integrations]);

  return {
    integrations,
    obdStatus,
    esp32Status: byId('esp32'),
    loading,
    lastUpdatedAt,
    refresh,
    byId,
  };
}
