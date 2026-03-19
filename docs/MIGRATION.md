# Chat Export Toolkit V2 - 迁移指南

## 1. 迁移目标

将 V1 单站点脚本重构为 V2 多站点平台架构，同时保持：

- ✅ 现有功能完整（腾讯元宝导出）
- ✅ 用户无感知升级（Userscript 形式不变）
- ✅ 向后兼容（现有导出文件格式不变）

---

## 2. 迁移范围

### 需要重构的代码

| V1 组件 | V2 组件 | 变更说明 |
|---------|---------|----------|
| `handleYuanbaoResponse()` | `YuanbaoAdapter.parse()` | 抽取为适配器解析逻辑 |
| `yuanbaoToMarkdown()` | `MarkdownExporter.export()` | 抽取为独立导出器 |
| `buildDocxBlob()` | `DocxExporter.export()` | 抽取为独立导出器 |
| `fetchConversationDetailById()` | `YuanbaoAdapter.getConversationDetail()` | 抽取为适配器方法 |
| `fetchAllConversationMetas()` | `YuanbaoAdapter.getAllConversations()` | 抽取为适配器方法 |
| `state.captured` | `Storage` | 封装为存储模块 |
| `installInterceptors()` | `Interceptor.install()` | 封装为拦截器模块 |
| `ensureUi()` | `UI.render()` | 封装为 UI 模块 |

### 保持不变的代码

- UI 样式（CSS Variables）
- 导出文件格式（Markdown/JSON/DOCX 结构）
- Userscript 元数据（@match、@require 等）
- 用户交互流程（点击导出 → 下载文件）

---

## 3. 4 周迁移计划

### 第 1 周：基础设施搭建

**目标**：完成 V2 项目结构和核心模块

**任务**：

- [ ] 初始化 TypeScript 项目（`package.json`、`tsconfig.json`）
- [ ] 配置 Vite 构建（输出 Userscript）
- [ ] 实现核心类型定义（`src/types/index.ts`）
- [ ] 实现拦截器模块（`src/core/interceptor.ts`）
- [ ] 实现存储模块（`src/core/storage.ts`）
- [ ] 实现导出器基类（`src/exporters/base.ts`）

**交付物**：

- 可运行的 V2 骨架项目
- 构建输出 `userscripts/chat-export.user.js`

**验收标准**：

- `npm run build` 成功生成 Userscript
- 类型定义完整（无 `any` 滥用）

---

### 第 2 周：腾讯元宝适配器迁移

**目标**：将 V1 腾讯元宝逻辑完整迁移到 V2 架构

**任务**：

- [ ] 创建 `src/adapters/yuanbao/` 目录
- [ ] 实现 `YuanbaoAdapter`（`adapter.ts`）
- [ ] 实现 `YuanbaoParser`（`parser.ts`）
- [ ] 实现 API 端点定义（`api.ts`）
- [ ] 迁移 `yuanbaoToMarkdown()` 到 `MarkdownExporter`
- [ ] 迁移 DOCX 生成逻辑到 `DocxExporter`
- [ ] 迁移 UI 渲染逻辑到 `src/ui/panel.ts`
- [ ] 编写适配器单元测试

**交付物**：

- 功能完整的腾讯元宝适配器
- 导出器（Markdown/JSON/DOCX）
- 单元测试覆盖率 > 80%

**验收标准**：

- 在腾讯元宝网站测试，功能与 V1 完全一致
- 导出文件格式与 V1 完全一致
- 无回归 Bug

---

### 第 3 周：多站点架构验证

**目标**：验证多站点架构可行性，新增第二个站点适配器

**任务**：

- [ ] 实现适配器注册机制（`src/core/adapter-registry.ts`）
- [ ] 实现站点自动检测（根据域名加载对应适配器）
- [ ] 新增 Kimi 适配器（`src/adapters/kimi/`）
  - [ ] 分析 Kimi 对话 API 结构
  - [ ] 实现 `KimiAdapter`
  - [ ] 实现 `KimiParser`
  - [ ] 测试导出功能
- [ ] 重构入口文件，支持多适配器并行
- [ ] 编写集成测试

**交付物**：

- 支持多站点的 V2 核心
- Kimi 适配器（L2 能力）
- 集成测试用例

**验收标准**：

- 在腾讯元宝和 Kimi 网站均能正常导出
- 适配器切换无冲突
- 无内存泄漏

---

### 第 4 周：优化与发布

**目标**：性能优化、文档完善、正式发布 V2

**任务**：

- [ ] 性能优化
  - [ ] 批量导出并发控制（限制同时请求数）
  - [ ] 大对话分块处理
  - [ ] 缓存策略优化
- [ ] 错误处理增强
  - [ ] 网络错误重试机制
  - [ ] 认证过期检测与提示
  - [ ] 友好的错误提示
- [ ] 文档完善
  - [ ] 更新 README（V2 架构说明）
  - [ ] 编写 `ADAPTERS.md`（适配器开发指南）
  - [ ] 编写贡献指南
- [ ] 发布准备
  - [ ] 版本号升级为 2.0.0
  - [ ] 更新 CHANGELOG
  - [ ] 打 Git Tag

**交付物**：

- V2.0.0 正式发布
- 完整文档
- 性能测试报告

**验收标准**：

- 批量导出 100 个对话，耗时 < 2 分钟
- 文档完整，新开发者可照着开发新适配器
- 无已知 P0/P1 Bug

---

## 4. 代码迁移对照表

### V1 → V2 函数映射

| V1 函数 | V2 位置 | 说明 |
|---------|---------|------|
| `handleYuanbaoResponse()` | `src/adapters/yuanbao/parser.ts:parseResponse()` | 解析 API 响应 |
| `yuanbaoToMarkdown()` | `src/exporters/markdown.ts:export()` | Markdown 导出 |
| `buildDocxBlob()` | `src/exporters/docx.ts:export()` | DOCX 导出 |
| `fetchConversationDetailById()` | `src/adapters/yuanbao/adapter.ts:getConversationDetail()` | 获取会话详情 |
| `fetchAllConversationMetas()` | `src/adapters/yuanbao/adapter.ts:getAllConversations()` | 获取会话列表 |
| `ensureUi()` | `src/ui/panel.ts:render()` | 渲染 UI 面板 |
| `installInterceptors()` | `src/core/interceptor.ts:install()` | 安装拦截器 |
| `Utils.*` | `src/utils/*.ts` | 工具函数拆分 |
| `state` | `src/core/state.ts` | 状态管理 |
| `exportAsZip()` | `src/exporters/zip.ts:export()` | ZIP 打包 |

### V1 → V2 数据结构映射

| V1 结构 | V2 结构 | 说明 |
|---------|---------|------|
| `state.current` | `Conversation | null` | 当前会话 |
| `state.captured` | `Map<string, Conversation>` | 缓存的会话 |
| `state.listHints` | `Map<string, ConversationMeta>` | 会话列表元数据 |
| `state.ui` | `UIState` | UI 状态 |

---

## 5. 测试策略

### 5.1 单元测试

**测试范围**：

- Parser 解析逻辑（使用真实 API 响应快照）
- Exporter 格式生成（验证输出结构）
- Storage 读写操作
- Utils 工具函数

**测试框架**：Vitest

**示例**：

```typescript
// src/adapters/yuanbao/parser.test.ts
import { describe, it, expect } from 'vitest';
import { YuanbaoParser } from './parser';
import mockApiResponse from './__fixtures__/detail-response.json';

describe('YuanbaoParser', () => {
  it('should parse detail API response', () => {
    const parser = new YuanbaoParser();
    const result = parser.parse(mockApiResponse);
    
    expect(result.id).toBe('test-conversation-id');
    expect(result.title).toBe('测试会话');
    expect(result.messages).toHaveLength(4);
    expect(result.messages[0].role).toBe('user');
  });
});
```

### 5.2 集成测试

**测试范围**：

- 完整导出流程（拦截 → 解析 → 导出）
- 多适配器并发
- 批量导出 ZIP 验证

**测试方法**：

- 使用 Puppeteer 模拟真实浏览器环境
- Mock API 响应（避免真实网络请求）

### 5.3 E2E 测试

**测试范围**：

- 真实站点手动验证（每个适配器）
- 导出文件内容校验

**测试清单**：

| 站点 | 单会话导出 | 批量导出 | MD | JSON | DOCX |
|------|-----------|---------|-----|------|------|
| 腾讯元宝 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kimi | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 6. 风险与应对

### 风险 1：V1 功能回归

**描述**：迁移过程中引入 Bug，导致现有功能损坏

**应对**：

- 保持 V1 代码不变，并行开发 V2
- 每个模块迁移后立即测试
- 导出文件格式与 V1 对比验证（diff）

### 风险 2：API 结构变更

**描述**：迁移期间站点 API 变更，导致解析失败

**应对**：

- 保存 V1 时期的 API 响应快照作为测试数据
- 实现 API 端点动态发现机制
- 添加多个解析策略（主策略 + 降级策略）

### 风险 3：性能下降

**描述**：V2 架构引入额外开销，导致导出变慢

**应对**：

- 性能基准测试（V1 vs V2）
- 批量导出并发数限制（默认 5 个并发）
- 大对话分块处理

### 风险 4：TypeScript 类型错误

**描述**：类型定义不完善，导致运行时错误

**应对**：

- 严格模式（`strict: true`）
- 避免滥用 `any`
- 关键函数添加类型测试

---

## 7. 回滚方案

如果 V2 发布后发现严重问题：

1. **Git 回滚**：`git revert` V2.0.0 提交
2. **Userscript 版本**：在 Userscript 头部添加 `@version 1.x.x` 回退
3. **通知用户**：在 README 和 CHANGELOG 说明情况

---

## 8. 迁移检查清单

### 代码迁移

- [ ] 所有 V1 函数已迁移到 V2 对应模块
- [ ] 类型定义完整（无 `any` 滥用）
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试通过

### 功能验证

- [ ] 腾讯元宝单会话导出正常
- [ ] 腾讯元宝批量导出正常
- [ ] Markdown 格式与 V1 一致
- [ ] JSON 格式与 V1 一致
- [ ] DOCX 格式与 V1 一致
- [ ] UI 交互与 V1 一致

### 文档

- [ ] README 已更新（V2 架构说明）
- [ ] ARCHITECTURE.md 已编写
- [ ] MIGRATION.md 已编写（本文件）
- [ ] ADAPTERS.md 已编写
- [ ] CHANGELOG 已更新

### 发布

- [ ] 版本号升级为 2.0.0
- [ ] Git Tag 已打
- [ ] Userscript 已发布

---

## 9. 常见问题

### Q: 为什么要迁移到 TypeScript？

A: V1 使用 Vanilla JS，类型不安全，重构困难。TypeScript 提供：
- 类型安全，减少运行时错误
- 更好的 IDE 支持（自动补全、跳转）
- 便于多人协作

### Q: V2 会破坏现有功能吗？

A: 不会。V2 保持：
- 导出文件格式完全一致
- UI 交互完全一致
- Userscript 安装方式不变

### Q: 如何开发新站点适配器？

A: 参考 `ADAPTERS.md`，步骤：
1. 分析站点 API 结构
2. 实现 Adapter 接口
3. 实现 Parser
4. 测试验证
5. 提交 PR

### Q: V2 支持哪些站点？

A: V2.0 支持：
- 腾讯元宝（完整迁移）
- Kimi（新增）

后续站点由社区贡献。

---

## 10. 联系与支持

如有问题，请：

1. 查看 `ARCHITECTURE.md` 了解架构
2. 查看 `ADAPTERS.md` 了解适配器开发
3. 在 GitHub 提 Issue
