import { createI18n } from '../../src/i18n/messages';
import { DEFAULT_SETTINGS, type Settings, type ThemePreference } from '../../src/core/settings';
import { loadSettings, resetSettings, saveSettings } from '../../src/application/settings-store';
import './style.css';

const i18n = createI18n(browser.i18n);
const t = i18n.t;
const app = document.querySelector<HTMLElement>('#app')!;
const isOnboarding = new URLSearchParams(location.search).get('onboarding') === '1';

document.title = t('optionsTitle');
document.documentElement.dir = i18n.direction;
app.innerHTML = `
  <header class="page-heading">
    <h1>${escapeHtml(t('optionsTitle'))}</h1>
    <span class="status" role="status" aria-live="polite"></span>
  </header>
  <main>
    ${isOnboarding ? educationMarkup() : ''}
    <section class="settings" aria-label="${escapeHtml(t('optionsTitle'))}">
      <label class="field select-field">
        <span><strong>${escapeHtml(t('themeSettingLabel'))}</strong><small>${escapeHtml(t('themeSettingDescription'))}</small></span>
        <select name="theme">
          <option value="system">${escapeHtml(t('themeSystemOption'))}</option>
          <option value="light">${escapeHtml(t('themeLightOption'))}</option>
          <option value="dark">${escapeHtml(t('themeDarkOption'))}</option>
        </select>
      </label>
      ${toggleMarkup('closeAfterCopy', t('closeAfterCopyLabel'), t('closeAfterCopyDescription'))}
      ${toggleMarkup('decoderDiagnostics', t('decoderDiagnosticsLabel'), t('decoderDiagnosticsDescription'))}
      <div class="privacy-note"><strong>${escapeHtml(t('settingsPrivacyTitle'))}</strong><span>${escapeHtml(t('settingsPrivacyDescription'))}</span></div>
      <button class="reset-button" type="button">${escapeHtml(t('resetSettingsAction'))}</button>
    </section>
  </main>`;

const theme = app.querySelector<HTMLSelectElement>('[name="theme"]')!;
const closeAfterCopy = app.querySelector<HTMLInputElement>('[name="closeAfterCopy"]')!;
const decoderDiagnostics = app.querySelector<HTMLInputElement>('[name="decoderDiagnostics"]')!;
const status = app.querySelector<HTMLElement>('.status')!;
let statusTimer: number | undefined;

void loadSettings(browser.storage.local).then(renderSettings);
theme.addEventListener('change', () => void persist());
closeAfterCopy.addEventListener('change', () => void persist());
decoderDiagnostics.addEventListener('change', () => void persist());
app.querySelector('.reset-button')?.addEventListener('click', () => {
  void resetSettings(browser.storage.local).then((settings) => {
    renderSettings(settings);
    showStatus(t('settingsResetStatus'));
  });
});

async function persist(): Promise<void> {
  const settings: Settings = {
    version: DEFAULT_SETTINGS.version,
    theme: theme.value as ThemePreference,
    closeAfterCopy: closeAfterCopy.checked,
    decoderDiagnostics: decoderDiagnostics.checked,
  };
  await saveSettings(browser.storage.local, settings);
  showStatus(t('settingsSavedStatus'));
}

function renderSettings(settings: Settings): void {
  theme.value = settings.theme;
  closeAfterCopy.checked = settings.closeAfterCopy;
  decoderDiagnostics.checked = settings.decoderDiagnostics;
  document.documentElement.dataset.theme = settings.theme;
}

function showStatus(message: string): void {
  status.textContent = message;
  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => { status.textContent = ''; }, 2200);
}

function educationMarkup(): string {
  const cards = [
    ['①', t('onboardingActivateTitle'), t('onboardingActivateDescription')],
    ['②', t('onboardingPrivacyTitle'), t('onboardingPrivacyDescription')],
    ['③', t('onboardingPreviewTitle'), t('onboardingPreviewDescription')],
    ['④', t('onboardingRestrictedTitle'), t('onboardingRestrictedDescription')],
  ];
  return `<section class="onboarding" aria-labelledby="onboarding-title">
    <h2 id="onboarding-title">${escapeHtml(t('onboardingTitle'))}</h2>
    <p>${escapeHtml(t('onboardingIntro'))}</p>
    <div class="education" aria-label="${escapeHtml(t('onboardingEducationLabel'))}">${cards.map(([number, title, description]) => `
    <article><span aria-hidden="true">${number}</span><h3>${escapeHtml(title!)}</h3><p>${escapeHtml(description!)}</p></article>`).join('')}</div>
  </section>`;
}

function toggleMarkup(name: string, label: string, description: string): string {
  return `<label class="field toggle-field"><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small></span><input type="checkbox" name="${name}"><i aria-hidden="true"></i></label>`;
}

function escapeHtml(value: string): string {
  const span = document.createElement('span');
  span.textContent = value;
  return span.innerHTML;
}
