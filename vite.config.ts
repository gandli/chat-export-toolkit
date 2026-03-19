import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/index.ts',
      userscript: {
        name: 'Chat Export Toolkit',
        namespace: 'https://github.com/gandli/chat-export-toolkit',
        version: '0.6.0',
        description: 'Export/copy current Yuanbao conversation and export all conversations as ZIP (MD/JSON/DOCX)',
        author: 'gandli',
        match: [
          '*://yuanbao.tencent.com/*',
          '*://*.yuanbao.tencent.com/*',
        ],
        require: [
          'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
        ],
        grant: ['none'],
        'run-at': 'document-start',
        license: 'MIT',
      },
      build: {
        // V2 产物使用独立文件名，避免覆盖 V1 代码
        // 迁移完成后可以改回 'chat-export.user.js'
        fileName: 'chat-export.v2.user.js',
      },
    }),
  ],
  build: {
    outDir: 'userscripts',
    emptyOutDir: true,
  },
});
