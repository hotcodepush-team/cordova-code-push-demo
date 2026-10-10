import type {
  GetChannelResult,
  Release,
  SetChannelOptions,
  SyncResult,
} from '@hotcodepush/cordova-code-push';

// Change it, build, release: the label is how you see the update land.
const VERSION = 'v1';
// No channel of the demo's app is discoverable by this name, so a sync on it fails with CHANNEL_UNKNOWN.
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
  setChannelButton.addEventListener(
    'click',
    () => void switchChannel({ name: RUNTIME_CHANNEL_NAME }),
  );
  clearChannelButton.addEventListener('click', () => void switchChannel(null));
  // Both reload the page onto the bundle they leave running, which shows the outcome.
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
