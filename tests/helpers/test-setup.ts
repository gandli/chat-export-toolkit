/**
 * 全局测试 Setup 文件
 * 用于提供 jsdom 环境中缺失的 API polyfill
 */

// matchMedia polyfill (jsdom 不支持)
Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // 已废弃，但保留以兼容旧代码
    removeListener: vi.fn(), // 已废弃，但保留以兼容旧代码
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 可选：其他 jsdom 缺失的 API 可以在这里添加
// 例如：ResizeObserver, IntersectionObserver, 等
