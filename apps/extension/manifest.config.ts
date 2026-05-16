import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'PageBrief',
  short_name: 'PageBrief',
  description: 'Synthesize research across multiple tabs. BYOK, local-first, privacy-respecting.',
  version: pkg.version,
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  action: {
    default_title: 'Open PageBrief',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
    },
  },
  side_panel: {
    default_path: 'sidepanel.html',
  },
  options_page: 'options.html',
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['activeTab', 'storage', 'sidePanel', 'scripting'],
  host_permissions: ['<all_urls>'],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
});
