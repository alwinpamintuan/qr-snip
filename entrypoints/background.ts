import { isAllowedOpenUrl } from '../src/core/result';
import { isOpenResultMessage } from '../src/core/messages';

export default defineBackground(() => {
  browser.action.onClicked.addListener((tab) => {
    void beginSnip(tab);
  });

  browser.runtime.onMessage.addListener((message: unknown) => {
    if (!isOpenResultMessage(message) || !isAllowedOpenUrl(message.url)) return undefined;
    return browser.tabs.create({ url: message.url });
  });
});

async function beginSnip(tab: Browser.tabs.Tab): Promise<void> {
  if (tab.id === undefined || tab.windowId === undefined) {
    await showActionError(tab.id, 'QR Snip cannot access this tab.');
    return;
  }

  try {
    const screenshotUrl = await browser.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['/content-scripts/snipper.js'],
    });
    await browser.tabs.sendMessage(tab.id, { type: 'START_CAPTURE', screenshotUrl });
  } catch {
    await showActionError(tab.id, 'This browser page cannot be scanned.');
  }
}

async function showActionError(tabId: number | undefined, title: string): Promise<void> {
  if (tabId === undefined) return;
  await Promise.all([
    browser.action.setBadgeBackgroundColor({ tabId, color: '#BA1A1A' }),
    browser.action.setBadgeText({ tabId, text: '!', }),
    browser.action.setTitle({ tabId, title }),
  ]);
  setTimeout(() => {
    void browser.action.setBadgeText({ tabId, text: '' });
    void browser.action.setTitle({ tabId, title: 'Scan a QR code' });
  }, 3000);
}
