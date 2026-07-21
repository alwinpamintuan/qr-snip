import { defineConfig } from 'wxt';
import packageMetadata from './package.json';

export default defineConfig({
  manifest: ({ browser }) => ({
    name: 'QR Snip',
    short_name: 'QR Snip',
    description: 'Select and scan a QR code anywhere in the visible browser tab.',
    version: packageMetadata.version,
    permissions: ['activeTab', 'scripting'],
    icons: {
      16: 'icons/qr-snip-16.png',
      32: 'icons/qr-snip-32.png',
      48: 'icons/qr-snip-48.png',
      96: 'icons/qr-snip-96.png',
      128: 'icons/qr-snip-128.png',
    },
    action: {
      default_title: 'Scan a QR code',
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
        description: 'Start QR Snip',
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
