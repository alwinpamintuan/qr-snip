import { isAllowedOpenUrl } from '../src/core/result';
import { isOpenResultMessage } from '../src/core/messages';
import { createI18n, type MessageKey, type Translator } from '../src/i18n/messages';
import { loadSettings } from '../src/application/settings-store';

type ActivationFailure =
  | 'restricted-page'
  | 'permission-expired'
  | 'capture-failed'
  | 'injection-failed'
  | 'navigation-race'
  | 'tab-closed'
  | 'extension-invalidated';

const FAILURE_MESSAGE_KEYS: Record<ActivationFailure, MessageKey> = {
  'restricted-page': 'failureRestrictedPage',
  'permission-expired': 'failurePermissionExpired',
  'capture-failed': 'failureCaptureFailed',
  'injection-failed': 'failureInjectionFailed',
  'navigation-race': 'failureNavigationRace',
  'tab-closed': 'failureTabClosed',
  'extension-invalidated': 'failureExtensionInvalidated',
};

export default defineBackground(() => {
  const activeInvocations = new Map<number, string>();
  const t = createI18n(browser.i18n).t;

  browser.action.onClicked.addListener((tab) => {
    void beginSnip(tab, activeInvocations, t);
  });

  browser.runtime.onInstalled.addListener((details) => {
    void handleInstalled(details.reason);
  });

  browser.runtime.onMessage.addListener((message: unknown) => {
    if (!isOpenResultMessage(message) || !isAllowedOpenUrl(message.url)) return undefined;
    return browser.tabs.create({ url: message.url });
  });
});

async function beginSnip(
  tab: Browser.tabs.Tab,
  activeInvocations: Map<number, string>,
  t: Translator,
): Promise<void> {
  if (tab.id === undefined || tab.windowId === undefined) {
    await showActionError(tab.id, 'tab-closed', t);
    return;
  }
  const tabId = tab.id;
  const invocationId = crypto.randomUUID();
  activeInvocations.set(tabId, invocationId);

  if (isRestrictedUrl(tab.url)) {
    await showActionError(tabId, 'restricted-page', t);
    return;
  }

  const [captureResult, contentResult, settingsResult] = await Promise.allSettled([
    browser.tabs.captureVisibleTab(tab.windowId, { format: 'png' }),
    ensureContentScript(tabId),
    loadSettings(browser.storage.local),
  ]);
  if (captureResult.status === 'rejected') {
    await showActionError(tabId, categorizeApiError(captureResult.reason, 'capture-failed'), t);
    return;
  }
  if (contentResult.status === 'rejected') {
    await showActionError(tabId, categorizeApiError(contentResult.reason, 'injection-failed'), t);
    return;
  }
  const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : undefined;
  if (!settings) {
    await showActionError(tabId, 'extension-invalidated', t);
    return;
  }
  if (activeInvocations.get(tabId) !== invocationId) return;
  if (!await tabIsCurrent(tabId, tab.url)) {
    await showActionError(tabId, 'navigation-race', t);
    return;
  }

  try {
    const response = await browser.tabs.sendMessage(tabId, {
      type: 'START_CAPTURE',
      invocationId,
      screenshotUrl: captureResult.value,
      settings,
    });
    if (response?.invocationId !== invocationId) await showActionError(tabId, 'navigation-race', t);
  } catch (error) {
    await showActionError(tabId, categorizeApiError(error, 'navigation-race'), t);
  }
}

async function handleInstalled(reason: string): Promise<void> {
  await loadSettings(browser.storage.local);
  if (reason !== 'install') return;
  await browser.tabs.create({ url: browser.runtime.getURL('/options.html?onboarding=1') });
}

async function ensureContentScript(tabId: number): Promise<void> {
  try {
    const response = await browser.tabs.sendMessage(tabId, { type: 'PROBE_CONTENT' });
    if (response?.ready === true) return;
  } catch {
    // A missing receiver is expected on the first activation.
  }
  await browser.scripting.executeScript({
    target: { tabId },
    files: ['/content-scripts/snipper.js'],
  });
}

async function tabIsCurrent(tabId: number, initialUrl: string | undefined): Promise<boolean> {
  try {
    const current = await browser.tabs.get(tabId);
    return current.url === initialUrl;
  } catch {
    return false;
  }
}

function isRestrictedUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /^(about:|chrome:|edge:|brave:|opera:|vivaldi:|view-source:|moz-extension:|chrome-extension:)/i.test(url)
    || /^https:\/\/(chromewebstore\.google\.com|addons\.mozilla\.org)\//i.test(url);
}

function categorizeApiError(error: unknown, fallback: ActivationFailure): ActivationFailure {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('context invalidated') || message.includes('extension context')) return 'extension-invalidated';
  if (message.includes('no tab') || message.includes('tab was closed')) return 'tab-closed';
  if (message.includes('permission') || message.includes('active tab')) return 'permission-expired';
  if (message.includes('cannot access') || message.includes('restricted')) return 'restricted-page';
  return fallback;
}

async function showActionError(tabId: number | undefined, failure: ActivationFailure, t: Translator): Promise<void> {
  if (tabId === undefined) return;
  const title = t(FAILURE_MESSAGE_KEYS[failure]);
  try {
    await Promise.all([
      browser.action.setBadgeBackgroundColor({ tabId, color: '#BA1A1A' }),
      browser.action.setBadgeText({ tabId, text: '!' }),
      browser.action.setTitle({ tabId, title }),
    ]);
    setTimeout(() => {
      void browser.action.setBadgeText({ tabId, text: '' });
      void browser.action.setTitle({ tabId, title: t('actionTitle') });
    }, 5000);
  } catch {
    // The recovery hint cannot be displayed after the tab or extension context disappears.
  }
}
