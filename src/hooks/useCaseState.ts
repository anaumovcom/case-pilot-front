import { useEffect, useMemo, useState } from 'react';

import { caseService } from '../services';
import type { CaseItem } from '../types';

export type CaseFilter = 'Все' | 'В работе' | 'Ждёт ответа';

export function useCaseState(showToast: (title: string, description?: string, type?: 'success' | 'warning' | 'info') => void) {
  const [cases, setCases] = useState<CaseItem[]>(() => caseService.getCachedCases());
  const [selectedCaseId, setSelectedCaseId] = useState(() => caseService.getCachedCases()[0]?.id ?? '');
  const [caseSearch, setCaseSearch] = useState('');
  const [caseFilter, setCaseFilter] = useState<CaseFilter>('Все');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    caseService.listCases(controller.signal)
      .then((items) => {
        setCases(items);
        setSelectedCaseId((current) => (items.some((item) => item.id === current) ? current : items[0]?.id ?? ''));
        setError(null);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : 'Не удалось загрузить кейсы');
        showToast('Ошибка загрузки кейсов', 'Показаны локальные mock-данные.', 'warning');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [showToast]);

  const selectedCase = cases.find((item) => item.id === selectedCaseId) ?? cases[0] ?? null;

  const visibleCases = useMemo(() => {
    return cases.filter((item) => {
      const publicId = item.publicId || item.id;
      const matchesSearch = `${publicId} ${item.title}`.toLowerCase().includes(caseSearch.toLowerCase());
      const matchesFilter = caseFilter === 'Все' || item.status === caseFilter;
      return matchesSearch && matchesFilter;
    });
  }, [cases, caseFilter, caseSearch]);

  const createCase = async (title: string) => {
    const nextCase = await caseService.createCase(title);
    setCases((current) => [nextCase, ...current]);
    setSelectedCaseId(nextCase.id);
    showToast('Кейс создан', `${nextCase.publicId} ${nextCase.title}`, 'success');
    return nextCase;
  };

  const closeCase = async (caseId: string) => {
    const closedCase = await caseService.closeCase(caseId);
    setCases((current) => current.map((item) => (item.id === caseId ? closedCase : item)));
    showToast('Кейс закрыт', closedCase.publicId, 'success');
  };

  return {
    cases,
    visibleCases,
    selectedCase,
    selectedCaseId,
    caseSearch,
    caseFilter,
    loading,
    error,
    setSelectedCaseId,
    setCaseSearch,
    setCaseFilter,
    createCase,
    closeCase,
  };
}
