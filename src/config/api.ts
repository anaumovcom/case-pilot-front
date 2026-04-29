export type ApiMode = 'mock' | 'real';

const envMode = import.meta.env.VITE_API_MODE as ApiMode | undefined;

export const apiConfig = {
  mode: envMode === 'mock' ? 'mock' : 'real',
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000',
};

export const isRealApiMode = apiConfig.mode === 'real';
