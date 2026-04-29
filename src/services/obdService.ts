import type { ObdRegionTask, RegionCoordinates } from '../types';
import { isRealApiMode } from '../config/api';
import { apiClient } from './apiClient';

export type ObdStatus = {
  status: 'online' | 'offline';
  fps: number;
  latencyMs: number;
  screenWidth: number;
  screenHeight: number;
  source: string;
  sceneName?: string;
  lastFrameAt?: string;
  error?: string;
};

export type ObdFrame = {
  id: string;
  status: 'created' | 'offline';
  source: string;
  imageDataUrl?: string | null;
  screenWidth?: number;
  screenHeight?: number;
  latencyMs?: number;
  error?: string;
  createdAt: string;
};

export type ObdWebRtcSession = {
  sessionId: number;
  sdp: string;
  type: 'answer';
  screenWidth: number;
  screenHeight: number;
  source: string;
};

export const obdService = {
  async getStatus(): Promise<ObdStatus> {
    if (isRealApiMode) {
      const response = await apiClient.get<{ status: 'online' | 'offline'; fps: number; latency_ms: number; screen_width: number; screen_height: number; source: string; scene_name?: string; last_frame_at?: string; error?: string }>('/api/obd/status');
      return {
        status: response.status,
        fps: response.fps,
        latencyMs: response.latency_ms,
        screenWidth: response.screen_width,
        screenHeight: response.screen_height,
        source: response.source,
        sceneName: response.scene_name,
        lastFrameAt: response.last_frame_at,
        error: response.error,
      };
    }

    return {
      status: 'online',
      fps: 24,
      latencyMs: 82,
      screenWidth: 1920,
      screenHeight: 1080,
      source: 'mock',
    };
  },

  async getFrame(): Promise<ObdFrame> {
    if (isRealApiMode) {
      const response = await apiClient.get<{ id: string; status: 'created' | 'offline'; source: string; image_data_url?: string | null; screen_width?: number; screen_height?: number; latency_ms?: number; error?: string; created_at: string }>('/api/obd/frame');
      return {
        id: response.id,
        status: response.status,
        source: response.source,
        imageDataUrl: response.image_data_url,
        screenWidth: response.screen_width,
        screenHeight: response.screen_height,
        latencyMs: response.latency_ms,
        error: response.error,
        createdAt: response.created_at,
      };
    }

    return {
      id: `mock-frame-${Date.now()}`,
      status: 'offline',
      source: 'mock',
      imageDataUrl: null,
      createdAt: new Date().toISOString(),
    };
  },

  async createWebRtcSession(offer: { sdp: string; type: string }): Promise<ObdWebRtcSession> {
    const response = await apiClient.post<{
      session_id: number;
      sdp: string;
      type: 'answer';
      screen_width: number;
      screen_height: number;
      source: string;
    }>('/api/obd/webrtc/offer', offer);

    return {
      sessionId: response.session_id,
      sdp: response.sdp,
      type: response.type,
      screenWidth: response.screen_width,
      screenHeight: response.screen_height,
      source: response.source,
    };
  },

  async closeWebRtcSession(sessionId: number): Promise<void> {
    await apiClient.delete(`/api/obd/webrtc/session/${sessionId}`);
  },

  async createRegionTask(caseId: string, region: RegionCoordinates, userInstruction?: string): Promise<ObdRegionTask> {
    if (isRealApiMode) {
      const response = await apiClient.post<{
        id: string;
        case_id: string;
        chat_id?: string;
        status: ObdRegionTask['status'];
        user_instruction?: string;
        selected_template?: string;
        region: RegionCoordinates;
        viewport_transform?: ObdRegionTask['viewportTransform'];
        region_screenshot_attachment_id?: string;
        full_screenshot_attachment_id?: string;
        ocr_result_id?: string;
        context_flags: Record<string, boolean>;
        agent_run_id?: string;
        proposed_action_id?: string;
        execution_session_id?: string;
        result_status?: string;
        created_at: string;
        updated_at: string;
      }>(`/api/cases/${caseId}/obd-region-tasks`, {
        user_instruction: userInstruction,
        region,
      });

      return {
        id: response.id,
        caseId: response.case_id,
        chatId: response.chat_id,
        status: response.status,
        userInstruction: response.user_instruction,
        selectedTemplate: response.selected_template,
        region: response.region,
        viewportTransform: response.viewport_transform,
        regionScreenshotAttachmentId: response.region_screenshot_attachment_id,
        fullScreenshotAttachmentId: response.full_screenshot_attachment_id,
        ocrResultId: response.ocr_result_id,
        contextFlags: {
          caseDescription: response.context_flags.case_description ?? true,
          caseMemory: response.context_flags.case_memory ?? true,
          telegram: response.context_flags.telegram ?? true,
          recentChat: response.context_flags.recent_chat ?? true,
          ocrRegion: response.context_flags.ocr_region ?? true,
          fullScreen: response.context_flags.full_screen ?? true,
          globalMemory: response.context_flags.global_memory ?? false,
          similarCases: response.context_flags.similar_cases ?? false,
        },
        agentRunId: response.agent_run_id,
        proposedActionId: response.proposed_action_id,
        executionSessionId: response.execution_session_id,
        resultStatus: response.result_status,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
      };
    }

    const now = new Date().toISOString();
    return {
      id: `obd-task-${Date.now()}`,
      caseId,
      status: 'created',
      userInstruction,
      region,
      contextFlags: {
        caseDescription: true,
        caseMemory: true,
        telegram: true,
        recentChat: true,
        ocrRegion: true,
        fullScreen: true,
        globalMemory: false,
        similarCases: false,
      },
      createdAt: now,
      updatedAt: now,
    };
  },

  async runOcr(taskId: string) {
    if (isRealApiMode) {
      return apiClient.post(`/api/obd-region-tasks/${taskId}/ocr`);
    }
    return { task: { id: taskId, status: 'ocr_done' }, ocr_result: { text: 'Комментарий для клиента: Введите комментарий для клиента...' } };
  },
};
