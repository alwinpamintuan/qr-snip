export const MESSAGE_KEYS = [
  'extensionName', 'extensionDescription', 'actionTitle', 'commandDescription',
  'applicationLabel', 'preparingTitle', 'cancelSnipLabel', 'selectionLabel',
  'destinationLabel', 'scannedValueLabel', 'resolvedDestinationLabel', 'riskHeading',
  'dragInstruction', 'cancelHint', 'scanningTitle', 'localProcessingHint',
  'resultFoundTitle', 'resultSubtitle', 'longValueSuffix', 'checkDestinationTitle',
  'warningSubtitle', 'warningSignalSingular', 'warningSignalPlural', 'riskDisclaimer',
  'scanAnotherAction', 'copyAction', 'copyInsteadAction', 'openAction', 'openLinkAction',
  'openAnywayAction', 'cancelAction', 'tryAgainAction', 'tryWiderTitle', 'notFoundMessage',
  'resourceLimitMessage', 'imageErrorMessage', 'selectionHelp', 'copiedToast', 'copyFailedToast',
  'selectionTooSmallToast', 'displayLimitedNotice', 'resultTypeUrl', 'resultTypeEmail',
  'resultTypePhone', 'resultTypeText', 'riskUnencrypted', 'riskCredentials',
  'riskInternationalizedDomain', 'riskIpAddress', 'riskLocalNetwork', 'riskUnusualPort',
  'failureRestrictedPage', 'failurePermissionExpired', 'failureCaptureFailed',
  'failureInjectionFailed', 'failureNavigationRace', 'failureTabClosed',
  'failureExtensionInvalidated', 'keyboardSelectionAction', 'keyboardSelectionHint',
  'keyboardSelectionStarted', 'selectionAnnouncement', 'galleryTitle', 'galleryEyebrow',
  'galleryHero', 'galleryDescription', 'galleryActions', 'galleryStatus',
  'galleryResultSurface', 'galleryReady', 'galleryPreview', 'galleryExampleResult',
] as const;

export type MessageKey = typeof MESSAGE_KEYS[number];
export type MessageSubstitutions = string | readonly string[];
export type Translator = (key: MessageKey, substitutions?: MessageSubstitutions) => string;

export type MessageCatalog = Readonly<{
  getMessage: (key: string, substitutions?: string | string[]) => string;
}>;

export type I18n = Readonly<{
  direction: 'ltr' | 'rtl';
  t: Translator;
}>;

export function createI18n(catalog: MessageCatalog | typeof browser.i18n): I18n {
  const getMessage = catalog.getMessage.bind(catalog) as MessageCatalog['getMessage'];
  return {
    direction: getMessage('@@bidi_dir') === 'rtl' ? 'rtl' : 'ltr',
    t: (key, substitutions) => {
      const normalized = typeof substitutions === 'string'
        ? substitutions
        : substitutions === undefined ? undefined : [...substitutions];
      const message = getMessage(key, normalized);
      if (!message) throw new Error(`Missing localized message: ${key}`);
      return message;
    },
  };
}
