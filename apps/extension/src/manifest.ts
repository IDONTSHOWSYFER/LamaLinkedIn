import { ManifestV3Export } from '@crxjs/vite-plugin';

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: 'Lama Linked.In',
  version: '3.0.0',
  description: 'Extension Linked.In intelligente : mode Assisté (highlights + suggestions) et mode Agent (automatisation complète). Free & Premium.',
  permissions: ['storage', 'scripting', 'activeTab', 'tabs', 'notifications', 'alarms'],
  host_permissions: ['https://www.linkedin.com/*'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module' as const,
  },
  content_scripts: [
    {
      matches: ['https://www.linkedin.com/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      '16': 'src/assets/icons/16.png',
      '32': 'src/assets/icons/32.png',
      '48': 'src/assets/icons/48.png',
      '128': 'src/assets/icons/128.png',
    },
  },
  icons: {
    '16': 'src/assets/icons/16.png',
    '32': 'src/assets/icons/32.png',
    '48': 'src/assets/icons/48.png',
    '128': 'src/assets/icons/128.png',
  },
};

export default manifest;
