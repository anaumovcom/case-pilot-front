import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { ObdStatus } from '../../services';
import type { Attachment } from '../../types';
import { MockRemoteScreen } from './MockRemoteScreen';

const OBD_SOURCE_DEVICE_ID_KEY = 'casepilot-obd-source-device-id';

type Props = {
  regionVisible: boolean;
  taskOpen: boolean;
  onOpenTask: () => void;
  onCloseTask: () => void;
  onAttachRegion: (attachment: Attachment) => void;
  onToast: (title: string, description?: string) => void;
  onObdMouseCommand: (type: 'mouse.move' | 'mouse.down' | 'mouse.up', x: number, y: number) => void | Promise<void>;
  onObdWheelCommand: (x: number, y: number, deltaX: number, deltaY: number) => void | Promise<void>;
  onObdKeyboardCommand: (type: 'keyboard.type' | 'keyboard.key' | 'keyboard.hotkey', payload: Record<string, unknown>) => void | Promise<void>;
  fullscreen?: boolean;
  onToggleFullscreen: () => void;
  obdStatus: ObdStatus | null;
  onConnectionChange: (online: boolean) => void;
};

export function ObdWorkspace({ regionVisible, taskOpen, onOpenTask, onCloseTask, onAttachRegion, onToast, onObdMouseCommand, onObdWheelCommand, onObdKeyboardCommand, fullscreen = false, onToggleFullscreen, onConnectionChange }: Props) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [cameraPermissionState, setCameraPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported' | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(() => window.localStorage.getItem(OBD_SOURCE_DEVICE_ID_KEY));
  const [connectPending, setConnectPending] = useState(false);

  const findObsVirtualCameraDevice = (devices: MediaDeviceInfo[]) => devices.find((device) => device.kind === 'videoinput' && /obs\s*virtual\s*camera/i.test(device.label))
    ?? devices.find((device) => device.kind === 'videoinput' && /(obs.*camera|virtual\s*camera)/i.test(device.label));

  useEffect(() => {
    let cancelled = false;

    const loadPermissionState = async () => {
      if (!('permissions' in navigator) || !navigator.permissions) {
        setCameraPermissionState('unsupported');
        return;
      }

      try {
        const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (cancelled) {
          return;
        }

        const applyState = () => setCameraPermissionState(status.state as 'prompt' | 'granted' | 'denied');
        applyState();
        status.onchange = applyState;
      } catch {
        if (!cancelled) {
          setCameraPermissionState('unsupported');
        }
      }
    };

    void loadPermissionState();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => {
    setStream((currentStream) => {
      currentStream?.getTracks().forEach((track) => track.stop());
      return null;
    });
  }, []);

  async function connectObsVirtualCamera(forceRediscover = false, silent = false) {
    if (!navigator.mediaDevices?.getUserMedia || !navigator.mediaDevices.enumerateDevices) {
      const message = 'Этот браузер не поддерживает прямой видеозахват камеры.';
      setStreamError(message);
      if (!silent) {
        onToast('OBS Virtual Camera недоступна', message);
      }
      return;
    }

    setConnectPending(true);
    setStreamError(null);
    let bootstrapStream: MediaStream | null = null;

    try {
      let nextDeviceId = forceRediscover ? null : deviceId;
      if (!nextDeviceId) {
        bootstrapStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const obsCamera = findObsVirtualCameraDevice(devices);
        if (!obsCamera?.deviceId) {
          throw new Error('OBS Virtual Camera не найдена. Запустите Virtual Camera в OBS и повторите.');
        }
        nextDeviceId = obsCamera.deviceId;
      }

      bootstrapStream?.getTracks().forEach((track) => track.stop());
      bootstrapStream = null;

      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: nextDeviceId },
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          frameRate: { ideal: 30, min: 5 },
        },
        audio: false,
      });

      nextStream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setStream((currentStream) => {
            currentStream?.getTracks().forEach((currentTrack) => currentTrack.stop());
            return null;
          });
          setStreamError('OBS Virtual Camera остановлена или отключена.');
        };
      });

      setStream((currentStream) => {
        currentStream?.getTracks().forEach((track) => track.stop());
        return nextStream;
      });
      setDeviceId(nextDeviceId);
      window.localStorage.setItem(OBD_SOURCE_DEVICE_ID_KEY, nextDeviceId);
      setStreamError(null);

      if (!silent) {
        onToast('OBS Virtual Camera подключена', 'Используем только локальный поток OBS Virtual Camera.');
      }
    } catch (reason) {
      bootstrapStream?.getTracks().forEach((track) => track.stop());
      setStream((currentStream) => {
        currentStream?.getTracks().forEach((track) => track.stop());
        return null;
      });

      const message = reason instanceof Error
        ? reason.name === 'NotAllowedError'
          ? 'Браузер запретил доступ к камере. Разрешите доступ к камере для http://localhost:5173 и повторите.'
          : reason.message
        : 'Не удалось подключить OBS Virtual Camera';

      setStreamError(message);
      if (!silent) {
        onToast('OBS Virtual Camera недоступна', message);
      }
    } finally {
      setConnectPending(false);
    }
  }

  useEffect(() => {
    if (!deviceId || stream || connectPending || cameraPermissionState !== 'granted') {
      return;
    }

    void connectObsVirtualCamera(false, true);
  }, [cameraPermissionState, connectPending, deviceId, stream]);

  const online = Boolean(stream);

  useEffect(() => {
    onConnectionChange(online);
    return () => onConnectionChange(false);
  }, [online, onConnectionChange]);

  const sourceHint = stream
    ? 'Источник: OBS Virtual Camera'
    : cameraPermissionState === 'denied'
      ? 'Доступ к камере запрещён браузером. Поэтому OBS Virtual Camera не может включиться.'
      : 'Нажмите OBS Virtual Camera после запуска Virtual Camera в OBS.';

  return (
    <section className={`relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white ${fullscreen ? 'h-full border-0 p-0 shadow-none' : 'rounded-2xl border border-slate-200 p-4 shadow-sm'}`}>
      {!fullscreen ? (
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-950">Удалённый экран OBD</h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'}`} /> {online ? 'OBS Camera активна' : 'OBS Camera не подключена'}</span>
            <span className="hidden max-w-[220px] truncate md:inline">OBS Virtual Camera only</span>
            <button
              className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${cameraPermissionState === 'denied' ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              onClick={() => void connectObsVirtualCamera(true)}
              disabled={connectPending}
            >
              {connectPending ? 'Подключаем OBS Camera...' : cameraPermissionState === 'denied' ? 'OBS Camera: доступ запрещён' : 'OBS Virtual Camera'}
            </button>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={onToggleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
              Fullscreen
            </button>
          </div>
        </div>
      ) : (
        <button
          className="absolute right-4 top-4 z-40 inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-slate-950/70 px-3 text-sm font-medium text-white shadow-soft backdrop-blur transition hover:bg-slate-900"
          onClick={onToggleFullscreen}
        >
          <Minimize2 className="h-4 w-4" />
          Выйти
        </button>
      )}
      {!fullscreen ? <div className="mb-2 text-xs text-slate-500">{sourceHint}</div> : null}
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <MockRemoteScreen
          fullscreen={fullscreen}
          regionVisible={regionVisible}
          taskOpen={taskOpen}
          onOpenTask={onOpenTask}
          onCloseTask={onCloseTask}
          onAttachRegion={onAttachRegion}
          onToast={onToast}
          onRemoteMouseCommand={onObdMouseCommand}
          onRemoteWheel={onObdWheelCommand}
          onRemoteKeyboardCommand={onObdKeyboardCommand}
          stream={stream}
          streamError={streamError}
          streamLabel="OBS Virtual Camera"
        />
      </div>
    </section>
  );
}
