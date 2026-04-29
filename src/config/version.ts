import packageJson from '../../package.json';

const HOT_RELOAD_KEY = 'casepilot.hotReloadCount';
const HOT_RELOAD_EVENT = 'casepilot:hotReloadVersion';

type VersionWindow = Window & {
  __casepilotHotReloadListenerAttached?: boolean;
};

function readHotReloadCount() {
  if (typeof window === 'undefined') {
    return 0;
  }

  const raw = window.sessionStorage.getItem(HOT_RELOAD_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function writeHotReloadCount(nextValue: number) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(HOT_RELOAD_KEY, String(nextValue));
  window.dispatchEvent(new CustomEvent(HOT_RELOAD_EVENT, { detail: nextValue }));
}

if (import.meta.hot && typeof window !== 'undefined') {
  const versionWindow = window as VersionWindow;
  if (!versionWindow.__casepilotHotReloadListenerAttached) {
    versionWindow.__casepilotHotReloadListenerAttached = true;
    import.meta.hot.on('vite:afterUpdate', () => {
      writeHotReloadCount(readHotReloadCount() + 1);
    });
  }
}

export function formatAppVersion() {
  const baseVersion = packageJson.version;
  const hotReloadCount = readHotReloadCount();
  return import.meta.hot ? `v${baseVersion}-dev.${hotReloadCount}` : `v${baseVersion}`;
}

export function subscribeAppVersion(onChange: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener(HOT_RELOAD_EVENT, onChange);
  return () => window.removeEventListener(HOT_RELOAD_EVENT, onChange);
}