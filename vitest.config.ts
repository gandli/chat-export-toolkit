import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 测试环境
    environment: 'jsdom',
    
    // 测试文件匹配模式
    include: ['**/*.{test,spec}.{ts,js}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/userscripts/**'],
    
    // 测试超时时间（毫秒）
    testTimeout: 10000,
    
    // 全局测试钩子
    globals: true,
    
    // 全局 setup 文件（用于 polyfill 和全局 mock）
    setupFiles: ['./tests/helpers/test-setup.ts'],
    
    // 测试执行顺序
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    
    // 覆盖率配置（可选）
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/types/**'],
    },
  },
});
