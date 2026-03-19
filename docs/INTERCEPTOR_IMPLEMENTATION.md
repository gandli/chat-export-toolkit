# V2 拦截器实现总结

## 实现的功能

### 1. 核心拦截器 (`src/core/interceptor.ts`)

#### XHR 拦截器
- ✅ 拦截 `XMLHttpRequest.prototype.open` 方法
- ✅ 拦截 `XMLHttpRequest.prototype.send` 方法
- ✅ 监听 `onreadystatechange` 事件捕获响应
- ✅ 支持解析 JSON 和文本响应
- ✅ 自动存储捕获的数据到 Store

#### Fetch 拦截器
- ✅ 拦截全局 `fetch` 函数
- ✅ 支持 RequestInit 配置
- ✅ 克隆响应以便读取（不阻塞原始请求）
- ✅ 异步处理响应
- ✅ 自动存储捕获的数据到 Store

#### 动态 API 端点探测
- ✅ `ApiEndpointDiscoverer` 类
- ✅ 自动记录访问的 URL
- ✅ 端点分类（conversation/message/list/unknown）
- ✅ 访问频率统计
- ✅ 端点过期清理
- ✅ 导出配置功能

#### 多结构兼容
- ✅ 支持 6+ 种常见 API 响应格式
- ✅ 智能提取对话数据
- ✅ 智能提取消息列表
- ✅ 可扩展的提取逻辑

#### Store 集成
- ✅ 自动存储对话数据：`cache:conversation:<id>`
- ✅ 自动存储消息数据：`cache:messages:<id>`
- ✅ 使用 `StoreKey` 类型保证类型安全
- ✅ 支持查询和清理

#### 回调机制
- ✅ `onCapture()` 注册捕获回调
- ✅ `offCapture()` 移除回调
- ✅ 支持多个回调
- ✅ 错误隔离（单个回调错误不影响其他）

#### 状态管理
- ✅ `InterceptorState` 接口
- ✅ 运行状态追踪
- ✅ 捕获计数统计
- ✅ 最后捕获时间记录

#### 错误处理和日志
- ✅ 统一的日志函数（支持 debug 模式）
- ✅ 错误捕获和记录
- ✅ 不阻塞原始请求
- ✅ 友好的错误信息

### 2. API 客户端 (`src/core/api-client.ts`)

#### 请求方法
- ✅ `get()` - GET 请求
- ✅ `post()` - POST 请求
- ✅ `put()` - PUT 请求
- ✅ `delete()` - DELETE 请求
- ✅ `request()` - 通用请求方法

#### 高级特性
- ✅ 请求超时控制
- ✅ 自动重试（指数退避）
- ✅ 请求缓存（TTL 支持）
- ✅ 请求取消（单个/全部）
- ✅ 默认请求头合并
- ✅ URL 自动构建

#### 响应处理
- ✅ 统一的 `ApiResponse` 类型
- ✅ 成功/失败状态
- ✅ 错误信息提取
- ✅ 响应头提取
- ✅ 缓存命中检测

#### 资源管理
- ✅ `destroy()` 清理资源
- ✅ AbortController 管理
- ✅ 缓存清理

### 3. 模块导出 (`src/core/index.ts`)

- ✅ 导出所有拦截器相关类型和函数
- ✅ 导出 API 客户端相关类型和函数
- ✅ 保持向后兼容

## 与 V1 的差异

| 方面 | V1 | V2 | 改进说明 |
|------|----|----|----------|
| **架构** | 函数式，全局状态 | 类封装，支持多实例 | 更好的可测试性和可维护性 |
| **类型系统** | JavaScript | TypeScript | 完整的类型安全和 IDE 支持 |
| **XHR 拦截** | 直接修改原型 | 保存原始方法，支持恢复 | 更安全，可停止拦截 |
| **Fetch 拦截** | 基础实现 | 完整实现，支持克隆响应 | 不阻塞原始请求 |
| **端点探测** | 静态配置 | 动态发现 + 静态配置 | 自适应不同平台 |
| **数据结构** | 单一格式 | 多格式兼容（6+ 种） | 更好的平台适应性 |
| **Store 集成** | 手动调用 | 自动存储 | 减少样板代码 |
| **错误处理** | 基础 try-catch | 完善的错误隔离和日志 | 更高的可靠性 |
| **API 客户端** | 无 | 统一封装 | 类型安全的请求管理 |
| **可配置性** | 有限 | 丰富的配置选项 | 适应不同场景 |
| **调试支持** | console.log | 可配置的 debug 模式 | 生产/开发环境分离 |

## 测试建议

### 1. 单元测试

#### XHR 拦截器测试
```typescript
describe('XHRInterceptor', () => {
  it('should intercept XHR requests', async () => {
    // Mock XMLHttpRequest
    // Verify open and send are called
    // Verify response is captured
  });

  it('should handle JSON responses', async () => {
    // Mock JSON response
    // Verify parsing works correctly
  });

  it('should handle text responses', async () => {
    // Mock text response
    // Verify fallback parsing works
  });

  it('should store captured data', async () => {
    // Mock store
    // Verify set() is called with correct data
  });

  it('should stop intercepting after stop()', () => {
    // Start interceptor
    // Stop interceptor
    // Verify original methods are restored
  });
});
```

#### Fetch 拦截器测试
```typescript
describe('FetchInterceptor', () => {
  it('should intercept fetch requests', async () => {
    // Mock fetch
    // Verify interception works
  });

  it('should not block original response', async () => {
    // Verify response is returned normally
    // Verify processing happens asynchronously
  });

  it('should handle response cloning', async () => {
    // Verify clone() is called
    // Verify both responses are readable
  });
});
```

#### API 端点探测测试
```typescript
describe('ApiEndpointDiscoverer', () => {
  it('should record endpoints', () => {
    // Record multiple requests
    // Verify endpoints are tracked
  });

  it('should classify endpoint types', () => {
    // Test different URL patterns
    // Verify correct classification
  });

  it('should clear old endpoints', () => {
    // Add endpoints
    // Wait for expiration
    // Verify old endpoints are removed
  });
});
```

#### API 客户端测试
```typescript
describe('ApiClient', () => {
  it('should make GET requests', async () => {
    // Mock fetch
    // Verify request is made correctly
  });

  it('should handle timeouts', async () => {
    // Mock slow response
    // Verify timeout error is thrown
  });

  it('should retry failed requests', async () => {
    // Mock failing response
    // Verify retry logic works
  });

  it('should cache responses', async () => {
    // Make request with cache
    // Verify cache is used on second call
  });

  it('should cancel requests', async () => {
    // Start request
    // Cancel it
    // Verify abort is called
  });
});
```

### 2. 集成测试

#### 真实环境测试
1. **设置测试页面**
   - 创建包含 XHR 和 Fetch 请求的测试页面
   - 模拟聊天应用的 API 调用

2. **启动拦截器**
   ```typescript
   const interceptor = createInterceptor(
     { platform: 'test', debug: true },
     store
   );
   ```

3. **触发请求**
   - 执行各种 API 调用
   - 验证拦截器捕获所有请求

4. **验证数据**
   - 检查 Store 中的数据
   - 验证数据格式正确
   - 验证提取逻辑正确

5. **测试边界情况**
   - 网络错误
   - 超时
   - 空响应
   - 无效 JSON

### 3. 端到端测试

#### 完整流程测试
1. 初始化拦截器和 Store
2. 模拟用户操作（发送消息、加载对话）
3. 验证数据被正确捕获和存储
4. 验证 Adapter 可以正确处理数据
5. 验证导出功能正常工作

#### 性能测试
1. 测试大量请求下的性能
2. 测试长时间运行的稳定性
3. 测试内存泄漏
4. 测试 Store 大小限制

### 4. 平台特定测试

#### 浏览器兼容性
- Chrome
- Firefox
- Safari
- Edge

#### 环境测试
- 浏览器环境
- Userscript 环境（Tampermonkey）
- Node.js 环境（如适用）

## 建议 Commit Message

```
feat(core): 实现 XHR/Fetch 拦截器和 API 客户端

新增拦截器模块：
- RequestInterceptor 类：统一管理 XHR 和 Fetch 拦截
- XHRInterceptor：拦截 XMLHttpRequest 请求
- FetchInterceptor：拦截 fetch 请求
- ApiEndpointDiscoverer：动态发现和记录 API 端点
- 支持多结构兼容（6+ 种 API 响应格式）
- 自动存储捕获数据到 Store
- 回调机制支持多监听器

新增 API 客户端：
- ApiClient 类：类型安全的请求封装
- 支持 GET/POST/PUT/DELETE 方法
- 请求超时、重试、缓存
- 请求取消功能

特性：
- 完整的 TypeScript 类型支持
- 可配置的 debug 模式
- 完善的错误处理和日志
- 与 Store 和 Adapter 无缝集成
- 支持多实例，可独立启停

文档：
- 添加 INTERCEPTOR_USAGE.md 使用指南
- 添加实现总结文档

测试建议：
- 单元测试：拦截器、API 客户端、端点探测
- 集成测试：真实环境测试、边界情况
- 端到端测试：完整流程、性能、平台兼容性

与 V1 的差异：
- 类封装替代函数式，支持多实例
- 动态端点探测替代静态配置
- 多结构兼容替代单一格式
- 自动 Store 集成替代手动存储
- 完整的 TypeScript 类型系统
```

## 后续优化建议

1. **性能优化**
   - 使用 WeakMap 存储 XHR 元数据
   - 优化端点探测的内存使用
   - 实现请求去重

2. **功能增强**
   - 支持请求修改（拦截后修改再发送）
   - 支持响应修改
   - 添加请求优先级
   - 支持批量请求优化

3. **可观测性**
   - 添加性能指标收集
   - 添加请求追踪
   - 集成日志系统

4. **平台适配**
   - 实现 Yuanbao 特定适配器
   - 实现其他聊天平台适配器
   - 添加平台自动检测
