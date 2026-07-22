import { SnipperApplication } from '../src/application/snipper-application';
import { isProbeContentMessage, isStartCaptureMessage } from '../src/core/messages';
import { createI18n } from '../src/i18n/messages';
import { SnipperView } from '../src/ui/snipper-view';

type ContentScriptGlobal = typeof globalThis & {
  __qrSnipApplication?: SnipperApplication;
};

export default defineContentScript({
  registration: 'runtime',
  main() {
    const contentGlobal = globalThis as ContentScriptGlobal;
    if (contentGlobal.__qrSnipApplication) return;

    const i18n = createI18n(browser.i18n);
    contentGlobal.__qrSnipApplication = new SnipperApplication(new SnipperView(i18n), i18n.t);
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (isProbeContentMessage(message)) return Promise.resolve({ ready: true });
      if (!isStartCaptureMessage(message)) return undefined;
      contentGlobal.__qrSnipApplication?.start(message.invocationId, message.screenshotUrl, message.settings);
      return Promise.resolve({ started: true, invocationId: message.invocationId });
    });
  },
});
