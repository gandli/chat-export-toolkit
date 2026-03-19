# DeepSeek 测试计划

> 本文档定义 DeepSeek 适配器的测试策略、优先级和落地路径。
>
> **⚠️ 当前状态**: 测试驱动准备态（模板阶段）
>
> **关联文档**:
> - [`DEEPSEEK_SAMPLE_PACK.md`](./DEEPSEEK_SAMPLE_PACK.md) - DeepSeek 样本包提交规范（**新增**）
> - [`SAMPLE_CAPTURE_GUIDE.md`](./SAMPLE_CAPTURE_GUIDE.md) - 样本采集通用指南
> - [`DEEPSEEK_ADAPTER_NOTES.md`](./DEEPSEEK_ADAPTER_NOTES.md) - DeepSeek 适配器开发笔记

## 目标

将 DeepSeek 适配器从**"只有骨架"**推进到**"可演示的 MVP"**，按四个阶段进行：

```
阶段 1: 样本采集 → 阶段 2: Schema 校准 → 阶段 3: L1 DOM 提取 → 阶段 4: L2 拦截
```

## 当前状态

| 组件 | 状态 | 说明 | 完成度 |
|------|------|------|--------|
| Adapter | 🟡 骨架 | 类型定义完整，实现基于推测 | 70% |
| Normalizer | 🟡 骨架 | 逻辑完整，未经验证 | 80% |
| Fixtures | 📋 模板 | 有模板，无真实样本 | 100% 模板 |
| Contract Tests | ✅ 完整 | 31 个测试通过 | 100% |
| Golden Tests | ✅ 完整 | 13 个测试通过（模板数据） | 100% 模板 |

## 测试资产清单

### 已创建 ✅

#### Fixtures（模板）
- [x] `fixtures/deepseek/raw/template-detail-001.json` - 对话详情模板（4 条消息）
- [x] `fixtures/deepseek/raw/template-edge-001.json` - 边界情况模板（5 条消息）
- [x] `fixtures/deepseek/normalized/template-normalized-001.json` - 标准化模板
- [x] `fixtures/deepseek/normalized/template-normalized-edge-001.json` - 边界情况标准化模板

#### Golden Files
- [x] `tests/golden/deepseek/expected-markdown-v1.md` - V1 Markdown 预期
- [x] `tests/golden/deepseek/expected-markdown-v2.md` - V2 Markdown 预期
- [x] `tests/golden/deepseek/expected-json.json` - JSON 预期
- [x] `tests/golden/deepseek/expected-zip-manifest.json` - ZIP manifest 预期

#### Contract Tests
- [x] `tests/contracts/deepseek-contract.test.ts` - 31 个测试
  - detect() 存在且可调用（4 测试）
  - extractMessages() 返回数组或安全降级（6 测试）
  - getConversation() 不崩溃（6 测试）
  - listConversations() 不崩溃（4 测试）
  - Normalizer 输出符合 schema（6 测试）
  - 边界情况处理（5 测试）

#### Golden Tests
- [x] `tests/golden/deepseek/deepseek-golden.test.ts` - 13 个测试
  - Normalizer 标准化验证（3 测试）
  - 边界情况处理（3 测试）
  - Markdown Golden Files（2 测试）
  - JSON Golden Files（2 测试）
  - Reasoning Block Handling（2 测试）
  - Timestamp Handling（1 测试）

### 待创建 📋

#### 真实样本（需要采集）
- [ ] `fixtures/deepseek/raw/detail-sample-001.json` - 真实对话详情（阻塞）
- [ ] `fixtures/deepseek/raw/page-sample-001.html` - 真实页面 HTML（阻塞）
- [ ] `fixtures/deepseek/raw/list-sample-001.json` - 对话列表响应（可选）

#### L1 功能测试（需要 DOM 分析后）
- [ ] `tests/unit/deepseek/dom-extraction.test.ts` - DOM 提取单元测试
- [ ] `tests/integration/deepseek/l1-extraction.test.ts` - L1 集成测试

#### 边界测试模板（建议补充）
- [ ] `fixtures/deepseek/raw/template-long-conversation.json` - 长对话（20+ 轮）
- [ ] `fixtures/deepseek/raw/template-code-heavy.json` - 代码密集型对话
- [ ] `fixtures/deepseek/raw/template-multi-modal.json` - 多模态内容（如有）

## 测试优先级

### P0 - 阻塞落地（必须完成）🔴

| 测试 | 目的 | 依赖 | 状态 |
|------|------|------|------|
| **采集真实 API 响应** | 验证类型定义 | 人工访问 DeepSeek | ❌ |
| **验证 DOM 结构** | 实现 L1 提取 | 人工分析页面 | ❌ |
| **Contract Test 通过** | 确保接口一致 | 已有通用测试 | ✅ |
| **Normalizer 单元测试** | 验证标准化逻辑 | 真实样本 | ⏸️ |

### P1 - 核心功能（应该完成）🟡

| 测试 | 目的 | 依赖 | 状态 |
|------|------|------|------|
| Golden Test 通过（真实数据） | 验证输出一致性 | P0 完成 | ⏸️ |
| Markdown 导出验证 | 验证导出格式 | Normalizer | ✅ 模板 |
| JSON 导出验证 | 验证导出格式 | Normalizer | ✅ 模板 |
| Think/Reasoning 处理 | 验证 DeepSeek 特有功能 | 真实样本 | ⏸️ |
| L1 DOM 提取功能测试 | 验证页面提取 | DOM 分析 | ❌ |

### P2 - 增强功能（可以延后）🟢

| 测试 | 目的 | 依赖 | 优先级 |
|------|------|------|--------|
| 代码块处理验证 | 验证代码导出 | 真实样本 | 🟢 中 |
| 数学公式处理验证 | 验证 LaTeX 保留 | 真实样本 | 🟢 中 |
| 长对话性能测试 | 验证大数据量 | 真实样本 | 🟢 低 |
| ZIP 批量导出验证 | 验证批量功能 | 多对话样本 | 🟢 低 |
| L2 API 拦截测试 | 验证完整对话获取 | API 分析 | 🟢 低 |

---

## 边界测试用例（建议补充）

以下边界测试用例可在样本采集后添加到 `template-edge-002.json`：

### 消息内容边界

```json
{
  "test_cases": [
    {
      "name": "空消息",
      "content": "",
      "expected": "_No content_"
    },
    {
      "name": "null 内容",
      "content": null,
      "expected": "_No content_"
    },
    {
      "name": "仅空白字符",
      "content": "   \n\t   ",
      "expected": "_No content_"
    },
    {
      "name": "超长消息（10KB+）",
      "content": "重复文本...",
      "expected": "完整保留"
    },
    {
      "name": "特殊字符",
      "content": "@#$%^&*(){}[]|\\:;\"'<>,.?/",
      "expected": "原样保留"
    },
    {
      "name": "Emoji 混合",
      "content": "🎉🚀💻🤖🔥✨🎯📊📝✅",
      "expected": "原样保留"
    },
    {
      "name": "多语言混合",
      "content": "Hello 你好 مرحبا שלום",
      "expected": "原样保留"
    }
  ]
}
```

### 代码块边界

```json
{
  "test_cases": [
    {
      "name": "多语言代码块",
      "languages": ["python", "javascript", "typescript", "rust"],
      "expected": "正确语法高亮标记"
    },
    {
      "name": "嵌套代码块",
      "content": "代码中包含 ``` 标记",
      "expected": "正确转义"
    },
    {
      "name": "空代码块",
      "content": "",
      "expected": "保留语言标记"
    }
  ]
}
```

### 数学公式边界

```json
{
  "test_cases": [
    {
      "name": "行内公式",
      "content": "$E = mc^2$",
      "expected": "保留 $ 标记"
    },
    {
      "name": "块级公式",
      "content": "$$\\int_0^\\infty e^{-x^2} dx$$",
      "expected": "保留 $$ 标记"
    },
    {
      "name": "复杂 LaTeX",
      "content": "$$\\sum_{i=1}^{n} x_i^2$$",
      "expected": "保留完整 LaTeX"
    }
  ]
}
```

### 时间戳边界

```json
{
  "test_cases": [
    {
      "name": "秒级时间戳",
      "timestamp": 1710840000,
      "expected": "转换为毫秒"
    },
    {
      "name": "毫秒级时间戳",
      "timestamp": 1710840000000,
      "expected": "保持不变"
    },
    {
      "name": "ISO 字符串",
      "timestamp": "2024-03-19T12:00:00Z",
      "expected": "解析为毫秒"
    },
    {
      "name": "缺失时间戳",
      "timestamp": null,
      "expected": "使用当前时间"
    }
  ]
}
```

### 角色映射边界

```json
{
  "test_cases": [
    {
      "name": "标准角色",
      "roles": ["user", "assistant", "system"],
      "expected": "正确映射"
    },
    {
      "name": "变体角色",
      "roles": ["human", "ai", "bot", "model"],
      "expected": "映射到标准角色"
    },
    {
      "name": "未知角色",
      "roles": ["unknown", "tool", "function"],
      "expected": "映射为 unknown 或 tool"
    },
    {
      "name": "缺失角色",
      "role": null,
      "expected": "默认为 unknown"
    }
  ]
}
```

## 最小可行测试集 (MVT)

要证明 DeepSeek 适配器"可落地"，至少需要：

### 1. Contract 测试通过 ✅

```bash
bun test tests/contracts/adapter-contract.test.ts
```

**验证内容**：
- detect() 存在且返回 boolean
- extractMessages() 返回数组
- getConversation() 不崩溃
- listConversations() 返回数组

**当前状态**: ✅ 已集成到通用 contract 测试

### 2. Normalizer 单元测试通过 📋

```bash
bun test tests/golden/deepseek/deepseek-golden.test.ts
```

**验证内容**：
- 标准化输出符合 Conversation schema
- Think/Reasoning 块正确处理
- 代码块格式保留
- 时间戳转换正确
- Metadata 保留完整

**当前状态**: 📋 测试已创建，使用模板数据

### 3. 真实样本验证 🔴

**需要采集的样本**：

| 样本 | 用途 | 优先级 |
|------|------|--------|
| 对话详情 API 响应 | 验证类型定义 | 🔴 高 |
| 对话页面 HTML | 验证 DOM 选择器 | 🔴 高 |
| 包含 think 块的对话 | 验证 reasoning 处理 | 🟡 中 |
| 包含代码的对话 | 验证代码块处理 | 🟡 中 |

**采集方法**：

```markdown
1. 访问 https://chat.deepseek.com
2. 打开开发者工具 → Network
3. 进行对话操作
4. 捕获 API 响应
5. 脱敏后保存为 fixture
```

## 落地路径（四阶段）

### 阶段 1: 样本采集 🔴（当前阻塞点）

**目标**: 获取真实的 DeepSeek 数据样本

**任务**:
- [ ] 运行初始化脚本：`bun run scripts/prepare-deepseek-sample-pack.ts`
- [ ] 阅读 [`DEEPSEEK_SAMPLE_PACK.md`](./DEEPSEEK_SAMPLE_PACK.md) 了解样本包要求
- [ ] 阅读 [`fixtures/deepseek/CHECKLIST.md`](../fixtures/deepseek/CHECKLIST.md) 按步骤采集
- [ ] 访问 https://chat.deepseek.com
- [ ] 捕获至少 1 个完整对话的 API 响应 → `detail-sample-001.json`
- [ ] 捕获对话页面 HTML → `page-sample-001.html`
- [ ] 脱敏处理（移除个人信息、token）→ 使用 `bash fixtures/deepseek/sanitize.sh`
- [ ] 保存到 fixtures/deepseek/raw/
- [ ] 更新 `fixtures/deepseek/.sample-info.json` 元数据

**完成标志**: fixture 目录包含真实样本文件，且通过验证

**预计时间**: 2-4 小时

---

### 阶段 2: Schema 校准 🟡（样本采集后）

**目标**: 验证并修正类型定义和 Normalizer 逻辑

**任务**:
- [ ] 用真实样本替换模板运行 golden tests
- [ ] 验证 `deepseek-types.ts` 中的类型定义
  - [ ] 消息结构字段
  - [ ] 时间戳格式
  - [ ] 角色字段名
- [ ] 修复 `normalizers/deepseek.ts` 中的字段映射
- [ ] 验证 think/reasoning 块是否存在
- [ ] 更新 golden 文件以匹配真实输出
- [ ] 确保所有 13 个 golden tests 通过
- [ ] 更新 [`DEEPSEEK_SAMPLE_PACK.md`](./DEEPSEEK_SAMPLE_PACK.md) 的样本结构定义（如实际结构与预期不符）

**完成标志**: 所有 golden tests 使用真实数据通过

**预计时间**: 2-4 小时

---

### 阶段 3: L1 DOM 提取 🟢（核心功能）

**目标**: 实现从当前页面 DOM 提取可见消息

**任务**:
- [ ] 分析 `page-sample-001.html` 的 DOM 结构
  - [ ] 找到消息容器选择器
  - [ ] 找到角色标识方式
  - [ ] 找到内容区域选择器
  - [ ] 找到时间戳位置
- [ ] 实现 `extractMessagesFromDom()` 方法
- [ ] 实现 `getConversation()` 的 DOM 提取回退逻辑
- [ ] 编写 L1 功能验证测试
- [ ] 在真实页面上手动验证

**完成标志**: 在 DeepSeek 页面上可提取当前对话的消息

**预计时间**: 4-8 小时

---

### 阶段 4: L2 API 拦截 🟢（增强功能，可选）

**目标**: 通过拦截 API 响应获取完整对话历史

**任务**:
- [ ] 识别对话详情 API 端点
- [ ] 识别对话列表 API 端点
- [ ] 实现 `installInterceptors()` 方法
- [ ] 拦截 XHR 和 fetch 请求
- [ ] 解析并缓存响应数据
- [ ] 编写 L2 功能测试

**完成标志**: 可获取完整对话历史（不仅是可见消息）

**预计时间**: 8-16 小时

---

## 最小可行测试集 (MVT)

要证明 DeepSeek 适配器"可落地"，至少需要以下测试通过：

### 1. Contract 测试通过 ✅

```bash
bun test tests/contracts/deepseek-contract.test.ts
```

**验证内容**：
- ✅ detect() 存在且返回 boolean
- ✅ extractMessages() 返回数组
- ✅ getConversation() 不崩溃
- ✅ listConversations() 返回数组
- ✅ Normalizer 输出符合 Conversation schema

**当前状态**: ✅ 31 个测试通过

### 2. Golden Test 通过（使用真实数据）📋

```bash
bun test tests/golden/deepseek/deepseek-golden.test.ts
```

**验证内容**：
- 📋 标准化输出符合 Conversation schema
- 📋 Think/Reasoning 块正确处理
- 📋 代码块格式保留
- 📋 时间戳转换正确
- 📋 Metadata 保留完整

**当前状态**: ✅ 13 个测试通过（使用模板数据）

### 3. L1 功能手动验证 🔴

**验证步骤**：
1. 打开 DeepSeek 对话页面
2. 运行适配器
3. 验证消息正确提取
4. 验证导出格式正确

**当前状态**: ❌ 无法验证（需要真实样本和 DOM 分析）

## 测试命令

```bash
# 运行 DeepSeek golden tests
bun test tests/golden/deepseek/

# 运行所有 contract tests
bun test tests/contracts/

# 运行特定测试文件
bun test tests/golden/deepseek/deepseek-golden.test.ts
bun test tests/contracts/deepseek-contract.test.ts

# 带覆盖率运行
bun test --coverage tests/golden/deepseek/
bun test --coverage tests/contracts/deepseek-contract.test.ts

# 运行所有 DeepSeek 相关测试
bun test tests/contracts/deepseek-contract.test.ts tests/golden/deepseek/
```

---

## 成功标准

DeepSeek 适配器达到"可落地准备态"的标志：

### 当前已完成 ✅
- [x] ✅ 类型定义完整（deepseek-types.ts）
- [x] ✅ Adapter 骨架实现（deepseek.ts）
- [x] ✅ Normalizer 骨架实现（deepseek.ts normalizer）
- [x] ✅ Fixture 模板完整
- [x] ✅ Golden test 框架完整（13 测试）
- [x] ✅ Contract test 完整（31 测试）

### 待完成 📋
- [ ] 📋 真实样本采集完成
- [ ] 📋 Golden test 使用真实数据通过
- [ ] 📋 Contract test 全部通过（真实数据）
- [ ] 📋 L1 DOM 提取功能实现
- [ ] 📋 文档完整（DEEPSEEK_ADAPTER_NOTES.md）

---

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 无真实样本 | 无法验证实现 | 明确标注"模板阶段"，不夸大支持度 |
| API 结构变化 | 类型定义失效 | 支持多结构兼容，定期验证 |
| DOM 频繁更新 | 选择器失效 | 使用多重选择器，文档化验证方法 |
| 认证机制复杂 | L2/L3 难实现 | 优先实现 L1，L2/L3 作为增强 |
| 反爬措施 | 主动调用受限 | 优先使用 API 拦截，降低请求频率 |
| DeepSeek 服务不可用 | 无法采集样本 | 等待服务恢复，或寻找替代样本源 |

---

## 下一步行动

### 立即可做（无需真实样本）✅

- [x] ✅ 完善 fixture 模板
- [x] ✅ 创建 golden test
- [x] ✅ 更新文档
- [x] ✅ 运行现有测试确保不报错

### 需要人工介入（下一步）🔴

- [ ] 访问 DeepSeek 网页版
- [ ] 捕获真实 API 响应
- [ ] 分析 DOM 结构
- [ ] 提供样本文件

### 样本采集后

- [ ] 替换模板为真实数据
- [ ] 运行 golden test
- [ ] 修复发现的问题
- [ ] 更新 golden 文件
- [ ] 验证 L1 功能

---

## 相关文档

- [DEEPSEEK_ADAPTER_NOTES.md](./DEEPSEEK_ADAPTER_NOTES.md) - 适配器开发笔记
- [DEEPSEEK_STATUS_SUMMARY.md](./DEEPSEEK_STATUS_SUMMARY.md) - 状态总结
- [SAMPLE_CAPTURE_GUIDE.md](./SAMPLE_CAPTURE_GUIDE.md) - 样本采集指南
- [ADAPTER_TESTING.md](./ADAPTER_TESTING.md) - 适配器测试指南
- [EXPORTER_TESTING.md](./EXPORTER_TESTING.md) - Exporter 测试指南

---

**最后更新**: 2026-03-19  
**状态**: 测试计划 v2.0（四阶段落地路径）  
**下一步**: 采集真实 DeepSeek 样本（需要人工介入）  
**测试覆盖**: 44 个测试通过（模板数据）
