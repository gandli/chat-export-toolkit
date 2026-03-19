# Chat Export Toolkit - 测试策略

## 概述

本文档说明测试基建的目录结构、各测试层级的职责以及测试运行方式。

**产品形态**: Tampermonkey Userscript (`userscripts/chat-export.v2.user.js`)

---

## 测试环境分类

### 本地测试（可自动化）

以下测试可在本地运行，无需浏览器环境：

- **单元测试** (`tests/unit/`) — 测试单个函数/类的内部逻辑
- **契约测试** (`tests/contracts/`) — 验证接口/数据格式的兼容性
- **Golden 测试** (`tests/golden/`) — 对比预期输出，防止回归
- **集成测试** (`tests/integration/`) — 测试模块间协作（使用 mock）

运行命令：
```bash
bun test          # 运行所有本地测试
bun test:unit     # 只运行单元测试
bun test:watch    # 监视模式
```

### 浏览器验证（必须手动）

以下验证**必须在 Tampermonkey + 浏览器环境中进行**，无法本地自动化：

- UI 组件渲染（FAB 按钮、导出面板、Toast）
- 实际页面 API 拦截（Interceptor）
- 真实数据导出流程
- 跨浏览器兼容性

验证方式：
1. 在 Tampermonkey 中安装 `userscripts/chat-export.v2.user.js`
2. 访问目标平台页面（如 yuanbao.tencent.com）
3. 手动操作并观察行为

## 目录结构

```
chat-export-toolkit/
├── tests/
│   ├── unit/              # 单元测试：测试单个函数/类的内部逻辑
│   ├── contracts/         # 契约测试：验证接口/数据格式的兼容性
│   ├── golden/            # Golden 测试：对比预期输出，防止回归
│   └── integration/       # 集成测试：测试模块间协作
├── fixtures/              # 测试数据（已有）
│   ├── samples/           # 各平台示例数据
│   └── edge-cases/        # 边界情况数据
└── src/
    └── **/*.test.ts       # 与源码相邻的单元测试（可选）
```

## 测试层级说明

### 1. 单元测试 (`tests/unit/`)

**职责：** 测试单个函数、类或模块的内部逻辑，不依赖外部系统。

**特点：**
- 快速执行（毫秒级）
- 完全隔离，使用 mock/stub
- 覆盖边界条件、错误处理
- 每个测试只验证一个行为

**示例：**
```typescript
// tests/unit/normalizers/chatgpt-normalizer.test.ts
import { describe, it, expect } from 'vitest';
import { ChatGPTRawMessage } from '../../../src/adapters/chatgpt-types';
import { normalizeMessage } from '../../../src/normalizers/chatgpt';

describe('ChatGPT Normalizer', () => {
  it('应该正确转换用户消息', () => {
    const raw: ChatGPTRawMessage = {
      id: 'msg-1',
      role: 'user',
      content: '你好',
      created_at: 1234567890,
    };
    
    const normalized = normalizeMessage(raw, 'conv-1');
    
    expect(normalized.role).toBe('user');
    expect(normalized.content).toBe('你好');
    expect(normalized.id).toBe('msg-1');
  });

  it('应该处理缺失的字段', () => {
    const raw: ChatGPTRawMessage = {
      id: 'msg-2',
      role: 'assistant',
      content: '',  // 空内容
      created_at: 0,
    };
    
    const normalized = normalizeMessage(raw, 'conv-1');
    
    expect(normalized.content).toBe('');
    expect(normalized.timestamp).toBe(0);
  });
});
```

### 2. 契约测试 (`tests/contracts/`)

**职责：** 验证数据格式、接口签名、平台适配器的输出结构是否符合约定。

**特点：**
- 确保不同模块间的数据兼容性
- 验证 schema 约束
- 检测破坏性变更
- 适用于平台适配器、导出格式

**示例：**
```typescript
// tests/contracts/conversation-schema.test.ts
import { describe, it, expect } from 'vitest';
import type { Conversation, Message } from '../../src/types';

describe('Conversation Schema Contract', () => {
  it('Conversation 必须包含必需字段', () => {
    const conv: Conversation = {
      id: 'conv-1',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    expect(conv.id).toBeDefined();
    expect(conv.messages).toBeInstanceOf(Array);
    expect(conv.createdAt).toBeTypeOf('number');
    expect(conv.updatedAt).toBeTypeOf('number');
  });

  it('Message 必须符合角色约束', () => {
    const validRoles = ['user', 'assistant', 'system', 'tool', 'unknown'];
    
    validRoles.forEach(role => {
      const msg: Message = {
        id: 'msg-1',
        role: role as any,
        content: { type: 'text', text: 'test' },
        timestamp: Date.now(),
      };
      
      expect(validRoles).toContain(msg.role);
    });
  });
});
```

### 3. Golden 测试 (`tests/golden/`)

**职责：** 对比当前输出与预期的"golden"文件，确保输出格式稳定，防止回归。

**特点：**
- 使用真实数据作为输入
- 对比完整输出结果
- 适用于导出器、格式化逻辑
- 更新 golden 文件需人工确认

**示例：**
```typescript
// tests/golden/markdown-export.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MarkdownExporter } from '../../src/exporters/markdown';

describe('Markdown Exporter Golden Tests', () => {
  it('应该生成与 golden 文件一致的 Markdown', async () => {
    // 读取测试数据
    const inputData = JSON.parse(
      readFileSync(join(__dirname, '../../fixtures/samples/yuanbao-sample.json'), 'utf-8')
    );
    
    // 读取预期输出
    const expectedOutput = readFileSync(
      join(__dirname, '../../fixtures/v2-markdown-output.md'),
      'utf-8'
    );
    
    // 执行导出
    const exporter = new MarkdownExporter();
    const result = await exporter.exportConversation(inputData, {});
    
    // 对比输出
    expect(result.content).toBe(expectedOutput);
  });
});
```

**更新 Golden 文件：**
当预期输出需要变更时（如格式改进），手动更新 golden 文件：
```bash
# 运行测试并更新 golden 文件
bun test:golden --update
```

### 4. 集成测试 (`tests/integration/`)

**职责：** 测试多个模块协作的场景，验证端到端流程。

**特点：**
- 测试完整流程（如：适配 → 标准化 → 导出）
- 可能涉及文件系统、网络（需 mock）
- 执行较慢
- 验证模块间接口兼容性

**示例：**
```typescript
// tests/integration/export-flow.test.ts
import { describe, it, expect } from 'vitest';
import { YuanbaoAdapter } from '../../src/adapters/yuanbao';
import { YuanbaoNormalizer } from '../../src/normalizers/yuanbao';
import { JSONExporter } from '../../src/exporters/json';

describe('Export Flow Integration', () => {
  it('应该完成完整的导出流程', async () => {
    // 模拟原始数据
    const rawConversation = { /* ... */ };
    
    // 1. 适配器提取
    const adapter = new YuanbaoAdapter();
    const extracted = adapter.extractMessages(rawConversation);
    
    // 2. 标准化
    const normalizer = new YuanbaoNormalizer();
    const normalized = await normalizer.normalizeConversation(rawConversation);
    
    // 3. 导出
    const exporter = new JSONExporter();
    const result = await exporter.exportConversation(normalized, {});
    
    // 验证最终输出
    expect(result).toBeDefined();
    expect(result.format).toBe('json');
    expect(JSON.parse(result.content)).toHaveProperty('messages');
  });
});
```

## 测试运行命令

### 本地测试（可自动化）

```bash
# 运行所有本地测试
bun test

# 监视模式（开发时自动重跑）
bun test:watch

# 生成覆盖率报告
bun test:coverage

# 打开 UI 界面
bun test:ui
```

### 按测试类型运行

```bash
# 只运行单元测试
bun test:unit

# 只运行契约测试
bun test:contracts

# 只运行集成测试
bun test:integration

# 只运行 Golden 测试
bun test:golden
```

### 运行特定测试文件

```bash
# 运行单个测试文件
bun vitest run tests/unit/normalizers/chatgpt.test.ts

# 运行匹配模式的测试
bun vitest run -t "应该正确转换"
```

### 浏览器验证（必须手动）

浏览器验证无法通过命令自动化，需按以下步骤手动进行：

1. 运行 `bun run build` 生成最新脚本
2. 在 Tampermonkey 中安装/更新 `userscripts/chat-export.v2.user.js`
3. 访问目标平台页面
4. 按 [TAMPERMONKEY_TEST_PLAN.md](TAMPERMONKEY_TEST_PLAN.md) 执行 Smoke Test 或回归测试
5. 按 [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) 逐项验证

详见 [TAMPERMONKEY_TEST_PLAN.md](TAMPERMONKEY_TEST_PLAN.md)。

## 测试编写规范

### 命名约定

- 测试文件：`*.test.ts` 或 `*.spec.ts`
- 测试套件：`describe('模块名', ...)`
- 测试用例：`it('应该...', ...)`
- 使用中文描述测试行为（与项目文档一致）

### 测试结构

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('模块名', () => {
  // 准备数据
  beforeEach(() => {
    // 每个测试前的准备工作
  });

  describe('功能分组', () => {
    it('应该...', () => {
      // Arrange
      const input = ...;
      
      // Act
      const result = ...;
      
      // Assert
      expect(result).toBe(...);
    });
  });
});
```

### Mock 使用

```typescript
import { vi, describe, it, expect } from 'vitest';

// Mock 整个模块
vi.mock('../../src/utils/api', () => ({
  fetchConversation: vi.fn(),
}));

// Mock 函数
const mockFn = vi.fn().mockReturnValue({ id: 'test' });

// 验证调用
expect(mockFn).toHaveBeenCalledWith('arg1');
expect(mockFn).toHaveBeenCalledTimes(1);
```

## 测试数据管理

### Fixtures 目录

```
fixtures/
├── samples/           # 各平台标准示例
│   ├── yuanbao/
│   ├── chatgpt/
│   └── claude/
├── edge-cases/        # 边界情况
│   ├── empty-conversation.json
│   ├── huge-message.json
│   └── special-chars.json
└── golden/            # Golden 文件
    ├── markdown/
    └── json/
```

### 数据生成

对于需要大量数据的测试，使用工厂函数：

```typescript
// tests/helpers/factories.ts
export function createMessage(overrides = {}) {
  return {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: { type: 'text', text: '测试消息' },
    timestamp: Date.now(),
    ...overrides,
  };
}

export function createConversation(overrides = {}) {
  return {
    id: `conv-${Date.now()}`,
    messages: [createMessage()],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}
```

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run tests
        run: bun test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 测试优先级

### P0 - 必须覆盖

- [ ] 核心类型定义的契约测试
- [ ] 各平台适配器的输入输出格式
- [ ] 导出器的基本功能
- [ ] 边界情况处理（空数据、错误输入）

### P1 - 重要覆盖

- [ ] 标准化逻辑的单元测试
- [ ] Golden 测试（确保输出稳定）
- [ ] 集成测试（端到端流程）

### P2 - 增强覆盖

- [ ] UI 组件测试
- [ ] 性能测试
- [ ] 兼容性测试（不同浏览器环境）

## 维护指南

### 测试失败处理

1. **阅读错误信息**：确定是逻辑错误还是预期变更
2. **检查测试数据**：确认 fixtures 是否正确
3. **更新 Golden 文件**：如果预期输出变更，人工确认后更新
4. **修复代码**：如果是 bug，修复后重新运行测试

### 添加新测试

1. 确定测试类型（unit/contracts/golden/integration）
2. 在对应目录创建测试文件
3. 准备测试数据（放入 fixtures/）
4. 编写测试用例
5. 运行验证：`bun test tests/xxx/xxx.test.ts`

### 重构时的测试

- 重构前：确保现有测试全部通过
- 重构后：运行相同测试，确认行为未变
- 如有破坏性变更：更新测试和文档

## 常见问题

### Q: 单元测试和集成测试的区别？

**A:** 单元测试测试单个模块，完全隔离；集成测试测试多个模块协作，验证端到端流程。

### Q: 何时使用 Golden 测试？

**A:** 当需要确保输出格式稳定时使用，如导出器、格式化逻辑。Golden 文件需要人工维护。

### Q: 测试运行太慢怎么办？

**A:** 
- 使用 `bun test:unit` 只运行快速测试
- 集成测试可以单独运行
- 开发时使用 `bun test:watch` 只运行变更的测试

### Q: 如何测试浏览器特定功能？

**A:** 使用 `jsdom` 环境模拟 DOM，对于无法模拟的 API（如 IndexedDB），使用 mock。

### Q: 哪些测试必须在浏览器里跑？

**A:** 以下场景**必须**在 Tampermonkey + 浏览器中手动验证：
- UI 组件渲染和交互
- 实际页面 API 请求拦截
- 真实数据导出流程
- 跨浏览器兼容性

本地测试无法覆盖这些场景，因为：
- Tampermonkey 的 `GM_*` API 无法在 Node.js 环境模拟
- 各平台的实际 API 响应格式需要真实请求
- 浏览器渲染行为无法完全用 jsdom 模拟

### Q: 本地测试和浏览器验证的关系？

**A:** 
- **本地测试** — 快速反馈，覆盖核心逻辑，CI 自动化
- **浏览器验证** — 发布前手动验证，确保实际可用

两者互补，不可互相替代。

### Q: UI 测试中遇到 `document is not defined` 或 `matchMedia is not defined` 怎么办？

**A:** 这是 jsdom 环境的已知限制。项目已在 `vitest.config.ts` 中配置了 jsdom 环境，并通过 `tests/helpers/test-setup.ts` 提供了 matchMedia polyfill。

如果遇到类似问题：
1. 确认使用 `bun vitest run` 而非 `bun test`（后者可能不读取 vitest 配置）
2. 检查 `vitest.config.ts` 中是否配置了 `environment: 'jsdom'`
3. 检查 `tests/helpers/test-setup.ts` 是否包含必要的 polyfill
4. 对于新的浏览器 API 缺失，可以在 `test-setup.ts` 中添加 polyfill

---

## 附录：测试配置说明

### Vitest 配置

**文件**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',              // 使用 jsdom 模拟浏览器环境
    setupFiles: ['./tests/helpers/test-setup.ts'],  // 全局 polyfill
    globals: true,                      // 全局测试 API
    testTimeout: 10000,                 // 10 秒超时
  },
});
```

### 全局 Polyfill

**文件**: `tests/helpers/test-setup.ts`

提供 jsdom 环境中缺失的浏览器 API：

- `window.matchMedia` - 用于媒体查询（如 `prefers-color-scheme`）
- 其他 API 可按需添加（如 `ResizeObserver`, `IntersectionObserver` 等）

### 运行测试

```bash
# 推荐：使用 vitest 命令（正确读取配置）
bun vitest run

# 或指定测试文件
bun vitest run tests/unit/
bun vitest run tests/contracts/
bun vitest run tests/golden/
bun vitest run tests/integration/

# 监视模式
bun vitest watch

# 生成覆盖率报告
bun vitest run --coverage
```

### 测试状态检查

```bash
# 快速检查所有测试
bun vitest run --reporter=verbose

# 查看失败的测试详情
bun vitest run --reporter=verbose --bail=1
```
