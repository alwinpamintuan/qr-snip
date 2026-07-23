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
  'failureExtensionInvalidated', 'keyboardSelectionAction', 'keyboardSelectionShortcut',
  'keyboardSelectionHint',
  'keyboardSelectionStarted', 'selectionAnnouncement', 'galleryTitle', 'galleryEyebrow',
  'galleryHero', 'galleryDescription', 'galleryActions', 'galleryStatus',
  'galleryResultSurface', 'galleryReady', 'galleryPreview', 'galleryExampleResult',
  'decoderDiagnosticsSummary', 'optionsTitle', 'onboardingTitle', 'onboardingIntro', 'onboardingEducationLabel',
  'onboardingActivateTitle', 'onboardingActivateDescription', 'onboardingPrivacyTitle',
  'onboardingPrivacyDescription', 'onboardingPreviewTitle', 'onboardingPreviewDescription',
  'onboardingRestrictedTitle', 'onboardingRestrictedDescription', 'themeSettingLabel', 'themeSettingDescription', 'themeSystemOption',
  'themeLightOption', 'themeDarkOption', 'closeAfterCopyLabel', 'closeAfterCopyDescription',
  'decoderDiagnosticsLabel', 'decoderDiagnosticsDescription', 'settingsPrivacyTitle',
  'settingsPrivacyDescription', 'resetSettingsAction', 'settingsSavedStatus', 'settingsResetStatus',
  'resultTypeWifi', 'resultTypeContact', 'resultTypeCalendar', 'resultTypeGeo',
  'fieldNetworkName', 'fieldSecurity', 'fieldHiddenNetwork', 'fieldCredentials', 'fieldName',
  'fieldOrganization', 'fieldEmail', 'fieldPhone', 'fieldEvent', 'fieldStarts', 'fieldEnds',
  'fieldLocation', 'fieldLatitude', 'fieldLongitude', 'fieldAltitude', 'fieldPlace',
  'fieldValueYes', 'fieldValueNo', 'passwordHiddenValue', 'revealPasswordAction',
  'hidePasswordAction', 'copyPasswordAction',
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
