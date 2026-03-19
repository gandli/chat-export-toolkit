# 真实环境验证计划

**版本**: v0.7.0-alpha.1  
**最后更新**: 2026-03-19  
**状态**: 规划中

---

## 概述

本文档定义 Chat Export Toolkit V2 的真实环境验证计划，明确区分**本地自动测试**与**Tampermonkey 实测**的职责边界，给出 Yuanbao Alpha 发布的验收门槛，以及第二平台（DeepSeek）验证的前置条件。

### 核心原则

1. **本地测试证明代码正确** — 类型检查、构建、单元测试、Golden 测试
2. **Tampermonkey 实测证明集成正确** — Userscript 加载、拦截器工作、UI 渲染
3. **真实样本证明数据正确** — 实际 API 响应结构、边缘情况处理

---

## 验证层级

```
┌─────────────────────────────────────────────────────────────────┐
│  L3: 真实样本验证                                                │
│  - 必须等真实样本才能证明                                        │
│  - 实际 API 响应结构验证                                         │
│  - 边缘情况（长对话、think 块、代码块、图片）                       │
│  - 批量导出性能                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ 需要人工采集
                              │
┌─────────────────────────────────────────────────────────────────┐
│  L2: Tampermonkey 实测                                           │
│  - 必须人工证明                                                  │
│  - Userscript 在真实页面加载                                     │
│  - 拦截器捕获真实 API 请求                                        │
│  - UI 在真实页面渲染                                             │
│  - 导出功能触发下载                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ 可部分自动化
                              │
┌─────────────────────────────────────────────────────────────────┐
│  L1: 本地自动测试                                                │
│  - 可完全自动化证明                                              │
│  - 类型检查 (bun run typecheck)                                  │
│  - 构建验证 (bun run build)                                      │
│  - 单元测试 (bun test)                                           │
│  - Golden 测试 (输出格式对比)                                     │
│  - 构建产物验证 (scripts/verify-build.ts)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 本地自动测试能证明什么

### ✅ 可完全自动化验证

| 项目 | 验证方式 | 证明内容 |
|------|----------|----------|
| **类型安全** | `bun run typecheck` | 代码无类型错误，接口定义一致 |
| **构建成功** | `bun run build` | Userscript 可正确生成 |
| **构建产物** | `scripts/verify-build.ts` | 输出文件存在、大小合理、元数据完整 |
| **单元测试** | `bun test tests/unit/` | 单个函数/类逻辑正确 |
| **契约测试** | `bun test tests/contracts/` | 数据格式符合 schema |
| **Golden 测试** | `bun test tests/golden/` | 输出格式与预期一致 |
| **集成测试** | `bun test tests/integration/` | 模块间协作正确 |
| **Fixture 验证** | `scripts/load-fixtures.ts` | 测试数据可正确加载和解析 |
| **格式对齐** | `scripts/verify-format-parity.ts` | V1/V2 格式差异符合预期 |

### ⚠️ 局限性

本地测试**无法证明**：

- Userscript 在真实浏览器环境中能否正确加载
- 拦截器能否匹配真实平台的 API 端点
- 真实 API 响应结构是否与推测一致
- UI 在真实页面中是否被 CSS 覆盖或遮挡
- 真实数据量下的性能表现

---

## Tampermonkey 实测必须证明什么

### 🔶 必须人工验证

以下项目**必须**通过 Tampermonkey 在真实页面验证：

#### 1. 安装与加载

详见 [TAMPERMONKEY_TEST_PLAN.md](TAMPERMONKEY_TEST_PLAN.md)「安装与更新」章节。

- [ ] Tampermonkey 扩展正确安装
- [ ] Userscript 可成功安装到 Tampermonkey
- [ ] 访问目标平台页面时 script 自动执行
- [ ] 控制台显示完整初始化日志

#### 2. 版本确认

- [ ] 控制台横幅显示正确版本号
- [ ] Userscript 元数据（@version, @match）正确
- [ ] 与仓库构建产物版本一致

#### 3. 页面日志

详见 [TAMPERMONKEY_TEST_PLAN.md](TAMPERMONKEY_TEST_PLAN.md)「日志与调试」章节。

- [ ] 看到完整的初始化日志链
- [ ] 平台检测正确（如 `Platform detected: yuanbao.tencent.com`）
- [ ] 拦截器安装成功日志
- [ ] UI 初始化成功日志

#### 4. UI 渲染

详见 [TAMPERMONKEY_TEST_PLAN.md](TAMPERMONKEY_TEST_PLAN.md)「页面注入」和「UI 交互」章节。

- [ ] FAB 按钮出现在页面右下角
- [ ] FAB 按钮不被页面元素遮挡
- [ ] 点击 FAB 弹出导出面板
- [ ] 导出面板选项完整（格式、范围）
- [ ] 暗色模式下 UI 可见

#### 5. 拦截验证

- [ ] Network 面板看到 API 请求被拦截
- [ ] 控制台显示拦截日志
- [ ] 缓存中有对话数据（`window.testToolkit.store.state`）

#### 6. 导出验证

详见 [TAMPERMONKEY_TEST_PLAN.md](TAMPERMONKEY_TEST_PLAN.md)「下载功能」章节。

- [ ] 点击导出按钮触发下载
- [ ] 下载文件命名正确
- [ ] 文件内容可打开
- [ ] JSON 格式可通过 `jq '.'` 验证
- [ ] Markdown 格式无乱码

#### 7. ZIP 验证（如实现）

- [ ] 批量导出触发 ZIP 下载
- [ ] ZIP 文件可解压
- [ ] 解压后文件完整

### 实测流程

```bash
# 1. 构建
bun install && bun run typecheck && bun run build

# 2. 验证构建产物
bun run scripts/verify-build.ts

# 3. 安装到 Tampermonkey
# - 打开 userscripts/chat-export.v2.user.js
# - Tampermonkey 自动识别并提示安装
# - 或手动复制内容到 Tampermonkey 编辑器

# 4. 访问目标页面
# - Yuanbao: https://yuanbao.tencent.com
# - DeepSeek: https://chat.deepseek.com

# 5. 打开开发者工具 (F12)
# - 查看 Console 日志
# - 查看 Network 请求

# 6. 执行导出测试
# - 点击 FAB → 选择格式 → 导出
# - 验证下载文件

# 7. 采集样本（如需要）
bun run scripts/capture-yuanbao-samples.ts
```

---

## 哪些结论必须等真实样本

### 🔴 必须等真实样本

以下结论**无法**通过本地测试或单次实测得出，需要采集**多个真实样本**：

#### 1. API 结构稳定性

- [ ] 不同对话的响应结构一致
- [ ] 不同消息类型的字段完整
- [ ] 时间戳格式统一
- [ ] 分页/游标格式正确

#### 2. 边缘情况覆盖

- [ ] 空对话处理
- [ ] 单条消息对话
- [ ] 超长对话（>100 条消息）
- [ ] 包含 think 块的消息
- [ ] 包含代码块的消息
- [ ] 包含图片/附件的消息
- [ ] 包含特殊字符的消息

#### 3. 性能基线

- [ ] 大对话导出时间（>50 条消息）
- [ ] 批量导出时间（>10 个对话）
- [ ] 内存占用峰值
- [ ] 页面卡顿情况

#### 4. 兼容性验证

- [ ] 不同浏览器（Chrome/Edge/Safari/Firefox）
- [ ] 不同登录状态（新账号/老账号）
- [ ] 不同网络环境（WiFi/4G/代理）

#### 5. 错误场景

- [ ] 网络中断后的恢复
- [ ] API 返回错误时的处理
- [ ] 登录过期时的提示
- [ ] 权限不足时的行为

### 样本采集要求

```
fixtures/yuanbao-live/
├── README.md                    # 采集说明
├── detail-request.curl          # 详情请求（脱敏）
├── detail-response.json         # 详情响应（脱敏）
├── list-request.curl            # 列表请求（脱敏）
├── list-response.json           # 列表响应（脱敏）
└── capture-log.txt              # 采集日志

# 至少需要：
# - 3 个不同对话的 detail 响应
# - 1 个列表响应（包含多个对话）
# - 1 个包含 think 块的消息
# - 1 个包含代码块的消息
# - 1 个长对话（>50 条消息）
```

---

## 验收门槛：Yuanbao Alpha 发布标准

### 最低发布条件（Alpha）

以下所有条件**必须满足**才能发布 Yuanbao Alpha：

#### 构建与类型

- [x] `bun run typecheck` 通过，无错误
- [x] `bun run build` 成功，生成 `userscripts/chat-export.v2.user.js`
- [x] `bun run scripts/verify-build.ts` 所有检查通过

#### 本地测试

- [x] 单元测试通过（如有）
- [x] Golden 测试通过（输出格式稳定）
- [x] `scripts/load-fixtures.ts` 成功加载测试数据

#### Tampermonkey 实测

- [ ] 在 Yuanbao 真实页面完成至少 **3 次** 成功导出
  - 1 次 JSON 格式
  - 1 次 Markdown 格式
  - 1 次包含 think 块的消息
- [ ] 控制台日志完整，无错误
- [ ] UI 正常显示和交互
- [ ] 导出文件可打开且格式正确

#### 样本采集

- [ ] `fixtures/yuanbao-live/` 目录包含：
  - `detail-response.json`（至少 1 个真实样本，已脱敏）
  - `list-response.json`（至少 1 个真实样本，已脱敏）
- [ ] 样本通过 `scripts/validate-yuanbao-samples.ts` 验证
- [ ] 样本无敏感信息（Cookie、Token、真实对话内容已脱敏）

#### 文档

- [x] `docs/YUANBAO_LIVE_VALIDATION.md` 存在且完整
- [x] `docs/SAMPLE_CAPTURE_GUIDE.md` 存在且完整
- [x] `docs/RELEASE_CHECKLIST.md` 包含 Yuanbao 验证项
- [x] `docs/REAL_WORLD_VALIDATION.md` 存在（本文档）

#### 已知问题记录

- [ ] 在 `docs/ALPHA_STATUS.md` 中记录所有已知限制
- [ ] 在 `CHANGELOG.md` 中记录 Alpha 发布说明

### Beta 发布条件（后续目标）

- [ ] 完成 **10+ 次** 不同场景的导出测试
- [ ] 采集 **5+ 个** 不同对话的真实样本
- [ ] 完成跨浏览器测试（Chrome/Edge/Firefox）
- [ ] 批量导出（ZIP）功能完成
- [ ] 性能测试通过（大对话导出 < 10 秒）

### Stable 发布条件（长期目标）

- [ ] 完成所有边缘情况测试
- [ ] 自动化 E2E 测试覆盖 > 80%
- [ ] 至少 3 个平台完整支持
- [ ] 无已知阻塞性问题

---

## 第二平台验证前置 Checklist（DeepSeek 优先）

在开始 DeepSeek 真实页面验证前，必须完成以下准备：

### 环境准备

- [ ] Yuanbao 验证已完成（达到 Alpha 标准）
- [ ] 熟悉样本采集流程
- [ ] 准备好脱敏工具和脚本

### 信息收集

- [ ] 访问 https://chat.deepseek.com 并登录
- [ ] 确认页面 URL 结构
- [ ] 打开开发者工具，观察 Network 请求
- [ ] 识别对话列表和详情的 API 端点

### 样本采集

- [ ] 采集至少 1 个对话详情响应（`detail-response.json`）
- [ ] 采集至少 1 个对话列表响应（`list-response.json`）
- [ ] 记录 API 请求的完整 URL
- [ ] 记录响应结构的关键字段

### 适配器调整

- [ ] 根据真实 API 调整 `src/adapters/deepseek.ts`
  - 更新 API 端点匹配模式
  - 调整响应解析逻辑
  - 更新字段映射
- [ ] 根据真实 DOM 调整选择器（如需要）
- [ ] 更新 `docs/DEEPSEEK_ADAPTER_NOTES.md`

### 验证脚本

- [ ] 复制 `scripts/capture-yuanbao-samples.ts` 为 `scripts/capture-deepseek-samples.ts`
- [ ] 复制 `scripts/validate-yuanbao-samples.ts` 为 `scripts/validate-deepseek-samples.ts`
- [ ] 调整脚本中的平台标识和端点模式

### 实测验证

- [ ] 在 DeepSeek 页面完成至少 **3 次** 成功导出
- [ ] 控制台日志完整，无错误
- [ ] UI 正常显示和交互
- [ ] 导出文件可打开且格式正确

### 文档更新

- [ ] 更新 `docs/ADAPTERS.md` 中的 DeepSeek 状态
- [ ] 更新 `docs/ALPHA_STATUS.md` 中的平台支持表
- [ ] 更新 `fixtures/deepseek/README.md` 中的样本说明

---

## 失败信息回收模板

当验证失败时，请使用以下模板收集信息并提交 Issue：

### Issue 模板

```markdown
## 验证失败报告

### 平台
- [ ] Yuanbao (yuanbao.tencent.com)
- [ ] DeepSeek (chat.deepseek.com)
- [ ] 其他：_______

### 环境信息
```
Node.js: v__._.__
Bun: v__._.__
浏览器：Chrome/Edge/Safari/Firefox __._.__
OS: macOS/Windows/Linux __._.__
Tampermonkey: v__._.__
```

### 验证阶段
- [ ] 构建失败
- [ ] 安装失败
- [ ] 加载失败
- [ ] 拦截失败
- [ ] 导出失败
- [ ] 其他：_______

### 问题描述
[详细描述遇到的问题]

### 控制台日志
```
[粘贴完整的控制台日志]
```

### Network 信息
- Detail API: [有/无/失败]
- List API: [有/无/失败]
- 响应结构：[正常/异常/未知]

### 已尝试的解决方案
1. [尝试 1]
2. [尝试 2]

### 附加文件
- [ ] detail-response.json（如已采集）
- [ ] list-response.json（如已采集）
- [ ] console-logs.txt
- [ ] 截图

### 复现步骤
1. [步骤 1]
2. [步骤 2]
3. [步骤 3]
```

### 诊断脚本

```bash
# 运行诊断脚本收集信息
bun run scripts/diagnose-yuanbao.ts

# 输出诊断报告
# 将报告内容粘贴到 Issue 中
```

---

## 与当前测试体系的配合

### 测试流程

```
开发阶段
    ↓
1. 本地自动测试
   ├── bun run typecheck
   ├── bun run build
   ├── bun test
   └── scripts/verify-build.ts
    ↓
2. 静态页面测试
   └── open test-integration.html
    ↓
3. Tampermonkey 实测
   ├── 安装 userscript
   ├── 访问真实页面
   ├── 验证拦截和导出
   └── 采集样本
    ↓
4. 样本验证
   ├── scripts/validate-yuanbao-samples.ts
   └── 人工检查脱敏
    ↓
5. 发布检查
   └── docs/RELEASE_CHECKLIST.md
```

### 测试基建复用

| 现有脚本 | 用途 | 可复用于 |
|----------|------|----------|
| `scripts/verify-build.ts` | 构建产物验证 | 所有平台 |
| `scripts/load-fixtures.ts` | Fixture 数据验证 | 所有平台 |
| `scripts/serve-test.ts` | 本地测试服务器 | 所有平台 |
| `scripts/validate-export.ts` | 导出文件验证 | 所有平台 |
| `scripts/capture-yuanbao-samples.ts` | Yuanbao 样本采集 | 复制后用于其他平台 |
| `scripts/validate-yuanbao-samples.ts` | Yuanbao 样本验证 | 复制后用于其他平台 |
| `scripts/diagnose-yuanbao.ts` | Yuanbao 诊断 | 复制后用于其他平台 |

### 测试数据管理

```
fixtures/
├── samples/                   # 通用测试数据
├── edge-cases/                # 边界情况
├── yuanbao/                   # Yuanbao 专用
│   └── samples/
├── yuanbao-live/              # Yuanbao 真实样本
├── deepseek/                  # DeepSeek 专用
│   └── samples/
├── deepseek-live/             # DeepSeek 真实样本（待创建）
└── {platform}/                # 其他平台
```

### 持续集成（未来）

```yaml
# GitHub Actions 示例（未来实现）
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run typecheck
      - run: bun run build
      - run: bun test
      - run: bun run scripts/verify-build.ts
      - run: bun run scripts/load-fixtures.ts
      
  # 真实页面测试需要人工或浏览器自动化（未来）
  # live-validation:
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v4
  #     - uses: browser-actions/setup-chrome@v1
  #     - run: bun install && bun run build
  #     - run: bun run scripts/live-validation.ts
  #       env:
  #         TEST_PLATFORM: yuanbao
  #         TEST_URL: ${{ secrets.TEST_URL }}
```

---

## 附录

### A. 快速验证命令

```bash
# 完整验证流程（Yuanbao）
bun install && \
bun run typecheck && \
bun run build && \
bun run scripts/verify-build.ts && \
bun run scripts/load-fixtures.ts && \
bun run scripts/validate-yuanbao-samples.ts

# 仅构建验证
bun run typecheck && bun run build && bun run scripts/verify-build.ts

# 仅样本验证
bun run scripts/validate-yuanbao-samples.ts

# 诊断
bun run scripts/diagnose-yuanbao.ts

# 构建后提示执行 Smoke Test
bun run build && \
echo "=== 构建完成 ===" && \
echo "请执行 Smoke Test: docs/TAMPERMONKEY_TEST_PLAN.md" && \
open userscripts/chat-export.v2.user.js
```

### B. 相关文件

| 文件 | 用途 |
|------|------|
| `docs/REAL_WORLD_VALIDATION.md` | 真实环境验证计划（本文档） |
| `docs/TAMPERMONKEY_TEST_PLAN.md` | Tampermonkey 浏览器测试计划 |
| `docs/YUANBAO_LIVE_VALIDATION.md` | Yuanbao 实测指南 |
| `docs/SAMPLE_CAPTURE_GUIDE.md` | 样本采集通用指南 |
| `docs/RELEASE_CHECKLIST.md` | 发布检查清单 |
| `docs/ALPHA_STATUS.md` | Alpha 状态说明 |
| `docs/E2E_VALIDATION.md` | E2E 验证指南 |
| `docs/TESTING_STRATEGY.md` | 测试策略 |

### C. 辅助脚本

| 脚本 | 用途 |
|------|------|
| `scripts/verify-build.ts` | 构建产物验证 |
| `scripts/load-fixtures.ts` | Fixture 数据验证 |
| `scripts/serve-test.ts` | 本地测试服务器 |
| `scripts/capture-yuanbao-samples.ts` | Yuanbao 样本采集 |
| `scripts/validate-yuanbao-samples.ts` | Yuanbao 样本验证 |
| `scripts/diagnose-yuanbao.ts` | Yuanbao 诊断报告 |
| `scripts/validate-export.ts` | 导出文件验证 |

---

**维护者**: Chat Export Toolkit Team  
**版本**: v0.7.0-alpha.1  
**状态**: 规划中
