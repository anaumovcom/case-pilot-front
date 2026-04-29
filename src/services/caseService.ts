import { isRealApiMode } from '../config/api';
import { cases as seedCases } from '../data/mockCases';
import type { CaseItem } from '../types';
import { apiClient } from './apiClient';

type CaseListResponse = {
  items: Array<{
    id: string;
    public_id: string;
    title: string;
    status: CaseItem['status'];
    priority: CaseItem['priority'];
    tags: string[];
    updated_at: string;
    summary?: string;
    chats_count?: number;
    materials_count?: number;
  }>;
};

type CaseResponse = CaseListResponse['items'][number];

let mockCases = seedCases.map((item) => ({ ...item }));

function mapCase(item: CaseResponse): CaseItem {
  return {
    id: item.id,
    publicId: item.public_id,
    title: item.title,
    status: item.status,
    priority: item.priority,
    tags: item.tags,
    updatedAt: item.updated_at,
    summary: item.summary ?? '',
    chats: item.chats_count ?? 0,
    materials: item.materials_count ?? 0,
  };
}

function normalizeTitle(title: string) {
  return title.trim() || 'Новый рабочий кейс';
}

export const caseService = {
  getCachedCases(): CaseItem[] {
    return mockCases.map((item) => ({ ...item }));
  },

  async listCases(signal?: AbortSignal): Promise<CaseItem[]> {
    if (isRealApiMode) {
      const response = await apiClient.get<CaseListResponse>('/api/cases', signal);
      return response.items.map(mapCase);
    }

    return this.getCachedCases();
  },

  async createCase(title: string, signal?: AbortSignal): Promise<CaseItem> {
    if (isRealApiMode) {
      return mapCase(await apiClient.post<CaseResponse>('/api/cases', { title: normalizeTitle(title), priority: 'Средний', tags: ['новый'] }, signal));
    }

    const nextNumber = String(mockCases.length + 25).padStart(3, '0');
    const nextCase: CaseItem = {
      id: `CASE-${nextNumber}`,
      publicId: `CASE-${nextNumber}`,
      title: normalizeTitle(title),
      status: 'Новый',
      priority: 'Средний',
      tags: ['новый'],
      updatedAt: 'сейчас',
      summary: 'Новый кейс создан на мок-данных через service layer.',
      chats: 0,
      materials: 0,
    };
    mockCases = [nextCase, ...mockCases];
    return { ...nextCase };
  },

  async closeCase(caseId: string, signal?: AbortSignal): Promise<CaseItem> {
    if (isRealApiMode) {
      return mapCase(await apiClient.post<CaseResponse>(`/api/cases/${caseId}/close`, undefined, signal));
    }

    mockCases = mockCases.map((item) => (item.id === caseId ? { ...item, status: 'Закрыт', updatedAt: 'сейчас' } : item));
    const closedCase = mockCases.find((item) => item.id === caseId);
    if (!closedCase) {
      throw new Error('Кейс не найден');
    }
    return { ...closedCase };
  },
};
