import { SnipperApplication } from '../src/application/snipper-application';
import { isStartCaptureMessage } from '../src/core/messages';
import { SnipperView } from '../src/ui/snipper-view';

type ContentScriptGlobal = typeof globalThis & {
  __qrSnipApplication?: SnipperApplication;
};

export default defineContentScript({
  registration: 'runtime',
  main() {
    const contentGlobal = globalThis as ContentScriptGlobal;
    if (contentGlobal.__qrSnipApplication) return;

    contentGlobal.__qrSnipApplication = new SnipperApplication(new SnipperView());
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (!isStartCaptureMessage(message)) return undefined;
      contentGlobal.__qrSnipApplication?.start(message.screenshotUrl);
      return Promise.resolve({ started: true });
    });
  },
});

