import { defineConfig } from 'wxt';
import packageMetadata from './package.json';

export default defineConfig({
  manifest: ({ browser }) => ({
    default_locale: 'en',
    name: '__MSG_extensionName__',
    short_name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    version: packageMetadata.version,
    permissions: ['activeTab', 'scripting', 'storage'],
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    icons: {
      16: 'icons/qr-snip-16.png',
      32: 'icons/qr-snip-32.png',
      48: 'icons/qr-snip-48.png',
      96: 'icons/qr-snip-96.png',
      128: 'icons/qr-snip-128.png',
    },
    action: {
      default_title: '__MSG_actionTitle__',
      default_icon: {
        16: 'icons/qr-snip-toolbar-16.png',
        32: 'icons/qr-snip-toolbar-32.png',
      },
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Ctrl+Shift+Q',
          mac: 'Command+Shift+Q',
        },
        description: '__MSG_commandDescription__',
      },
    },
    ...(browser === 'firefox' ? {
      browser_specific_settings: {
        gecko: {
          id: 'qr-snip@local.dev',
          strict_min_version: '140.0',
          data_collection_permissions: {
            required: ['none'],
          },
        },
      },
    } : {}),
  }),
});
