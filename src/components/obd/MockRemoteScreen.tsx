import type { MouseEvent as ReactMouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { Attachment } from '../../types';
import { RegionContextMenu } from './RegionContextMenu';
import { RegionTaskPopover } from './RegionTaskPopover';

type Props = {
  fullscreen?: boolean;
  regionVisible: boolean;
  taskOpen: boolean;
  onOpenTask: () => void;
  onCloseTask: () => void;
  onAttachRegion: (attachment: Attachment) => void;
  onToast: (title: string, description?: string) => void;
  onRemoteMouseCommand: (type: 'mouse.move' | 'mouse.down' | 'mouse.up', x: number, y: number) => void | Promise<void>;
  onRemoteWheel: (x: number, y: number, deltaX: number, deltaY: number) => void | Promise<void>;
  onRemoteKeyboardCommand: (type: 'keyboard.type' | 'keyboard.key' | 'keyboard.hotkey', payload: Record<string, unknown>) => void | Promise<void>;
  stream?: MediaStream | null;
  streamError?: string | null;
  streamLabel?: string;
  remoteScreenWidth?: number;
  remoteScreenHeight?: number;
};

type ScreenElementWithWheelHandler = HTMLDivElement & {
  __casepilotWheelHandler?: (event: WheelEvent) => void;
};

const REMOTE_MOUSE_MOVE_INTERVAL_MS = 24;
const REMOTE_WHEEL_MIN_DELTA = 4;
const REMOTE_WHEEL_LINE_PX = 40;

const KEY_NAME_MAP: Record<string, string> = {
  Enter: 'Enter',
  Escape: 'Escape',
  Esc: 'Escape',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Del: 'Delete',
  ' ': 'Space',
  Spacebar: 'Space',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  Insert: 'Insert',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  CapsLock: 'CapsLock',
};

type SelectionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function MockRemoteScreen({ fullscreen = false, regionVisible, taskOpen, onOpenTask, onCloseTask, onAttachRegion, onToast, onRemoteMouseCommand, onRemoteWheel, onRemoteKeyboardCommand, stream, streamError, streamLabel = 'OBD stream', remoteScreenWidth, remoteScreenHeight }: Props) {
  const screenRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const selectionRef = useRef<HTMLDivElement | null>(null);
  const pendingMoveRef = useRef<{ x: number; y: number } | null>(null);
  const moveTimerRef = useRef<number | null>(null);
  const pressedRef = useRef(false);
  const lastRemotePointRef = useRef<{ x: number; y: number } | null>(null);
  const lastMoveAtRef = useRef(0);
  const [obdActive, setObdActive] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<SelectionRect | null>(null);

  useEffect(() => () => {
    if (moveTimerRef.current !== null) {
      window.clearTimeout(moveTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!selectionRef.current || !selection) return;
    selectionRef.current.style.left = `${selection.x}px`;
    selectionRef.current.style.top = `${selection.y}px`;
    selectionRef.current.style.width = `${selection.width}px`;
    selectionRef.current.style.height = `${selection.height}px`;
  }, [selection]);

  useEffect(() => {
    if (!videoRef.current || !stream) {
      return;
    }

    videoRef.current.srcObject = stream;
    void videoRef.current.play().catch(() => undefined);

    return () => {
      if (videoRef.current?.srcObject === stream) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  useEffect(() => {
    const screen = screenRef.current as ScreenElementWithWheelHandler | null;
    const video = videoRef.current;
    if (!screen || !video || !stream) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (Math.abs(event.deltaX) < REMOTE_WHEEL_MIN_DELTA && Math.abs(event.deltaY) < REMOTE_WHEEL_MIN_DELTA) {
        return;
      }

      const deltaScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? REMOTE_WHEEL_LINE_PX : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? REMOTE_WHEEL_LINE_PX * 3 : 1;
      const scaledDeltaX = event.deltaX * deltaScale;
      const scaledDeltaY = event.deltaY * deltaScale;
      const normalizedDeltaX = Math.abs(scaledDeltaX) >= REMOTE_WHEEL_MIN_DELTA ? Math.sign(scaledDeltaX) * 2 : 0;
      const normalizedDeltaY = Math.abs(scaledDeltaY) >= REMOTE_WHEEL_MIN_DELTA ? Math.sign(scaledDeltaY) * 2 : 0;
      if (normalizedDeltaX === 0 && normalizedDeltaY === 0) {
        return;
      }

      const remotePoint = mapClientPointToRemote(video, event.clientX, event.clientY, remoteScreenWidth, remoteScreenHeight) ?? lastRemotePointRef.current;
      if (!remotePoint) {
        return;
      }

      lastRemotePointRef.current = remotePoint;
      void onRemoteWheel(remotePoint.x, remotePoint.y, normalizedDeltaX, -normalizedDeltaY);
    };

    if (screen.__casepilotWheelHandler) {
      screen.removeEventListener('wheel', screen.__casepilotWheelHandler);
    }

    screen.__casepilotWheelHandler = handleWheel;
    screen.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      if (screen.__casepilotWheelHandler === handleWheel) {
        screen.removeEventListener('wheel', handleWheel);
        delete screen.__casepilotWheelHandler;
      }
    };
  }, [onRemoteWheel, remoteScreenHeight, remoteScreenWidth, stream]);

  useEffect(() => {
    if (!obdActive) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) {
        return;
      }

      if (event.key === 'Control' || event.key === 'Shift' || event.key === 'Alt' || event.key === 'Meta') {
        return;
      }

      const mainKey = KEY_NAME_MAP[event.key] ?? (/^F\d{1,2}$/.test(event.key) ? event.key : event.key);
      const modifiers = [
        ...(event.ctrlKey ? ['Control'] : []),
        ...(event.shiftKey ? ['Shift'] : []),
        ...(event.altKey ? ['Alt'] : []),
        ...(event.metaKey ? ['Meta'] : []),
      ];

      const send = async () => {
        if (modifiers.length > 0) {
          await onRemoteKeyboardCommand('keyboard.hotkey', { keys: [...modifiers, mainKey] });
          return;
        }

        if (event.key.length === 1) {
          await onRemoteKeyboardCommand('keyboard.type', { text: event.key });
          return;
        }

        await onRemoteKeyboardCommand('keyboard.key', { key: mainKey });
      };

      event.preventDefault();
      event.stopPropagation();
      void send().catch(() => {
        onToast('Ошибка отправки клавиши', `Команда для ${event.key} не была отправлена на ESP32.`);
      });
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [obdActive, onRemoteKeyboardCommand, onToast]);

  const getPoint = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = screenRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
    };
  };

  const updateSelection = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const nextSelection = {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
    setSelection(nextSelection);
    return nextSelection;
  };

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const point = getPoint(event);
    setDragStart(point);
    setSelection({ x: point.x, y: point.y, width: 0, height: 0 });
  };

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragStart) return;
    updateSelection(dragStart, getPoint(event));
  };

  const finishSelection = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragStart) return;
    const nextSelection = updateSelection(dragStart, getPoint(event));
    setDragStart(null);
    if (nextSelection.width > 8 && nextSelection.height > 8) {
      onOpenTask();
    }
  };

  const closeTask = () => {
    setSelection(null);
    onCloseTask();
  };

  const captureSelectionThumbnail = async (rect: SelectionRect) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return undefined;
    }

    const metrics = getRenderedMediaMetrics(video);
    if (!metrics) {
      return undefined;
    }

    const cropLeft = Math.max(metrics.offsetX, rect.x);
    const cropTop = Math.max(metrics.offsetY, rect.y);
    const cropRight = Math.min(metrics.offsetX + metrics.renderedWidth, rect.x + rect.width);
    const cropBottom = Math.min(metrics.offsetY + metrics.renderedHeight, rect.y + rect.height);
    if (cropRight <= cropLeft || cropBottom <= cropTop) {
      return undefined;
    }

    const sourceX = Math.round(((cropLeft - metrics.offsetX) / metrics.renderedWidth) * metrics.mediaWidth);
    const sourceY = Math.round(((cropTop - metrics.offsetY) / metrics.renderedHeight) * metrics.mediaHeight);
    const sourceWidth = Math.max(1, Math.round(((cropRight - cropLeft) / metrics.renderedWidth) * metrics.mediaWidth));
    const sourceHeight = Math.max(1, Math.round(((cropBottom - cropTop) / metrics.renderedHeight) * metrics.mediaHeight));
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = sourceWidth;
    cropCanvas.height = sourceHeight;
    const context = cropCanvas.getContext('2d');

    if (!context) return undefined;

    context.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      cropCanvas.width,
      cropCanvas.height,
    );

    return cropCanvas.toDataURL('image/png');
  };

  const attachRegion = async ({ comment, includedTypes }: { comment?: string; includedTypes: Array<'screenshot' | 'ocr'> }) => {
    const coordinates = selection ? { x: Math.round(selection.x), y: Math.round(selection.y), width: Math.round(selection.width), height: Math.round(selection.height) } : undefined;
    const thumbnailDataUrl = selection ? await captureSelectionThumbnail(selection) : undefined;
    onAttachRegion({
      id: `draft-region-${Date.now()}`,
      type: 'obd-region',
      title: 'Выбранная область',
      previewText: includedTypes.includes('ocr') ? 'OCR: Введите комментарий для клиента...' : 'Скриншот выбранной области',
      thumbnailDataUrl,
      comment,
      includedTypes,
      coordinates,
    });
    setSelection(null);
  };

  const mapVideoPointToRemote = (event: ReactMouseEvent<HTMLVideoElement>) => mapClientPointToRemote(event.currentTarget, event.clientX, event.clientY, remoteScreenWidth, remoteScreenHeight);

  const scheduleRemoteMove = (point: { x: number; y: number }) => {
    pendingMoveRef.current = point;
    if (moveTimerRef.current !== null) {
      return;
    }

    const elapsed = performance.now() - lastMoveAtRef.current;
    const delay = Math.max(0, REMOTE_MOUSE_MOVE_INTERVAL_MS - elapsed);
    moveTimerRef.current = window.setTimeout(() => {
      moveTimerRef.current = null;
      const nextPoint = pendingMoveRef.current;
      pendingMoveRef.current = null;
      if (!nextPoint) {
        return;
      }
      lastMoveAtRef.current = performance.now();
      void Promise.resolve(onRemoteMouseCommand('mouse.move', nextPoint.x, nextPoint.y)).catch(() => undefined);
    }, delay);
  };

  const handleRemoteMouseMove = (event: ReactMouseEvent<HTMLVideoElement>) => {
    if (event.ctrlKey || dragStart || !stream) {
      return;
    }
    const remotePoint = mapVideoPointToRemote(event);
    if (!remotePoint) {
      return;
    }
    lastRemotePointRef.current = remotePoint;
    scheduleRemoteMove(remotePoint);
  };

  const handleRemoteMouseDown = (event: ReactMouseEvent<HTMLVideoElement>) => {
    if (event.ctrlKey || dragStart || !stream) {
      return;
    }
    const remotePoint = mapVideoPointToRemote(event);
    if (!remotePoint) {
      return;
    }
    event.preventDefault();
    pressedRef.current = true;
    lastRemotePointRef.current = remotePoint;
    void Promise.resolve(onRemoteMouseCommand('mouse.down', remotePoint.x, remotePoint.y)).catch(() => undefined);
  };

  const handleRemoteMouseUp = (event: ReactMouseEvent<HTMLVideoElement>) => {
    if (event.ctrlKey || dragStart || !stream || !pressedRef.current) {
      return;
    }
    const remotePoint = mapVideoPointToRemote(event) ?? lastRemotePointRef.current;
    if (!remotePoint) {
      return;
    }
    event.preventDefault();
    pressedRef.current = false;
    lastRemotePointRef.current = remotePoint;
    void Promise.resolve(onRemoteMouseCommand('mouse.up', remotePoint.x, remotePoint.y)).catch(() => undefined);
  };

  const handleRemoteMouseLeave = () => {
    setObdActive(false);
    setDragStart(null);
    if (pressedRef.current && lastRemotePointRef.current) {
      pressedRef.current = false;
      void Promise.resolve(onRemoteMouseCommand('mouse.up', lastRemotePointRef.current.x, lastRemotePointRef.current.y)).catch(() => undefined);
    }
  };

  return (
    <div
      ref={screenRef}
      tabIndex={0}
      className={`relative h-full w-full min-w-0 overflow-hidden bg-slate-900 outline-none ${fullscreen ? 'rounded-none border-0 shadow-none' : 'rounded-2xl border-[6px] border-slate-900 shadow-soft'} ${obdActive ? 'ring-2 ring-blue-400' : ''}`}
      onMouseEnter={(event) => {
        setObdActive(true);
        event.currentTarget.focus();
      }}
      onMouseLeave={handleRemoteMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={finishSelection}
    >
      {stream ? (
        <div className="relative grid h-full min-h-0 min-w-0 place-items-center bg-black text-slate-100">
          <video
            id="obdScreen"
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-contain"
            onMouseMove={handleRemoteMouseMove}
            onMouseDown={handleRemoteMouseDown}
            onMouseUp={handleRemoteMouseUp}
          />
          <div data-html2canvas-ignore className="pointer-events-none absolute right-3 top-3 rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-soft">{streamLabel}</div>
        </div>
      ) : (
        <div className="grid h-full min-h-0 min-w-0 place-items-center bg-black text-slate-100">
          <div className="flex max-w-md flex-col items-center gap-4 px-6 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <div className="space-y-2">
              <p className="text-base font-semibold text-white">Загрузка удалённого экрана</p>
              <p className="text-sm text-slate-400">Ожидаем подключение OBS Virtual Camera.</p>
            </div>
          </div>
        </div>
      )}
      {streamError ? <div data-html2canvas-ignore className="pointer-events-none absolute right-3 top-3 z-20 max-w-md rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-soft">OBS Virtual Camera: {streamError}</div> : null}
      {selection ? (
        <div
          ref={selectionRef}
          data-html2canvas-ignore
          className="pointer-events-none absolute z-20 rounded-lg border-2 border-dashed border-blue-500 bg-blue-500/10"
        />
      ) : null}
      {obdActive ? <div data-html2canvas-ignore className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-lg bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-white shadow-soft backdrop-blur">OBD активен · Ctrl + мышь — выделить область</div> : null}
      {regionVisible && !taskOpen && !selection ? <RegionContextMenu onOpenTask={onOpenTask} onToast={onToast} /> : null}
      {taskOpen ? <div data-html2canvas-ignore><RegionTaskPopover anchorRect={selection} onClose={closeTask} onAttach={attachRegion} /></div> : null}
    </div>
  );
}

function getRenderedMediaMetrics(element: HTMLVideoElement) {
  const mediaWidth = element.videoWidth;
  const mediaHeight = element.videoHeight;
  if (!mediaWidth || !mediaHeight || !element.clientWidth || !element.clientHeight) {
    return null;
  }

  const scale = Math.min(element.clientWidth / mediaWidth, element.clientHeight / mediaHeight);
  const renderedWidth = mediaWidth * scale;
  const renderedHeight = mediaHeight * scale;

  return {
    mediaWidth,
    mediaHeight,
    renderedWidth,
    renderedHeight,
    offsetX: (element.clientWidth - renderedWidth) / 2,
    offsetY: (element.clientHeight - renderedHeight) / 2,
  };
}

function mapClientPointToRemote(element: HTMLVideoElement, clientX: number, clientY: number, remoteScreenWidth?: number, remoteScreenHeight?: number) {
  const metrics = getRenderedMediaMetrics(element);
  if (!metrics) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const imageX = clientX - rect.left - metrics.offsetX;
  const imageY = clientY - rect.top - metrics.offsetY;

  if (imageX < 0 || imageY < 0 || imageX > metrics.renderedWidth || imageY > metrics.renderedHeight) {
    return null;
  }

  const targetWidth = remoteScreenWidth && remoteScreenWidth > 0 ? remoteScreenWidth : metrics.mediaWidth;
  const targetHeight = remoteScreenHeight && remoteScreenHeight > 0 ? remoteScreenHeight : metrics.mediaHeight;

  return {
    x: Math.max(0, Math.min(targetWidth - 1, Math.round((imageX / metrics.renderedWidth) * targetWidth))),
    y: Math.max(0, Math.min(targetHeight - 1, Math.round((imageY / metrics.renderedHeight) * targetHeight))),
  };
}
