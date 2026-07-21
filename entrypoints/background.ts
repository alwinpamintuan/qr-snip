import { isAllowedOpenUrl } from '../src/core/result';
import { isOpenResultMessage } from '../src/core/messages';

type ActivationFailure =
  | 'restricted-page'
  | 'permission-expired'
  | 'capture-failed'
  | 'injection-failed'
  | 'navigation-race'
  | 'tab-closed'
  | 'extension-invalidated';

const FAILURE_TITLES: Record<ActivationFailure, string> = {
  'restricted-page': 'This browser-owned page cannot be scanned. Open the QR code in a regular tab and try again.',
  'permission-expired': 'Page access expired. Click QR Snip again to retry.',
  'capture-failed': 'The visible screen could not be captured. Reload the page and try again.',
  'injection-failed': 'QR Snip could not start on this page. Reload it or open the content in a regular tab.',
  'navigation-race': 'The page changed while QR Snip was starting. Try again on the current page.',
  'tab-closed': 'The tab closed before QR Snip could start.',
  'extension-invalidated': 'QR Snip was updated. Reload the page and try again.',
};

export default defineBackground(() => {
  const activeInvocations = new Map<number, string>();

  browser.action.onClicked.addListener((tab) => {
    void beginSnip(tab, activeInvocations);
  });

  browser.runtime.onMessage.addListener((message: unknown) => {
    if (!isOpenResultMessage(message) || !isAllowedOpenUrl(message.url)) return undefined;
    return browser.tabs.create({ url: message.url });
  });
});

async function beginSnip(tab: Browser.tabs.Tab, activeInvocations: Map<number, string>): Promise<void> {
  if (tab.id === undefined || tab.windowId === undefined) {
    await showActionError(tab.id, 'tab-closed');
    return;
  }
  const tabId = tab.id;
  const invocationId = crypto.randomUUID();
  activeInvocations.set(tabId, invocationId);

  if (isRestrictedUrl(tab.url)) {
    await showActionError(tabId, 'restricted-page');
    return;
  }

  let screenshotUrl: string;
  try {
    screenshotUrl = await browser.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  } catch (error) {
    await showActionError(tabId, categorizeApiError(error, 'capture-failed'));
    return;
  }
  if (activeInvocations.get(tabId) !== invocationId) return;
  if (!await tabIsCurrent(tabId, tab.url)) {
    await showActionError(tabId, 'navigation-race');
    return;
  }

  try {
    await browser.scripting.executeScript({
      target: { tabId },
      files: ['/content-scripts/snipper.js'],
    });
  } catch (error) {
    await showActionError(tabId, categorizeApiError(error, 'injection-failed'));
    return;
  }
  if (activeInvocations.get(tabId) !== invocationId) return;

  try {
    const response = await browser.tabs.sendMessage(tabId, { type: 'START_CAPTURE', invocationId, screenshotUrl });
    if (response?.invocationId !== invocationId) await showActionError(tabId, 'navigation-race');
  } catch (error) {
    await showActionError(tabId, categorizeApiError(error, 'navigation-race'));
  }
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

async function showActionError(tabId: number | undefined, failure: ActivationFailure): Promise<void> {
  if (tabId === undefined) return;
  const title = FAILURE_TITLES[failure];
  try {
    await Promise.all([
      browser.action.setBadgeBackgroundColor({ tabId, color: '#BA1A1A' }),
      browser.action.setBadgeText({ tabId, text: '!' }),
      browser.action.setTitle({ tabId, title }),
    ]);
    setTimeout(() => {
      void browser.action.setBadgeText({ tabId, text: '' });
      void browser.action.setTitle({ tabId, title: 'Scan a QR code' });
    }, 5000);
  } catch {
    // The recovery hint cannot be displayed after the tab or extension context disappears.
  }
}
