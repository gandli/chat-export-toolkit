import { registerContentMessageListener } from '../src/content/main';

export default defineContentScript({
  matches: [
    'https://yuanbao.tencent.com/*',
    'https://*.yuanbao.tencent.com/*',
    'https://chat.openai.com/*',
    'https://chatgpt.com/*',
    'https://*.openai.com/*',
  ],
  runAt: 'document_idle',
  main() {
    registerContentMessageListener();
  },
});
