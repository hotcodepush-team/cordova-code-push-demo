import type {
  GetChannelResult,
  Release,
  SetChannelOptions,
  SyncResult,
} from '@hotcodepush/cordova-code-push';

// Change this label, build and release it to see the update land.
const VERSION = 'v1';
// The demo app has no discoverable channel with this name, so a sync on it fails with channel_unknown.
const RUNTIME_CHANNEL_NAME = 'beta';
const ROLLBACK_REASON = 'Roll back button';

const versionHeading = getElement('version');
const currentReleaseText = getElement('current-release');
const deviceIdText = getElement('device-id');
const channelText = getElement('channel');
const lastSyncText = getElement('last-sync');
const lastRollbackText = getElement('last-rollback');
const syncButton = getElement<HTMLButtonElement>('sync-button');
const debugButton = getElement<HTMLButtonElement>('debug-button');
const setChannelButton = getElement<HTMLButtonElement>('set-channel-button');
const clearChannelButton = getElement<HTMLButtonElement>(
  'clear-channel-button',
);
const rollbackButton = getElement<HTMLButtonElement>('rollback-button');
const clearUpdatesButton = getElement<HTMLButtonElement>(
  'clear-updates-button',
);

versionHeading.textContent = VERSION;
// Cordova fires `deviceready` once the plugin is loaded onto `window.HotCodePush`.
document.addEventListener('deviceready', () => {
  // The SDK fires this once, on the first start after a rollback.
  void HotCodePush.addListener('updateRolledBack', event => {
    lastRollbackText.textContent = `from ${resolveReleaseText(event.fromRelease)} · ${event.reason}`;
  });
  syncButton.addEventListener('click', () => void syncNow());
  debugButton.addEventListener(
    'click',
    () => void HotCodePush.showDebugScreen(),
  );
  setChannelButton.addEventListener(
    'click',
    () => void switchChannel({ name: RUNTIME_CHANNEL_NAME }),
  );
  clearChannelButton.addEventListener('click', () => void switchChannel(null));
  // Rolling back and clearing updates both reload the page, so the new page shows the outcome.
  rollbackButton.addEventListener(
    'click',
    () =>
      void runShowingError(
        () => HotCodePush.rollbackUpdate({ reason: ROLLBACK_REASON }),
        currentReleaseText,
      ),
  );
  clearUpdatesButton.addEventListener(
    'click',
    () =>
      void runShowingError(
        () => HotCodePush.clearUpdates(),
        currentReleaseText,
      ),
  );
  void showState();
});

async function showState(): Promise<void> {
  try {
    const [state, device, channel] = await Promise.all([
      HotCodePush.getState(),
      HotCodePush.getDevice(),
      HotCodePush.getChannel(),
    ]);
    currentReleaseText.textContent = resolveReleaseText(state.currentRelease);
    deviceIdText.textContent = device.id;
    channelText.textContent = resolveChannelText(channel);
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

async function switchChannel(options: SetChannelOptions): Promise<void> {
  await runShowingError(async () => {
    await HotCodePush.setChannel(options);
    channelText.textContent = resolveChannelText(
      await HotCodePush.getChannel(),
    );
  }, channelText);
}

async function runShowingError(
  action: () => Promise<void>,
  outcomeText: HTMLElement,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    outcomeText.textContent = resolveErrorText(error);
  }
}

function resolveChannelText(channel: GetChannelResult): string {
  return `${channel.name ?? channel.id ?? 'none'} · ${channel.source}`;
}

function resolveReleaseText(release: Release | null): string {
  return release ? `#${release.number} · ${release.bundleVersion}` : 'embedded';
}

function resolveResultText(result: SyncResult): string {
  switch (result.status) {
    case 'up_to_date':
      return 'up_to_date';
    case 'available':
      return `available · ${resolveReleaseText(result.release)}`;
    case 'downloaded':
      return `downloaded · ${resolveReleaseText(result.release)}, applies ${result.applyStrategy}`;
    case 'applied':
      return `applied · ${resolveReleaseText(result.release)}`;
    case 'skipped':
      return `skipped · ${result.reason}`;
    case 'failed':
      return `failed · ${result.reason}: ${result.message}`;
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
