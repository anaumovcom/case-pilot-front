import type { LucideIcon } from 'lucide-react';

export type CaseStatus = 'Новый' | 'В работе' | 'Ждёт ответа' | 'Нужен анализ' | 'Есть решение' | 'Закрыт' | 'Отложен';

export type CaseItem = {
  id: string;
  publicId: string;
  title: string;
  status: CaseStatus;
  priority: 'Низкий' | 'Средний' | 'Высокий';
  tags: string[];
  updatedAt: string;
  summary: string;
  chats: number;
  materials: number;
};

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export type RegionCoordinates = {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateSpace?: 'viewport_pixels' | 'remote_pixels' | 'mock_dom_pixels';
};

export type ViewportTransform = {
  remoteWidth: number;
  remoteHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  scaleX: number;
  scaleY: number;
};

export type ContextFlags = {
  caseDescription: boolean;
  caseMemory: boolean;
  telegram: boolean;
  recentChat: boolean;
  ocrRegion: boolean;
  fullScreen: boolean;
  globalMemory: boolean;
  similarCases: boolean;
};

export type Attachment = {
  id: string;
  type: 'obd-region' | 'screenshot' | 'ocr' | 'telegram';
  title: string;
  previewText?: string;
  thumbnailDataUrl?: string;
  comment?: string;
  includedTypes?: Array<'screenshot' | 'ocr'>;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  taskId?: string;
  fileId?: string;
};

export type AttachmentReference = {
  attachmentId: string;
  kind: Attachment['type'];
  title: string;
  thumbnailUrl?: string;
};

export type ObdRegionTaskStatus = 'created' | 'screenshot_done' | 'ocr_pending' | 'ocr_done' | 'agent_pending' | 'agent_done' | 'action_ready' | 'execution_pending' | 'executed' | 'failed' | 'cancelled';

export type ObdRegionTask = {
  id: string;
  caseId: string;
  chatId?: string;
  status: ObdRegionTaskStatus;
  userInstruction?: string;
  selectedTemplate?: string;
  region: RegionCoordinates;
  viewportTransform?: ViewportTransform;
  regionScreenshotAttachmentId?: string;
  fullScreenshotAttachmentId?: string;
  ocrResultId?: string;
  contextFlags: ContextFlags;
  agentRunId?: string;
  proposedActionId?: string;
  executionSessionId?: string;
  resultStatus?: string;
  createdAt: string;
  updatedAt: string;
};

export type OcrResult = {
  id: string;
  taskId?: string;
  text: string;
  status: 'pending' | 'done' | 'error';
  confidence?: number;
  createdAt: string;
};

export type AgentActionCard = {
  id: string;
  type: 'text-input' | 'click' | 'analysis';
  title: string;
  textToInsert?: string;
  explanation?: string;
  executionPlan?: string[];
  requiresConfirmation?: boolean;
  dangerous?: boolean;
  riskLevel?: 'low' | 'medium' | 'high' | 'blocked';
  targetRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  status: 'draft' | 'ready' | 'executed';
};

export type HidCommandPreview = {
  id: string;
  type: 'mouse.move' | 'mouse.click' | 'mouse.down' | 'mouse.up' | 'mouse.double_click' | 'mouse.drag' | 'mouse.scroll' | 'keyboard.type' | 'keyboard.key' | 'keyboard.hotkey' | 'system.stop';
  payload: Record<string, unknown>;
  status: 'queued' | 'running' | 'done' | 'failed' | 'skipped';
};

export type ExecutionSession = {
  id: string;
  actionId?: string;
  taskId?: string;
  status: 'pending' | 'running' | 'executed' | 'failed' | 'stopped';
  riskLevel: 'low' | 'medium' | 'high' | 'blocked';
  commands: HidCommandPreview[];
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  caseId?: string;
  chatId?: string;
  role: 'user' | 'assistant';
  authorName: string;
  time: string;
  text?: string;
  attachments?: Attachment[];
  actionCard?: AgentActionCard;
  createdAt?: string;
  updatedAt?: string;
};

export type NavItem = {
  id: AppSection;
  label: string;
  icon: LucideIcon;
};

export type AppSection = 'home' | 'cases' | 'search' | 'telegram' | 'memory' | 'macros' | 'integrations' | 'diagnostics';

export type ToastMessage = {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  description?: string;
};

export type CaseEvent = {
  id: string;
  caseId: string;
  eventType: string;
  actorType: 'user' | 'system' | 'agent' | 'integration';
  payload: Record<string, unknown>;
  createdAt: string;
};

export type MemoryItem = {
  id: string;
  caseId?: string;
  scope: 'case' | 'global';
  memoryType: 'fact' | 'decision' | 'hypothesis' | 'preference' | 'rule' | 'open_question' | 'solution';
  status: 'draft' | 'confirmed' | 'rejected' | 'stale';
  text: string;
  createdAt: string;
  updatedAt: string;
};
