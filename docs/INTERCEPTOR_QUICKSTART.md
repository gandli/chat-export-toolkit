# 拦截器快速开始

## 5 分钟上手

### 1. 导入模块

```typescript
import {
  RequestInterceptor,
  createInterceptor,
  createStore,
  extractConversation,
  extractMessages,
} from './src/core';
```

### 2. 创建并启动拦截器

```typescript
// 创建 Store
const store = createStore();

// 创建拦截器
const interceptor = new RequestInterceptor(
  {
    platform: 'yuanbao',  // 或 'chatgpt', 'claude' 等
    enableXHR: true,
    enableFetch: true,
    debug: true,  // 开发时启用
  },
  store
);

// 注册捕获回调
interceptor.onCapture((request) => {
  console.log('📡 Captured:', request.url);
  
  // 提取对话数据
  const conversation = extractConversation(request.response);
  if (conversation) {
    console.log('💬 Conversation:', conversation);
  }
  
  // 提取消息数据
  const messages = extractMessages(request.response);
  if (messages.length > 0) {
    console.log('📨 Messages:', messages.length);
  }
});

// 启动拦截
interceptor.start();
console.log('✅ Interceptor started');
```

### 3. 使用 API 客户端（可选）

```typescript
import { createApiClient } from './src/core';

const client = createApiClient({
  platform: 'yuanbao',
  baseUrl: 'https://yuanbao.tencent.com',
  timeout: 30000,
  retryCount: 3,
});

// 发起请求
const response = await client.get('/api/conversations');
if (response.success) {
  console.log('📊 Data:', response.data);
}
```

### 4. 查询捕获的数据

```typescript
// 查询所有对话
const conversations = await store.query('cache:conversation:*');
console.log('📚 Conversations:', conversations.length);

// 查询所有消息
const messages = await store.query('cache:messages:*');
console.log('📨 Total messages:', messages.length);
```

### 5. 停止拦截器

```typescript
interceptor.stop();
console.log('⏹ Interceptor stopped');
```

## 常用模式

### 模式 1：自动捕获

```typescript
const interceptor = createInterceptor(
  { platform: 'custom' },
  store
);

// 自动存储到 Store，无需手动处理
```

### 模式 2：自定义处理

```typescript
interceptor.onCapture((request) => {
  // 自定义处理逻辑
  if (request.url.includes('/api/chat')) {
    // 处理聊天数据
  }
});
```

### 模式 3：端点发现

```typescript
// 启动拦截器（不指定端点模式）
const interceptor = new RequestInterceptor({
  platform: 'unknown',
  debug: true,
});

interceptor.start();

// ... 使用应用 ...

// 获取发现的端点
const endpoints = interceptor.getDiscoveredEndpoints();
const patterns = interceptor.getEndpointPatterns();

// 更新配置
interceptor.stop();
const newInterceptor = new RequestInterceptor({
  platform: 'custom',
  endpointPatterns: patterns,
});
```

### 模式 4：与 Adapter 集成

```typescript
import { YuanbaoAdapter } from './src/adapters';

const adapter = new YuanbaoAdapter();

interceptor.onCapture((request) => {
  const conversation = extractConversation(request.response);
  if (conversation && adapter.detect()) {
    const messages = adapter.extractMessages(conversation);
    // 处理消息...
  }
});
```

## 配置速查

### 最小配置

```typescript
{
  platform: 'custom'
}
```

### 完整配置

```typescript
{
  platform: 'yuanbao',
  endpointPatterns: [
    '/api/chat',
    '/conversation/',
    /\/api\/v\d+\/messages/,
  ],
  enableXHR: true,
  enableFetch: true,
  timeout: 30000,
  debug: false,
}
```

### API 客户端配置

```typescript
{
  platform: 'yuanbao',
  baseUrl: 'https://yuanbao.tencent.com',
  defaultHeaders: {
    'Authorization': 'Bearer <token>',
  },
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000,
  debug: false,
}
```

## 调试技巧

### 启用详细日志

```typescript
const interceptor = new RequestInterceptor({
  platform: 'custom',
  debug: true,  // 启用详细日志
});
```

### 检查状态

```typescript
const state = interceptor.getState();
console.log('Running:', state.isRunning);
console.log('Captured:', state.capturedCount);
console.log('Conversations:', state.conversationCount);
```

### 查看端点

```typescript
const endpoints = interceptor.getDiscoveredEndpoints();
endpoints.forEach(ep => {
  console.log(`${ep.url} (${ep.type}) - ${ep.accessCount} times`);
});
```

## 常见问题

### Q: 拦截器没有捕获数据？
A: 检查：
1. `endpointPatterns` 是否正确
2. 启用 `debug: true` 查看日志
3. 确认请求是 XHR 或 Fetch

### Q: 如何只拦截特定端点？
A: 使用 `endpointPatterns` 配置：
```typescript
{
  endpointPatterns: ['/api/chat', /\/messages\/.*/]
}
```

### Q: 如何停止拦截？
A: 调用 `interceptor.stop()`

### Q: 数据存储在何处？
A: 默认存储在 localStorage，键前缀为 `cache:`

### Q: 如何清除缓存数据？
A: 使用 Store 的 `clear()` 或 `delete()` 方法

## 下一步

- 📖 阅读 [INTERCEPTOR_USAGE.md](./INTERCEPTOR_USAGE.md) 了解完整 API
- 📖 阅读 [INTERCEPTOR_IMPLEMENTATION.md](./INTERCEPTOR_IMPLEMENTATION.md) 了解实现细节
- 🔧 实现你的平台适配器
- 🧪 编写测试用例
