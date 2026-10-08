import type { Release, SyncResult } from '@hotcodepush/cordova-code-push';

// Change it, build, release: the label is how you see the update land.
const VERSION = 'v1';

const versionHeading = getElement('version');
const currentReleaseText = getElement('current-release');
const deviceIdText = getElement('device-id');
const lastSyncText = getElement('last-sync');
const lastRollbackText = getElement('last-rollback');
const syncButton = getElement<HTMLButtonElement>('sync-button');
const debugButton = getElement<HTMLButtonElement>('debug-button');

versionHeading.textContent = VERSION;
// The plugin is on `window.HotCodePush` once Cordova has loaded it, which `deviceready` says.
document.addEventListener('deviceready', () => {
  // Fired once, on the start that follows a rollback: the release that failed and why.
  void HotCodePush.addListener('updateRolledBack', event => {
    lastRollbackText.textContent = `from ${resolveReleaseText(event.from)} · ${event.reason}`;
  });
  syncButton.addEventListener('click', () => void syncNow());
  debugButton.addEventListener(
    'click',
    () => void HotCodePush.showDebugScreen(),
  );
  void showState();
});

async function showState(): Promise<void> {
  try {
    const [state, device] = await Promise.all([
      HotCodePush.getState(),
      HotCodePush.getDevice(),
    ]);
    currentReleaseText.textContent = resolveReleaseText(state.currentRelease);
    deviceIdText.textContent = device.id;
    lastSyncText.textContent = state.lastCheck
      ? resolveResultText(state.lastCheck.result)
      : 'none yet';
  } catch (error) {
    currentReleaseText.textContent = resolveErrorText(error);
  }
}

async function syncNow(): Promise<void> {
  syncButton.disabled = true;
  lastSyncText.textContent = 'syncing…';
  try {
    const result = await HotCodePush.sync();
    await showState();
    lastSyncText.textContent = resolveResultText(result);
  } catch (error) {
    lastSyncText.textContent = resolveErrorText(error);
  } finally {
    syncButton.disabled = false;
  }
}

function resolveReleaseText(release: Release | null): string {
  return release ? `#${release.number} · ${release.bundleVersion}` : 'embedded';
}

function resolveResultText(result: SyncResult): string {
  switch (result.status) {
    case 'UP_TO_DATE':
      return 'UP_TO_DATE';
    case 'AVAILABLE':
      return `AVAILABLE · ${resolveReleaseText(result.release)}`;
    case 'DOWNLOADED':
      return `DOWNLOADED · ${resolveReleaseText(result.release)}, applies ${result.applyAt}`;
    case 'APPLIED':
      return `APPLIED · ${resolveReleaseText(result.release)}`;
    case 'SKIPPED':
      return `SKIPPED · ${result.reason}`;
    case 'FAILED':
      return `FAILED · ${result.reason}: ${result.message}`;
  }
}

function resolveErrorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`#${id} is missing from index.html`);
  }
  return element as T;
}
