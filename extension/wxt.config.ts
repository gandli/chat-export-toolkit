import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Chat Export Toolkit',
    description: 'Export AI conversations from supported web apps.',
    permissions: ['downloads', 'storage', 'activeTab', 'scripting'],
    host_permissions: [
      'https://yuanbao.tencent.com/*',
      'https://*.yuanbao.tencent.com/*',
      'https://chat.openai.com/*',
      'https://chatgpt.com/*',
      'https://*.openai.com/*',
    ],
  },
});
