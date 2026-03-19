# 拦截器使用指南

## 概述

拦截器模块提供了 XHR 和 Fetch 请求的拦截能力，用于捕获聊天平台的 API 响应数据。

## 核心功能

### 1. XHR/Fetch 双拦截

支持同时拦截 `XMLHttpRequest` 和 `fetch` 请求，确保不遗漏任何 API 调用。

### 2. 动态 API 端点探测

自动发现和记录访问的 API 端点，支持端点分类（conversation/message/list/unknown）。

### 3. 多结构兼容

支持多种 API 响应格式：
- 直接对话对象：`{ id, messages }`
- 嵌套数据：`{ data: { ... } }`
- 结果包装：`{ result: { ... } }`
- 数组格式：`[conversation1, conversation2]`
- 常见字段：`conversation_id`, `chat_id`, `thread_id`, `messages`, `history`

### 4. Store 集成

捕获的数据自动存储到 Store 中：
- 对话数据：`cache:conversation:<id>`
- 消息数据：`cache:messages:<id>`

### 5. 与 Adapter 集成

通过回调机制，捕获的数据可以传递给 Adapter 进行处理。

## 快速开始

### 基本用法

```typescript
import { RequestInterceptor, createStore } from './src/core';

// 创建 Store
const store = createStore();

// 创建拦截器
const interceptor = new RequestInterceptor(
  {
    platform: 'custom',
    enableXHR: true,
    enableFetch: true,
    debug: true,
  },
  store
);

// 注册捕获回调
interceptor.onCapture((request) => {
  console.log('Captured request:', request.url);
  console.log('Response:', request.response);
});

// 启动拦截
interceptor.start();

// ... 使用完毕后停止
interceptor.stop();
```

### 指定 API 端点模式

```typescript
const interceptor = new RequestInterceptor({
  platform: 'yuanbao',
  endpointPatterns: [
    '/api/chat',
    '/conversation/',
    /\/api\/v\d+\/messages/,
  ],
  enableXHR: true,
  enableFetch: true,
});
```

### 使用便捷函数

```typescript
import { createInterceptor, extractConversation, extractMessages } from './src/core';

// 快速创建并启动拦截器
const interceptor = createInterceptor(
  { platform: 'custom' },
  store
);

// 从响应中提取数据
const conversation = extractConversation(responseData);
const messages = extractMessages(responseData);
```

## API 客户端

### 基本用法

```typescript
import { ApiClient, createApiClient } from './src/core';

// 创建客户端
const client = createApiClient({
  platform: 'yuanbao',
  baseUrl: 'https://yuanbao.tencent.com',
  defaultHeaders: {
    'Authorization': 'Bearer <token>',
  },
  timeout: 30000,
  retryCount: 3,
  debug: true,
});

// 发起请求
const response = await client.get('/api/conversations');
if (response.success) {
  console.log('Data:', response.data);
} else {
  console.error('Error:', response.error);
}

// POST 请求
const postResponse = await client.post('/api/chat', {
  message: 'Hello',
});
```

### 缓存支持

```typescript
// 使用缓存
const response = await client.get('/api/conversations', {
  useCache: true,
  cacheKey: 'conversations:list',
});

// 手动设置缓存
client.setCache('my-key', data, 60000); // TTL: 60s

// 获取缓存
const cached = client.getCached('my-key');

// 清除缓存
client.clearCache('my-key');
client.clearCache(); // 清除所有
```

### 请求取消

```typescript
// 取消单个请求
client.cancelRequest('request-id');

// 取消所有请求
client.cancelAllRequests();

// 使用自定义请求 ID
const response = await client.get('/api/data', {
  cacheKey: 'my-request-id', // 同时用作请求 ID
});
```

## 高级用法

### 与 Store 集成

```typescript
import { RequestInterceptor, BrowserStore } from './src/core';

const store = new BrowserStore();
const interceptor = new RequestInterceptor(
  { platform: 'yuanbao' },
  store
);

// 拦截器会自动将捕获的数据存储到 Store
// 之后可以通过 Store 查询
const conversations = await store.query('cache:conversation:*');
const messages = await store.query('cache:messages:*');
```

### 与 Adapter 集成

```typescript
import { RequestInterceptor } from './src/core';
import { YuanbaoAdapter } from './src/adapters';

const adapter = new YuanbaoAdapter();
const interceptor = new RequestInterceptor({ platform: 'yuanbao' });

interceptor.onCapture((request) => {
  // 检查是否包含对话数据
  const conversation = extractConversation(request.response);
  if (conversation) {
    // 使用 Adapter 处理数据
    const messages = adapter.extractMessages(conversation);
    console.log('Extracted messages:', messages);
  }
});
```

### 端点发现

```typescript
const interceptor = new RequestInterceptor({ platform: 'custom' });

// 启动后会自动记录访问的端点
interceptor.start();

// ... 使用应用 ...

// 获取发现的端点
const endpoints = interceptor.getDiscoveredEndpoints();
console.log('Discovered endpoints:', endpoints);

// 获取端点模式（可用于配置）
const patterns = interceptor.getEndpointPatterns();
console.log('Endpoint patterns:', patterns);

// 导出配置
const config = interceptor.exportConfig();
console.log('Exported config:', config);
```

### 状态监控

```typescript
const interceptor = new RequestInterceptor({ platform: 'custom' });
interceptor.start();

// 获取状态
const state = interceptor.getState();
console.log('Is running:', state.isRunning);
console.log('Captured count:', state.capturedCount);
console.log('Conversation count:', state.conversationCount);
console.log('Last captured at:', state.lastCapturedAt);
```

## 配置选项

### InterceptorConfig

```typescript
interface InterceptorConfig {
  /** 平台类型 */
  platform: PlatformType;
  
  /** API 端点匹配模式（支持正则或字符串） */
  endpointPatterns?: Array<string | RegExp>;
  
  /** 是否启用 XHR 拦截 */
  enableXHR?: boolean;
  
  /** 是否启用 Fetch 拦截 */
  enableFetch?: boolean;
  
  /** 请求超时时间（ms） */
  timeout?: number;
  
  /** 调试模式 */
  debug?: boolean;
}
```

### ApiClientConfig

```typescript
interface ApiClientConfig {
  /** 平台类型 */
  platform: PlatformType;
  
  /** 基础 URL */
  baseUrl?: string;
  
  /** 默认请求头 */
  defaultHeaders?: Record<string, string>;
  
  /** 请求超时时间（ms） */
  timeout?: number;
  
  /** 重试次数 */
  retryCount?: number;
  
  /** 重试延迟（ms） */
  retryDelay?: number;
  
  /** 调试模式 */
  debug?: boolean;
}
```

## 错误处理

拦截器内置了错误处理和日志记录：

```typescript
const interceptor = new RequestInterceptor({
  platform: 'custom',
  debug: true, // 启用详细日志
});

// 错误会自动记录到控制台
// 捕获回调中的错误不会影响拦截器运行
interceptor.onCapture((request) => {
  try {
    // 处理数据
  } catch (error) {
    console.error('Error processing captured data:', error);
  }
});
```

## 最佳实践

1. **尽早启动拦截器**：在页面加载时立即启动，确保不遗漏任何请求。

2. **使用端点模式**：指定具体的端点模式可以提高性能，减少不必要的拦截。

3. **合理配置 Store**：根据数据量选择合适的存储策略（localStorage vs IndexedDB）。

4. **及时清理**：使用完毕后调用 `stop()` 停止拦截，释放资源。

5. **错误处理**：在捕获回调中添加 try-catch，避免单个错误影响整体功能。

6. **调试模式**：开发时启用 `debug: true`，生产环境关闭。

## 测试建议

### 单元测试

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RequestInterceptor, MemoryStore } from './src/core';

describe('RequestInterceptor', () => {
  let store: MemoryStore;
  let interceptor: RequestInterceptor;

  beforeEach(() => {
    store = new MemoryStore();
    interceptor = new RequestInterceptor(
      { platform: 'test', debug: true },
      store
    );
  });

  afterEach(() => {
    interceptor.stop();
  });

  it('should start and stop', () => {
    interceptor.start();
    expect(interceptor.getState().isRunning).toBe(true);
    
    interceptor.stop();
    expect(interceptor.getState().isRunning).toBe(false);
  });

  it('should capture requests', async () => {
    const captured: any[] = [];
    interceptor.onCapture((req) => captured.push(req));
    
    interceptor.start();
    
    // 触发请求...
    
    expect(captured.length).toBeGreaterThan(0);
  });
});
```

### 集成测试

1. 在真实环境中启动拦截器
2. 执行典型的聊天操作
3. 验证捕获的数据完整性
4. 检查 Store 中的数据格式
5. 测试多结构兼容性

## 与 V1 的差异

| 功能 | V1 | V2 |
|------|----|----|
| 拦截方式 | 直接修改原型 | 类封装，支持多实例 |
| 端点探测 | 静态配置 | 动态发现 + 静态配置 |
| 数据结构 | 单一格式 | 多格式兼容 |
| Store 集成 | 手动存储 | 自动存储 |
| 错误处理 | 基础 | 完善，带日志 |
| TypeScript | 无 | 完整类型支持 |
| API 客户端 | 无 | 统一封装 |

## 故障排除

### 拦截器未捕获数据

1. 检查 `endpointPatterns` 配置是否正确
2. 启用 `debug: true` 查看日志
3. 确认请求确实是 XHR 或 Fetch
4. 检查是否有其他扩展干扰

### Store 存储失败

1. 检查浏览器是否支持 localStorage
2. 确认存储空间未满
3. 检查数据类型是否可序列化

### 类型错误

1. 确保使用最新的 TypeScript
2. 检查类型导入是否正确
3. 使用 `as StoreKey` 进行类型断言（如需要）
