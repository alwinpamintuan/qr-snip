import { createI18n } from '../../src/i18n/messages';
import { DEFAULT_SETTINGS, type Settings, type ThemePreference } from '../../src/core/settings';
import { loadSettings, resetSettings, saveSettings } from '../../src/application/settings-store';
import { animateElement, animateStagger, installPressMotion, type SpringMotion } from '../../src/ui/motion';
import './style.css';

const i18n = createI18n(browser.i18n);
const t = i18n.t;
const app = document.querySelector<HTMLElement>('#app')!;
const isOnboarding = new URLSearchParams(location.search).get('onboarding') === '1';
const themeContinuity: SpringMotion = {
  from: { y: 3, scale: .997, opacity: .8 },
  to: { y: 0, scale: 1, opacity: 1 },
  spring: 'settled',
  duration: 260,
};

document.title = t('optionsTitle');
document.documentElement.dir = i18n.direction;

const heading = document.createElement('header');
heading.className = 'page-heading';
const title = document.createElement('h1');
title.textContent = t('optionsTitle');
const status = document.createElement('span');
status.className = 'status';
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
heading.append(title, status);

const main = document.createElement('main');
if (isOnboarding) main.append(createEducation());
const settings = document.createElement('section');
settings.className = 'settings';
settings.setAttribute('aria-label', t('optionsTitle'));

const theme = document.createElement('select');
theme.name = 'theme';
for (const [value, key] of [
  ['system', 'themeSystemOption'], ['light', 'themeLightOption'], ['dark', 'themeDarkOption'],
] as const) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = t(key);
  theme.append(option);
}
const themeField = createSettingField(t('themeSettingLabel'), t('themeSettingDescription'));
themeField.classList.add('select-field');
themeField.append(theme);

const closeAfterCopy = createToggle(
  'closeAfterCopy', t('closeAfterCopyLabel'), t('closeAfterCopyDescription'),
);
const decoderDiagnostics = createToggle(
  'decoderDiagnostics', t('decoderDiagnosticsLabel'), t('decoderDiagnosticsDescription'),
);
const privacyNote = document.createElement('div');
privacyNote.className = 'privacy-note';
const privacyTitle = document.createElement('strong');
privacyTitle.textContent = t('settingsPrivacyTitle');
const privacyDescription = document.createElement('span');
privacyDescription.textContent = t('settingsPrivacyDescription');
privacyNote.append(privacyTitle, privacyDescription);
const resetButton = document.createElement('button');
resetButton.className = 'reset-button';
resetButton.type = 'button';
resetButton.textContent = t('resetSettingsAction');
settings.append(themeField, closeAfterCopy.field, decoderDiagnostics.field, privacyNote, resetButton);
main.append(settings);
app.replaceChildren(heading, main);
installPressMotion(resetButton);
requestAnimationFrame(() => {
  animateElement(heading, 'entrance');
  const cards = main.querySelectorAll<HTMLElement>('.education article');
  animateStagger(cards, 'reveal', 54, { delay: 45 });
  animateStagger(settings.querySelectorAll<HTMLElement>('.field, .privacy-note, .reset-button'), 'reveal', 38, {
    delay: cards.length ? 170 : 55,
  });
});

let statusTimer: number | undefined;
void loadSettings(browser.storage.local).then(renderSettings);
theme.addEventListener('change', () => void persist());
closeAfterCopy.input.addEventListener('change', () => void persist());
decoderDiagnostics.input.addEventListener('change', () => void persist());
resetButton.addEventListener('click', () => {
  void resetSettings(browser.storage.local).then((value) => {
    renderSettings(value);
    showStatus(t('settingsResetStatus'));
  });
});

async function persist(): Promise<void> {
  const value: Settings = {
    version: DEFAULT_SETTINGS.version,
    theme: theme.value as ThemePreference,
    closeAfterCopy: closeAfterCopy.input.checked,
    decoderDiagnostics: decoderDiagnostics.input.checked,
  };
  applyTheme(value.theme);
  await saveSettings(browser.storage.local, value);
  showStatus(t('settingsSavedStatus'));
}

function renderSettings(value: Settings): void {
  theme.value = value.theme;
  closeAfterCopy.input.checked = value.closeAfterCopy;
  decoderDiagnostics.input.checked = value.decoderDiagnostics;
  applyTheme(value.theme);
}

function showStatus(message: string): void {
  status.textContent = message;
  animateElement(status, 'reveal');
  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => { status.textContent = ''; }, 2200);
}

function applyTheme(value: ThemePreference): void {
  const changed = document.documentElement.dataset.theme !== undefined
    && document.documentElement.dataset.theme !== value;
  document.documentElement.dataset.theme = value;
  if (changed) animateElement(app, themeContinuity);
}

function createEducation(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'onboarding';
  section.setAttribute('aria-labelledby', 'onboarding-title');
  const heading = document.createElement('h2');
  heading.id = 'onboarding-title';
  heading.textContent = t('onboardingTitle');
  const intro = document.createElement('p');
  intro.textContent = t('onboardingIntro');
  const cards = document.createElement('div');
  cards.className = 'education';
  cards.setAttribute('aria-label', t('onboardingEducationLabel'));
  const content = [
    ['①', t('onboardingActivateTitle'), t('onboardingActivateDescription')],
    ['②', t('onboardingPrivacyTitle'), t('onboardingPrivacyDescription')],
    ['③', t('onboardingPreviewTitle'), t('onboardingPreviewDescription')],
    ['④', t('onboardingRestrictedTitle'), t('onboardingRestrictedDescription')],
  ];
  cards.append(...content.map(([number, cardTitle, description]) => {
    const article = document.createElement('article');
    const marker = document.createElement('span');
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = number!;
    const title = document.createElement('h3');
    title.textContent = cardTitle!;
    const copy = document.createElement('p');
    copy.textContent = description!;
    article.append(marker, title, copy);
    return article;
  }));
  section.append(heading, intro, cards);
  return section;
}

function createSettingField(label: string, description: string): HTMLLabelElement {
  const field = document.createElement('label');
  field.className = 'field';
  const copy = document.createElement('span');
  const title = document.createElement('strong');
  title.textContent = label;
  const detail = document.createElement('small');
  detail.textContent = description;
  copy.append(title, detail);
  field.append(copy);
  return field;
}

function createToggle(name: string, label: string, description: string): Readonly<{
  field: HTMLLabelElement;
  input: HTMLInputElement;
}> {
  const field = createSettingField(label, description);
  field.classList.add('toggle-field');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = name;
  const indicator = document.createElement('i');
  indicator.setAttribute('aria-hidden', 'true');
  field.append(input, indicator);
  return { field, input };
}
