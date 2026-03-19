# Yuanbao 真实页面验证指南

本文档描述如何在腾讯元宝真实页面上验证 Chat Export Toolkit V2 的拦截和导出功能。

> **📦 执行包**: `docs/YUANBAO_LIVE_EXECUTION_PACK.md` — 完整执行流程（**从这里开始**）  
> **关联文档**: 
> - `docs/REAL_WORLD_VALIDATION.md` — 真实环境验证计划总览
> - `docs/SAMPLE_CAPTURE_GUIDE.md` — 样本采集通用指南
> - `docs/RELEASE_CHECKLIST.md` — 发布检查清单
> - `docs/TAMPERMONKEY_TEST_PLAN.md` — Tampermonkey 测试计划

## 与验证计划的关系

本文档是 `docs/REAL_WORLD_VALIDATION.md` 中定义的 **L2: Tampermonkey 实测** 层级的具体实施指南。

- **L1 本地自动测试**: 由 `scripts/verify-build.ts`、`bun test` 等覆盖
- **L2 Tampermonkey 实测**: 由本文档覆盖 ← 你在这里
- **L3 真实样本验证**: 由 `scripts/capture-yuanbao-samples.ts` 和样本采集流程覆盖

## 目录

- [前置准备](#前置准备)
- [安装步骤](#安装步骤)
- [打开页面后看什么](#打开页面后看什么)
- [抓取 Network 样本](#抓取 network-样本)
- [判断拦截成功](#判断拦截成功)
- [导出成功判定标准](#导出成功判定标准)
- [失败时收集信息](#失败时收集信息)
- [只能人工验证的项目](#只能人工验证的项目)

---

## 前置准备

### 环境要求

| 项目 | 要求 | 验证命令 |
|------|------|----------|
| 浏览器 | Chrome/Edge 最新版 | - |
| Node.js | v20+ (推荐 fnm 管理) | `node -v` |
| Bun | v1.0+ | `bun -v` |
|  Yuanbao 账号 | 有效登录态 | 手动访问验证 |

### 仓库准备

```bash
# 1. 进入仓库
cd /Users/user/.openclaw/workspace/chat-export-toolkit

# 2. 安装依赖
bun install

# 3. 类型检查
bun run typecheck

# 4. 构建 userscript
bun run build

# 5. 验证构建产物
bun run scripts/verify-build.ts
```

### 预期输出

```
✅ Userscript 存在
✅ Userscript 大小：XX KB
✅ Userscript 元数据：完整
✅ 测试页存在
✅ 测试页引用：正确
✅ Fixtures 目录：包含 edge-cases
✅ 文档完整

📊 验证结果：7 通过，0 失败
✅ 所有检查通过！构建产物完整。
```

---

## 安装步骤

### 方式 1: Tampermonkey/Violentmonkey (推荐)

1. **安装浏览器扩展**
   - Chrome: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Edge: [Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. **加载 Userscript**
   ```bash
   # 方式 A: 直接打开文件 (推荐)
   open userscripts/chat-export.v2.user.js
   
   # 方式 B: 在 Tampermonkey 中手动创建
   # - 点击扩展图标 → 添加新脚本
   # - 复制 userscripts/chat-export.v2.user.js 内容
   # - 保存
   ```

3. **验证安装**
   - 访问 https://yuanbao.tencent.com
   - 打开开发者工具 (F12)
   - 查看控制台是否有 `[YuanbaoAdapter]` 相关日志

### 方式 2: 控制台临时加载 (调试用)

```javascript
// 1. 访问 https://yuanbao.tencent.com
// 2. 打开开发者工具控制台 (F12 → Console)
// 3. 复制并粘贴以下内容：

(async function() {
  const scriptUrl = 'https://raw.githubusercontent.com/your-repo/chat-export-toolkit/main/userscripts/chat-export.v2.user.js';
  const script = document.createElement('script');
  script.src = scriptUrl;
  script.onload = () => console.log('✅ Chat Export Toolkit 加载成功');
  script.onerror = () => console.error('❌ 加载失败，请检查网络或 CORS');
  document.head.appendChild(script);
})();
```

### 方式 3: 本地服务器加载 (开发用)

```bash
# 1. 启动本地服务器
bun run scripts/serve-test.ts

# 2. 在 Yuanbao 页面控制台执行
const script = document.createElement('script');
script.src = 'http://localhost:3000/userscripts/chat-export.v2.user.js';
document.head.appendChild(script);
```

---

## 打开页面后看什么

### 1. 控制台日志

打开 Yuanbao 页面后，应该看到以下日志：

```
╔════════════════════════════════════════════════════════╗
║     Chat Export Toolkit V2                            ║
║     Version: 2.0.0-alpha                              ║
╚════════════════════════════════════════════════════════╝

[YuanbaoAdapter] detect called
[YuanbaoAdapter] Platform detected: yuanbao.tencent.com
[YuanbaoAdapter] init called
[YuanbaoAdapter] API interceptor installed
[YuanbaoNormalizer] init called
[Toolkit] ✅ Initialization complete
```

### 2. UI 元素

- **FAB 按钮**: 页面右下角应出现 🟦 浮动按钮
- **导出面板**: 点击 FAB 后弹出，包含：
  - 导出范围选择 (当前会话 / 全部会话)
  - 格式选择 (JSON / Markdown / DOCX)
  - 导出按钮

### 3. Network 面板

打开开发者工具 → Network 标签，筛选 `yuanbao` 或 `conversation`，应该看到：

| 请求类型 | URL 模式 | 说明 |
|----------|----------|------|
| XHR/Fetch | `/api/user/agent/conversation/v2/detail` | 获取对话详情 |
| XHR/Fetch | `/api/user/agent/conversation/v2/list` | 获取对话列表 |

---

## 抓取 Network 样本

### 步骤 1: 准备抓包环境

```bash
# 1. 打开开发者工具 (F12)
# 2. 切换到 Network 标签
# 3. 勾选 "Preserve log" (保留日志)
# 4. 在筛选框输入：yuanbao OR conversation OR api
```

### 步骤 2: 触发 API 请求

1. **刷新页面** - 触发对话列表请求
2. **切换对话** - 触发对话详情请求
3. **发送消息** - 触发消息发送和响应

### 步骤 3: 保存请求样本

#### 保存对话详情请求

```bash
# 1. 在 Network 面板找到 detail 请求
# 2. 右键 → Copy → Copy as cURL
# 3. 保存为：fixtures/yuanbao-live/detail-request.curl

# 4. 右键 → Copy response
# 5. 保存为：fixtures/yuanbao-live/detail-response.json
```

#### 保存对话列表请求

```bash
# 1. 在 Network 面板找到 list 请求
# 2. 右键 → Copy → Copy as cURL
# 3. 保存为：fixtures/yuanbao-live/list-request.curl

# 4. 右键 → Copy response
# 5. 保存为：fixtures/yuanbao-live/list-response.json
```

### 步骤 4: 使用辅助脚本

```bash
# 运行样本采集脚本
bun run scripts/capture-yuanbao-samples.ts

# 脚本会提示你：
# 1. 打开 Yuanbao 页面
# 2. 执行指定的 JavaScript 代码
# 3. 将输出粘贴到终端
# 4. 自动保存到 fixtures/yuanbao-live/
```

### 样本文件结构

```
fixtures/yuanbao-live/
├── README.md                    # 样本说明
├── detail-request.curl          # 详情请求 cURL
├── detail-response.json         # 详情响应样本
├── list-request.curl            # 列表请求 cURL
├── list-response.json           # 列表响应样本
└── capture-log.txt              # 采集日志
```

---

## 判断拦截成功

### 拦截成功的标志

#### 1. 控制台日志

```
[Interceptor] Fetch intercepted: POST /api/user/agent/conversation/v2/detail
[YuanbaoAdapter] handleResponse called
[YuanbaoAdapter] Conversation cached: abc123
[YuanbaoAdapter] ✅ Response processed successfully
```

#### 2. UI 状态

- FAB 按钮从 🟦 (就绪) 变为 🟩 (有数据)
- 导出面板显示当前对话标题
- 消息计数正确显示

#### 3. 验证命令

在控制台执行：

```javascript
// 检查是否有缓存数据
console.log(window.testToolkit?.store?.state?.currentConversation);

// 检查拦截器状态
console.log(window.testToolkit?.interceptor?.isInstalled);

// 手动触发一次导出测试
await window.testToolkit?.exportCurrentConversation('json');
```

### 拦截失败的排查

#### 症状 1: 没有日志输出

**原因**: Userscript 未加载或平台检测失败

**排查**:
```javascript
// 检查 userscript 是否加载
console.log(typeof window.ChatExportToolkit); // 应该是 "function"

// 检查平台检测
console.log(window.location.hostname); // 应该是 "yuanbao.tencent.com"
```

#### 症状 2: 有日志但无缓存

**原因**: API 端点不匹配或响应结构变化

**排查**:
```javascript
// 检查拦截的 URL
console.log(window.testToolkit?.interceptor?.capturedUrls);

// 检查最近的响应
console.log(window.testToolkit?.store?.state?.lastInterceptedResponse);
```

#### 症状 3: 缓存数据但解析失败

**原因**: 响应结构变化

**排查**:
```javascript
// 查看原始响应
const raw = window.testToolkit?.store?.state?.currentConversation;
console.log(JSON.stringify(raw, null, 2));

// 检查解析错误
console.log(window.testToolkit?.store?.state?.lastError);
```

---

## 导出成功判定标准

### JSON 格式

#### 文件结构

```json
{
  "id": "conversation_id",
  "title": "对话标题",
  "platform": "yuanbao",
  "messages": [
    {
      "id": "msg_001",
      "role": "user|assistant",
      "content": {
        "text": "消息内容",
        "attachments": []
      },
      "timestamp": 1710840000000,
      "metadata": {
        "turnIndex": 1,
        "speechesV2": [...]
      }
    }
  ],
  "createdAt": 1710840000000,
  "updatedAt": 1710840000000,
  "metadata": {
    "platform": "yuanbao",
    "messageCount": 4,
    "participantCount": 2
  }
}
```

#### 验证清单

- [ ] `id` 字段存在且非空
- [ ] `title` 字段存在
- [ ] `messages` 是数组且长度 > 0
- [ ] 每条消息有 `id`, `role`, `content`, `timestamp`
- [ ] `role` 是 `user` 或 `assistant`
- [ ] `content.text` 是字符串
- [ ] `metadata.platform` 是 `yuanbao`

### Markdown 格式

#### 文件结构

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

#### 验证清单

- [ ] 标题使用 `#` 格式
- [ ] 包含元数据部分 (导出时间、平台、消息数)
- [ ] 每条消息有分隔线 `---`
- [ ] 消息标题使用 `### 第 N 轮 - 角色` 格式
- [ ] 时间戳使用引用格式 `> 时间：...`
- [ ] think 块使用 `> **思考过程:**` 格式
- [ ] 无乱码或 HTML 残留

### 验证脚本

```bash
# 运行导出验证脚本
bun run scripts/validate-export.ts --file ./output/test-export.json

# 输出示例：
# ✅ JSON 结构验证通过
# ✅ 消息数：4
# ✅ 所有消息包含必要字段
# ✅ 平台标识正确：yuanbao
```

---

## 失败时收集信息

### 信息收集清单

当验证失败时，请收集以下信息：

#### 1. 环境信息

```bash
# 在终端执行
node -v
bun -v
echo "OS: $(uname -a)"
echo "Browser: $(google-chrome --version 2>/dev/null || echo 'Chrome not found')"
```

#### 2. 控制台日志

```javascript
// 在 Yuanbao 页面控制台执行
const logs = [];
const originalLog = console.log;
console.log = (...args) => {
  logs.push(args.join(' '));
  originalLog.apply(console, args);
};

// 重新初始化
location.reload();

// 等待 5 秒后导出日志
setTimeout(() => {
  console.log('=== 日志开始 ===');
  logs.forEach(l => console.log(l));
  console.log('=== 日志结束 ===');
  
  // 下载日志
  const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `yuanbao-logs-${Date.now()}.txt`;
  a.click();
}, 5000);
```

#### 3. Network 样本

```javascript
// 在控制台执行，导出最近的 Network 请求
const requests = performance.getEntriesByType('resource')
  .filter(r => r.name.includes('yuanbao') || r.name.includes('api'))
  .map(r => ({
    name: r.name,
    type: r.initiatorType,
    duration: r.duration,
    startTime: r.startTime
  }));

console.log(JSON.stringify(requests, null, 2));
```

#### 4. 导出错误信息

```javascript
// 尝试导出并捕获错误
try {
  await window.testToolkit?.exportCurrentConversation('json');
} catch (error) {
  console.error('导出错误:', error);
  console.error('错误堆栈:', error.stack);
}
```

### 使用辅助脚本

```bash
# 运行诊断脚本
bun run scripts/diagnose-yuanbao.ts

# 脚本会：
# 1. 检查环境
# 2. 检查构建产物
# 3. 检查 fixtures
# 4. 生成诊断报告
```

### 诊断报告模板

```markdown
## Yuanbao 验证失败报告

### 环境
- Node.js: v20.x.x
- Bun: v1.x.x
- 浏览器：Chrome 120.x
- OS: macOS 14.x

### 问题描述
[描述具体问题]

### 控制台日志
```
[粘贴日志]
```

### Network 样本
- detail 请求：[有/无]
- list 请求：[有/无]
- 响应结构：[正常/异常]

### 已尝试的解决方案
1. [尝试 1]
2. [尝试 2]

### 附加文件
- [ ] detail-response.json
- [ ] list-response.json
- [ ] console-logs.txt
```

---

## 只能人工验证的项目

以下项目无法通过自动化脚本完成，必须人工在真实站点验证：

### 1. 登录态验证

- **原因**: 需要真实账号登录
- **验证内容**:
  - 登录后才能看到对话列表
  - 未登录时提示登录
  - 登录过期时的处理

### 2. 真实对话数据

- **原因**: 需要真实的历史对话
- **验证内容**:
  - 长对话 (>100 条消息) 导出
  - 包含图片的对话导出
  - 包含代码块的对话导出
  - 包含 think 块的对话导出

### 3. 实时交互

- **原因**: 需要实时发送消息
- **验证内容**:
  - 发送消息后立即导出
  - 消息流式输出时的拦截
  - 网络中断后的恢复

### 4. 批量导出

- **原因**: 需要多个真实对话
- **验证内容**:
  - 导出全部对话 (>10 个)
  - ZIP 打包功能
  - 导出进度显示

### 5. UI 交互体验

- **原因**: 主观体验评估
- **验证内容**:
  - FAB 按钮位置是否遮挡内容
  - 导出面板响应速度
  - 错误提示是否友好
  - 暗色模式适配

### 6. 跨浏览器兼容性

- **原因**: 需要多浏览器测试
- **验证内容**:
  - Chrome
  - Edge
  - Safari (如支持)
  - Firefox (如支持)

### 7. 性能测试

- **原因**: 需要真实数据量
- **验证内容**:
  - 大对话导出时间 (>50 条消息)
  - 批量导出时间 (>20 个对话)
  - 内存占用
  - 页面卡顿情况

---

## 附录

### A. 快速验证命令

```bash
# 1. 构建验证
bun run typecheck && bun run build && bun run scripts/verify-build.ts

# 2. Fixture 验证
bun run scripts/load-fixtures.ts

# 3. 启动测试服务器
bun run scripts/serve-test.ts

# 4. 打开测试页
open http://localhost:3000/test-integration.html
```

### B. 相关文件

| 文件 | 用途 |
|------|------|
| `userscripts/chat-export.v2.user.js` | Userscript 主文件 |
| `test-integration.html` | 本地集成测试页 |
| `src/adapters/yuanbao.ts` | Yuanbao 适配器实现 |
| `src/normalizers/yuanbao.ts` | Yuanbao 标准化器 |
| `docs/ADAPTERS.md` | 适配器开发指南 |
| `docs/E2E_VALIDATION.md` | E2E 验证指南 |

### C. 辅助脚本

| 脚本 | 用途 |
|------|------|
| `scripts/verify-build.ts` | 构建产物验证 |
| `scripts/load-fixtures.ts` | Fixture 数据验证 |
| `scripts/serve-test.ts` | 本地测试服务器 |
| `scripts/capture-yuanbao-samples.ts` | 样本采集辅助 |
| `scripts/validate-export.ts` | 导出文件验证 |
| `scripts/diagnose-yuanbao.ts` | 诊断报告生成 |

---

**维护者**: Chat Export Toolkit Team  
**最后更新**: 2024-03-19  
**版本**: V2.0.0-alpha
