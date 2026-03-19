# E2E 验证指南

本文档描述如何在本地验证 Chat Export Toolkit V2 的完整功能。

## 目录

- [快速开始](#快速开始)
- [验证场景](#验证场景)
- [测试步骤](#测试步骤)
- [预期结果](#预期结果)
- [故障排查](#故障排查)
- [限制说明](#限制说明)

---

## 快速开始

### 前置条件

```bash
# 1. 安装依赖
cd /Users/user/.openclaw/workspace/chat-export-toolkit
bun install

# 2. 类型检查
bun run typecheck

# 3. 构建
bun run build

# 4. 验证产物
ls -la userscripts/chat-export.v2.user.js
ls -la test-integration.html
ls -la fixtures/
```

### 验证方式总览

| 方式 | 环境 | 用途 | 依赖 |
|------|------|------|------|
| `test-integration.html` | 任意浏览器 | 完整链路测试 | 无 |
| `scripts/verify-build.ts` | Node.js | 构建验证 | bun |
| `scripts/load-fixtures.ts` | Node.js | 数据验证 | bun |
| Yuanbao 页面 | 真实站点 | 实际数据捕获 | 登录 |

---

## 验证场景

### 1. 初始化验证

**目标**: 验证 Toolkit 能否正确初始化所有组件

**测试入口**: `test-integration.html` → "加载 userscript" → "初始化"

**预期日志**:
```
[Toolkit] Runtime bridge initialized
[Toolkit] Store initialized
[Toolkit] Auto-detected platform: yuanbao
[Toolkit] Platform adapter initialized: yuanbao
[Toolkit] Normalizer initialized: yuanbao
[Toolkit] Default exporter initialized: json
[Toolkit] API interceptor installed
[Toolkit] UI initialized
[Toolkit] ✅ Initialization complete
```

### 2. UI 渲染验证

**目标**: 验证 FAB 按钮和导出面板正确显示

**测试步骤**:
1. 打开 `test-integration.html`
2. 点击 "加载 userscript"
3. 点击 "初始化"
4. 观察页面右下角是否出现 FAB 按钮 (🟦)
5. 点击 FAB 按钮，是否弹出导出面板

**预期结果**:
- FAB 按钮显示在右下角
- 点击后弹出面板包含:
  - 导出范围选择 (当前会话/全部会话)
  - 格式选择 (JSON/Markdown)
  - 导出按钮

### 3. 导出当前对话验证

**目标**: 验证最小可运行导出链路

**测试步骤**:
1. 完成初始化
2. 选择 "当前会话"
3. 选择 "JSON" 格式
4. 点击 "导出"

**预期结果**:
- 下载文件 `demo-export-json.json` (无缓存时使用 demo 数据)
- 文件内容包含:
  ```json
  {
    "id": "demo_conversation_001",
    "title": "Demo Conversation",
    "messages": [...],
    "metadata": {...}
  }
  ```

### 4. V1/V2 格式切换验证

**目标**: 验证 Markdown 导出格式

**测试步骤**:
1. 运行 `bun run scripts/verify-format-parity.ts`
2. 检查 `output/v1-reference.md`
3. 对比 `fixtures/v1-markdown-output.md`

**预期结果**:
- V1 格式使用 `## 角色 (Turn N)` 标题
- V2 格式使用 `### 第 N 轮 - 角色` 标题
- think 块格式不同

### 5. 错误提示验证

**目标**: 验证错误处理

**测试场景**:
- 未初始化时调用导出
- 不支持的导出格式
- 空对话导出

**预期结果**:
- 友好的错误消息
- UI 显示错误状态 (红色)
- 日志包含详细错误信息

---

## 测试步骤

### 方式 1: 静态测试页 (推荐)

```bash
# 1. 在浏览器中打开测试页
open test-integration.html

# 2. 按顺序执行:
#    a. 点击 "📦 加载 userscript"
#    b. 等待 "✅ Userscript 加载成功"
#    c. 点击 "🚀 初始化"
#    d. 等待 "✅ Toolkit 初始化成功"
#    e. 点击 "📄 导出 JSON" 或 "📝 导出 Markdown"
#    f. 检查下载的文件
```

### 方式 2: 命令行验证

```bash
# 1. 类型检查
bun run typecheck

# 2. 构建
bun run build

# 3. 格式对齐验证
bun run scripts/verify-format-parity.ts

# 4. 检查输出
cat output/v1-reference.md
```

### 方式 3: Fixture 数据验证

```bash
# 1. 加载并验证 fixture 数据
bun run scripts/load-fixtures.ts

# 2. 检查标准化结果
# 查看控制台输出的 Conversation 结构
```

### 方式 4: 真实站点测试

```bash
# 1. 打开 Yuanbao 页面
open https://yuanbao.tencent.com

# 2. 在控制台加载 userscript
# 复制 userscripts/chat-export.v2.user.js 内容并粘贴

# 3. 观察初始化日志
# 应该看到完整的初始化流程

# 4. 点击 FAB 按钮测试导出
# 验证实际数据捕获
```

---

## 预期结果

### 初始化成功标志

```
╔════════════════════════════════════════════════════════╗
║     Chat Export Toolkit V2                            ║
║     Version: 2.0.0-alpha                              ║
╚════════════════════════════════════════════════════════╝
[Toolkit] Initializing...
[Toolkit] Runtime bridge initialized
[Toolkit] Store initialized
[Toolkit] Auto-detected platform: yuanbao
[Toolkit] Platform adapter initialized: yuanbao
[Toolkit] Normalizer initialized: yuanbao
[Toolkit] Default exporter initialized: json
[Toolkit] API interceptor installed
[Toolkit] UI initialized
[Toolkit] ✅ Initialization complete
```

### 导出文件结构

**JSON 格式**:
```json
{
  "id": "conversation_id",
  "title": "对话标题",
  "messages": [
    {
      "id": "msg_001",
      "role": "user|assistant",
      "content": {
        "text": "消息内容",
        "attachments": []
      },
      "timestamp": 1710840000000,
      "metadata": {...}
    }
  ],
  "createdAt": 1710840000000,
  "updatedAt": 1710840000000,
  "metadata": {...}
}
```

**Markdown 格式**:
```markdown
# 对话标题

**导出时间**: 2024-03-19 16:00:00
**平台**: yuanbao
**消息数**: 4

---

### 第 1 轮 - 用户

> 时间：2024-03-19 16:00:00

你好，请介绍一下你自己。

---

### 第 2 轮 - 助手

> 时间：2024-03-19 16:00:05
> **思考过程:** 用户想了解我的基本信息...

你好！我是腾讯元宝...
```

---

## 故障排查

### 问题 1: Userscript 加载失败

**症状**: 显示 "❌ Userscript 加载失败"

**原因**: 文件路径错误或 CORS 限制

**解决**:
```bash
# 检查文件是否存在
ls -la userscripts/chat-export.v2.user.js

# 使用本地服务器
bun run --hot src/index.ts
# 或使用任意 HTTP 服务器
python3 -m http.server 8080
```

### 问题 2: 初始化卡住

**症状**: 日志停在某一步

**原因**: 平台检测失败或依赖未加载

**解决**:
```javascript
// 在控制台手动初始化
const toolkit = new ChatExportToolkit();
await toolkit.init({
  platform: 'yuanbao',
  autoDetect: false,
  ui: {}
});
```

### 问题 3: 导出空数据

**症状**: 导出的文件只有空壳

**原因**: 没有缓存数据且不在 Yuanbao 页面

**解决**:
- 这是预期行为 (使用 demo 数据)
- 在 Yuanbao 页面测试实际数据捕获

### 问题 4: UI 不显示

**症状**: 看不到 FAB 按钮

**原因**: UI 初始化失败或 CSS 冲突

**解决**:
```javascript
// 检查 UI 状态
console.log(window.testToolkit.ui);

// 手动渲染 UI
window.testToolkit.ui.render();
```

---

## 限制说明

### ✅ 可在本地验证的功能

1. **初始化流程** - 所有组件加载和注册
2. **UI 渲染** - FAB 按钮和导出面板
3. **Demo 数据导出** - JSON/Markdown 格式
4. **格式切换** - V1/V2 Markdown 格式对比
5. **类型检查** - TypeScript 编译
6. **构建产物** - userscript 生成

### ⚠️ 需要真实站点验证的功能

1. **实际数据捕获** - Interceptor 捕获 Yuanbao API 响应
2. **真实对话导出** - 从 Yuanbao 页面获取实际对话
3. **API 端点探测** - 发现实际的 API 端点
4. **全部会话导出** - 需要登录和多个会话
5. **持久化存储** - localStorage 在实际环境的行为

### 🔧 建议的测试流程

```
1. 本地构建验证
   └─> bun run typecheck && bun run build

2. 静态页面测试
   └─> open test-integration.html
   └─> 测试初始化和 Demo 导出

3. 格式对齐验证
   └─> bun run scripts/verify-format-parity.ts
   └─> 对比输出文件

4. 真实站点测试
   └─> 打开 Yuanbao 页面
   └─> 加载 userscript
   └─> 测试实际数据捕获和导出
```

---

## 附录

### A. Fixture 数据说明

| 文件 | 用途 |
|------|------|
| `sample-conversation.json` | 通用 Conversation 格式示例 |
| `v1-yuanbao-sample.json` | V1 Yuanbao 原始 API 响应 |
| `v2-normalized-conversation.json` | V2 标准化后格式 |
| `v1-markdown-output.md` | V1 Markdown 输出参考 |
| `v2-markdown-output.md` | V2 Markdown 输出参考 |

### B. 添加新 Fixture

```bash
# 边界情况测试数据
fixtures/edge-cases/
  ├── empty-conversation.json      # 空对话
  ├── single-message.json          # 单条消息
  ├── multiple-think-blocks.json   # 多个 think 块
  ├── special-characters.json      # 特殊字符
  ├── long-conversation.json       # 长对话 (100+ 消息)
  ├── code-blocks.json             # 包含代码块
  └── with-attachments.json        # 包含附件
```

### C. 验证脚本清单

| 脚本 | 用途 |
|------|------|
| `scripts/verify-build.ts` | 构建产物验证 |
| `scripts/verify-format-parity.ts` | V1/V2 格式对齐验证 |
| `scripts/load-fixtures.ts` | Fixture 数据加载验证 |

---

**维护者**: Chat Export Toolkit Team  
**最后更新**: 2024-03-19  
**版本**: V2.0.0-alpha
