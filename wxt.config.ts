import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: ({ browser }) => ({
    name: 'QR Snip',
    short_name: 'QR Snip',
    description: 'Select and scan a QR code anywhere in the visible browser tab.',
    version: '0.1.0',
    permissions: ['activeTab', 'scripting'],
    action: {
      default_title: 'Scan a QR code',
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
