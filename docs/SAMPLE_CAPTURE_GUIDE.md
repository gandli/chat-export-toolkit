# 样本采集通用指南

本指南提供标准化的样本采集方法，用于为各平台（ChatGPT、Claude、Gemini、腾讯元宝、Kimi、豆包等）采集真实数据样本，供适配器开发、测试和文档使用。

> **关联文档**: 
> - `docs/REAL_WORLD_VALIDATION.md` — 真实环境验证计划总览
> - `docs/{PLATFORM}_LIVE_VALIDATION.md` — 平台特定验证指南
> - `docs/RELEASE_CHECKLIST.md` — 发布检查清单

## 与验证计划的关系

本指南是 `docs/REAL_WORLD_VALIDATION.md` 中定义的 **L3: 真实样本验证** 层级的具体实施指南。

- **L1 本地自动测试**: 由单元测试、Golden 测试覆盖
- **L2 Tampermonkey 实测**: 由平台验证指南覆盖
- **L3 真实样本验证**: 由本文档覆盖 ← 你在这里

样本采集的目标：
1. 为适配器开发提供真实 API 响应参考
2. 为测试提供边界情况数据
3. 为发布提供验收证据（Alpha 门槛要求）

---

## 目录

- [快速开始](#快速开始)
- [DOM/HTML 样本采集](#domhtml-样本采集)
- [Network/API 响应样本采集](#networkapi-响应样本采集)
- [敏感信息脱敏](#敏感信息脱敏)
- [样本命名规范](#样本命名规范)
- [样本目录模板](#样本目录模板)
- [提交前检查项](#提交前检查项)
- [平台差异记录](#平台差异记录)

---

## 快速开始

### 准备工作

1. **浏览器**: Chrome/Edge（推荐）或 Firefox
2. **开发者工具**: 熟悉 Network、Console、Elements 标签
3. **文本编辑器**: 用于编辑和脱敏样本文件
4. **命令行工具**: `curl`, `jq` (可选，用于格式化 JSON)

### 采集流程概览

```
1. 访问目标平台网页版 → 2. 打开开发者工具 → 3. 执行操作触发 API 请求
   ↓
4. 捕获请求和响应 → 5. 脱敏处理 → 6. 保存到 fixtures/
```

---

## DOM/HTML 样本采集

### 何时采集 DOM 样本

- 页面结构复杂，需要参考实际 HTML 结构
- 需要提取页面中的元数据（标题、时间、参与者等）
- 开发页面解析器或选择器
- 记录 UI 组件的 HTML 标记

### 采集方法

#### 方法 1: 通过开发者工具

1. 打开目标页面，进入需要采集的状态（如对话页面）
2. 按 `F12` 打开开发者工具
3. 在 **Elements** 标签中定位目标元素
4. 右键 → **Copy** → **Copy outerHTML** (或 **Copy element**)
5. 保存为 `.html` 文件

#### 方法 2: 使用控制台命令

在 **Console** 标签中执行：

```javascript
// 采集整个页面的 HTML
const html = document.documentElement.outerHTML;
console.log(html);
// 或下载为文件
const blob = new Blob([html], { type: 'text/html' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `page-snapshot-${Date.now()}.html`;
a.click();
```

```javascript
// 采集特定容器（如对话列表）
const container = document.querySelector('#app, .main-container, [data-testid="conversation-list"]');
if (container) {
  const html = container.outerHTML;
  console.log(html);
}
```

#### 方法 3: 使用自动化脚本

创建采集脚本（参考 `scripts/capture-yuanbao-samples.ts`）：

```typescript
// 示例：采集页面关键信息
const snapshot = {
  timestamp: new Date().toISOString(),
  url: window.location.href,
  title: document.title,
  meta: {
    description: document.querySelector('meta[name="description"]')?.content,
    // 其他元数据...
  },
  conversationList: document.querySelectorAll('.conversation-item').length,
  // 其他需要采集的数据...
};
```

### DOM 样本保存格式

```
fixtures/
└── {platform}-dom/
    ├── README.md              # 说明文件
    ├── conversation-list.html # 对话列表页 HTML
    ├── conversation-detail.html  # 对话详情页 HTML
    └── snapshot-{timestamp}.json   # 页面元数据快照
```

### 注意事项

- ✅ 保存完整的 HTML 结构，包括 class 名、data 属性
- ✅ 记录采集时的 URL 和页面状态
- ⚠️ 移除动态生成的内容（如时间戳、随机 ID）
- ⚠️ 移除个人对话内容，替换为占位符

---

## Network/API 响应样本采集

### 何时采集 API 样本

- 开发 API 适配器
- 理解平台数据格式
- 测试解析器
- 记录 API 变更

### 采集方法

#### 步骤 1: 准备环境

1. 访问目标平台网页版并登录
2. 按 `F12` 打开开发者工具
3. 切换到 **Network** 标签
4. 勾选 **Preserve log** (保留日志)
5. 可选：勾选 **Disable cache** (禁用缓存)

#### 步骤 2: 筛选请求

在筛选框输入关键词：

| 平台 | 关键词示例 |
|------|-----------|
| 腾讯元宝 | `detail`, `list`, `conversation`, `api/user/agent` |
| ChatGPT | `conversation`, `messages`, `api/2023` |
| Claude | `conversation`, `organizations`, `api/anthropic` |
| Kimi | `chat`, `conversation`, `api/moonshot` |
| 豆包 | `chat`, `conversation`, `api/bytedance` |

#### 步骤 3: 捕获请求

1. 执行操作触发 API 请求（如切换对话、发送消息）
2. 在 Network 列表中找到目标请求
3. 确认请求方法（通常是 `POST` 或 `GET`）

#### 步骤 4: 复制请求

**方法 A: cURL 格式（推荐）**

1. 右键请求 → **Copy** → **Copy as cURL**
2. 保存为 `{request-type}-request.curl`
3. 优点：包含完整请求头，可直接重放

**方法 B: Fetch 格式**

1. 右键请求 → **Copy** → **Copy as fetch**
2. 保存为 `{request-type}-fetch.js`
3. 优点：便于在 Node.js 环境中测试

**方法 C: 手动记录**

记录以下信息到 `{request-type}-request.json`：

```json
{
  "method": "POST",
  "url": "https://api.example.com/v1/conversation/detail",
  "headers": {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 ..."
  },
  "body": {
    "conversationId": "xxx"
  }
}
```

#### 步骤 5: 复制响应

1. 点击请求，切换到 **Response** 标签
2. 右键 → **Copy response** (或全选复制)
3. 保存为 `{request-type}-response.json`
4. 使用 `jq` 格式化：`cat response.json | jq '.' > formatted.json`

### API 样本保存格式

```
fixtures/
└── {platform}-live/
    ├── README.md                    # 采集说明
    ├── detail-request.curl          # 详情请求 cURL
    ├── detail-response.json         # 详情响应
    ├── list-request.curl            # 列表请求 cURL
    ├── list-response.json           # 列表响应
    ├── chat-request.curl            # 发送消息请求 (可选)
    ├── chat-response.json           # 发送消息响应 (可选)
    └── capture-log.txt              # 采集日志 (可选)
```

### 响应结构示例

```json
{
  "_meta": {
    "platform": "yuanbao",
    "capturedAt": "2024-03-19T10:00:00.000Z",
    "apiVersion": "v2",
    "endpoint": "/api/user/agent/conversation/v2/detail"
  },
  "conversationId": "[REDACTED]",
  "sessionTitle": "示例对话",
  "convs": [
    {
      "speaker": "user",
      "index": 1,
      "speechesV2": [
        {
          "content": [
            { "type": "text", "msg": "示例消息内容" }
          ]
        }
      ]
    }
  ],
  "createTime": 1710840000000,
  "updateTime": 1710840000000
}
```

---

## 敏感信息脱敏

### ⚠️ 必须脱敏的字段

| 类型 | 字段示例 | 脱敏方法 |
|------|---------|---------|
| **认证信息** | `Cookie`, `Authorization`, `X-Token` | 替换为 `[REDACTED]` |
| **用户标识** | `userId`, `sessionId`, `deviceId` | 替换为 `[USER_ID]` 或保留格式 |
| **对话内容** | 真实对话文本 | 替换为占位符或虚构内容 |
| **时间戳** | 精确到秒的时间 | 保留相对时间，模糊化绝对时间 |
| **URL 参数** | `?token=xxx&user=yyy` | 移除或替换参数值 |

### 脱敏命令示例

#### 使用 sed (macOS/Linux)

```bash
# 脱敏 Cookie
sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' request.curl

# 脱敏 Authorization
sed -i '' 's/Authorization: [^"]*/Authorization: [REDACTED]/g' request.curl

# 脱敏用户 ID (保留格式)
sed -i '' 's/"userId": "[^"]*"/"userId": "[USER_ID]"/g' response.json

# 脱敏对话 ID
sed -i '' 's/"conversationId": "[^"]*"/"conversationId": "[CONVERSATION_ID]"/g' response.json
```

#### 使用 jq (JSON 文件)

```bash
# 脱敏特定字段
jq '.conversationId = "[CONVERSATION_ID]" | .userId = "[USER_ID]"' response.json > sanitized.json

# 批量脱敏多个字段
jq '
  .conversationId = "[CONVERSATION_ID]" |
  .userId = "[USER_ID]" |
  .sessionId = "[SESSION_ID]" |
  .convs[].speechesV2[].content[].msg = "[MESSAGE_CONTENT]"
' response.json > sanitized.json
```

#### 使用文本编辑器

在 VS Code 等编辑器中使用正则替换：

```
# 查找
"Cookie": "[^"]*"
# 替换
"Cookie": "[REDACTED]"

# 查找
"userId": "\w+"
# 替换
"userId": "[USER_ID]"
```

### 脱敏检查清单

- [ ] Cookie 字段已移除或替换
- [ ] Authorization header 已移除或替换
- [ ] 其他认证 token 已移除（如 `X-API-Key`, `Access-Token`）
- [ ] 用户 ID、会话 ID 已脱敏
- [ ] 真实对话内容已替换
- [ ] 个人身份信息（姓名、邮箱、电话）已移除
- [ ] URL 中的敏感参数已处理

---

## 样本命名规范

### 文件名格式

```
{平台}-{类型}-{描述}.扩展名
```

**示例**:

```
yuanbao-detail-response.json
chatgpt-list-request.curl
claude-conversation-sample.json
kimi-chat-response.json
```

### 目录命名

```
fixtures/
├── {platform}-live/         # 真实 API 样本
├── {platform}-dom/          # DOM/HTML 样本
├── edge-cases/              # 边界情况样本
└── samples/                 # 通用样本模板
```

### 平台名称映射

| 平台 | 目录名前缀 | 备注 |
|------|-----------|------|
| 腾讯元宝 | `yuanbao` | - |
| ChatGPT | `chatgpt` | - |
| Claude | `claude` | - |
| Gemini | `gemini` | - |
| Kimi | `kimi` | - |
| 豆包 | `doubao` | - |
| 文心一言 | `ernie` | - |
| 通义千问 | `qianwen` | - |

### 类型标识

| 类型 | 后缀 | 说明 |
|------|------|------|
| 列表请求 | `-list-request` | 获取对话列表 |
| 列表响应 | `-list-response` | 列表 API 响应 |
| 详情请求 | `-detail-request` | 获取对话详情 |
| 详情响应 | `-detail-response` | 详情 API 响应 |
| 聊天请求 | `-chat-request` | 发送消息请求 |
| 聊天响应 | `-chat-response` | 消息 API 响应 |
| DOM 快照 | `-snapshot` | 页面 HTML 快照 |

### 版本标注

如 API 有版本差异，在文件名中标注：

```
yuanbao-v2-detail-response.json
yuanbao-v1-detail-response.json  # 旧版本
```

---

## 样本目录模板

### 标准目录结构

```
fixtures/
└── {platform}-live/
    ├── README.md                    # 必需：采集说明和样本结构
    ├── detail-request.curl          # 推荐：详情请求 cURL
    ├── detail-response.json         # 必需：详情响应样本
    ├── list-request.curl            # 推荐：列表请求 cURL
    ├── list-response.json           # 必需：列表响应样本
    ├── chat-request.curl            # 可选：发送消息请求
    ├── chat-response.json           # 可选：发送消息响应
    ├── capture-log.txt              # 可选：采集日志
    └── yuanbao-samples-{timestamp}.json  # 可选：自动采集样本
```

### README.md 模板

```markdown
# {平台名称} 真实页面样本

此目录包含从 {平台名称} 真实页面采集的 API 请求和响应样本。

## 快速开始

### 采集样本

```bash
# 1. 访问 {平台 URL} 并登录
# 2. 打开开发者工具 (F12)
# 3. 运行采集脚本（如有）
bun run scripts/capture-{platform}-samples.ts
# 4. 按提示执行控制台代码
```

### 验证样本

```bash
bun run scripts/validate-{platform}-samples.ts
```

## 文件说明

| 文件 | 说明 | 必需 |
|------|------|------|
| `detail-request.curl` | 对话详情 API 请求 | 推荐 |
| `detail-response.json` | 对话详情 API 响应 | ✅ |
| `list-request.curl` | 对话列表 API 请求 | 推荐 |
| `list-response.json` | 对话列表 API 响应 | ✅ |

## 手动采集步骤

1. 打开 {平台 URL}
2. 打开开发者工具 (F12) → Network 标签
3. 筛选：{关键词}
4. 找到详情请求
   - 右键 → Copy → Copy as cURL → 保存为 detail-request.curl
   - 右键 → Copy response → 保存为 detail-response.json
5. 找到列表请求，重复上述步骤

## 样本结构

### detail-response.json

```json
{
  "conversationId": "xxx",
  "sessionTitle": "会话标题",
  "convs": [...]
}
```

## 注意事项

- ⚠️ 提交前请移除 Cookie、Authorization 等敏感信息
- ⚠️ 使用脱敏数据，不要包含真实对话内容
- ⚠️ 标注采集时间，API 可能随时间变化

## 相关文档

- [ADAPTERS.md](../docs/ADAPTERS.md) - 适配器开发指南
- [SAMPLE_CAPTURE_GUIDE.md](../docs/SAMPLE_CAPTURE_GUIDE.md) - 样本采集通用指南

---

**采集时间**: YYYY-MM-DD  
**维护者**: Chat Export Toolkit Team
```

---

## 提交前检查项

### 文件完整性

- [ ] 包含必需的响应文件（detail-response.json, list-response.json）
- [ ] 包含 README.md 说明文件
- [ ] JSON 文件格式正确（使用 `jq '.' file.json` 验证）
- [ ] cURL 命令可执行（脱敏后测试）

### 脱敏检查

- [ ] 无 Cookie、Authorization 等认证信息
- [ ] 无真实用户 ID、会话 ID
- [ ] 无真实对话内容
- [ ] 无个人身份信息

### 格式规范

- [ ] 文件名符合命名规范
- [ ] JSON 使用 2 空格缩进
- [ ] 包含 `_meta` 字段（平台、采集时间、API 版本）
- [ ] README 包含采集时间和维护者信息

### 验证脚本

运行项目提供的验证脚本（如有）：

```bash
# 验证 JSON 格式
bun run scripts/validate-{platform}-samples.ts

# 验证样本完整性
bun run scripts/load-fixtures.ts
```

### Git 提交前

```bash
# 检查变更
git diff fixtures/{platform}-live/

# 确认无敏感信息泄露
git diff --check
```

---

## 平台差异记录

### 差异记录模板

在 `docs/ADAPTERS.md` 或平台特定文档中记录：

```markdown
## {平台名称} 差异点

### API 端点

- 列表：`{URL}`
- 详情：`{URL}`
- 发送消息：`{URL}`

### 认证方式

- Cookie / Token / OAuth / 其他

### 响应结构特点

- 消息块类型：`text`, `think`, `code`, `image`, ...
- 时间戳格式：Unix 毫秒 / ISO 8601 / 其他
- 分页方式：cursor / offset / page

### 特殊处理

- Think 块处理方式
- 代码块语法标记
- 附件/图片处理
- 流式响应处理

### 已知限制

- API 速率限制
- 历史消息数量限制
- 其他限制

### 采集注意事项

- 特殊请求头要求
- 需要登录状态
- 其他特殊要求
```

### 平台差异对比表

| 特性 | 元宝 | ChatGPT | Claude | Kimi | 豆包 |
|------|------|---------|--------|------|------|
| API 版本 | v2 | 2023-xx | v1 | v1 | v1 |
| 认证方式 | Cookie | Token | Session | Token | Cookie |
| Think 块 | ✅ | ❌ | ✅ | ✅ | ❌ |
| 流式响应 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 附件支持 | 图片 | 文件 + 图片 | 文件 + 图片 | 文件 | 图片 |

---

## 附录：常用命令

### JSON 格式化

```bash
# 使用 jq 格式化
cat response.json | jq '.' > formatted.json

# 提取特定字段
jq '.conversationId' response.json

# 统计消息数量
jq '.convs | length' response.json
```

### cURL 测试

```bash
# 执行 cURL 命令（脱敏后需替换 token）
bash detail-request.curl

# 保存响应
bash detail-request.curl > test-response.json
```

### 批量脱敏

```bash
# 批量处理多个文件
for file in *.json; do
  jq '.conversationId = "[CONVERSATION_ID]"' "$file" > "sanitized-$file"
done
```

### 验证 JSON

```bash
# 使用 jq 验证
jq '.' file.json > /dev/null && echo "Valid JSON" || echo "Invalid JSON"

# 使用 Python
python -m json.tool file.json > /dev/null && echo "Valid" || echo "Invalid"
```

---

## 相关文档

- [ADAPTERS.md](./ADAPTERS.md) - 适配器开发指南
- [E2E_VALIDATION.md](./E2E_VALIDATION.md) - E2E 验证指南
- [INTERCEPTOR_USAGE.md](./INTERCEPTOR_USAGE.md) - 拦截器使用指南

---

**版本**: 1.0.0  
**最后更新**: 2024-03-19  
**维护者**: Chat Export Toolkit Team

---

## 附录：腾讯元宝专项指南

### Yuanbao 平台特点

腾讯元宝（yuanbao.tencent.com）的 API 有以下特点：

1. **API 版本**: 当前为 v2，端点包含 `/v2/` 路径
2. **认证方式**: Cookie + 可能的 Authorization header
3. **响应结构**: 
   - 列表响应包含 `conversations` 数组
   - 详情响应包含 `convs` 数组，每条消息有 `speechesV2`
   - 支持 `think` 块（思考过程）
4. **消息类型**: `text`, `think`, `code`, `image` 等

### Yuanbao 专用采集命令

#### 快速采集脚本

```bash
# 运行采集辅助脚本
bun run scripts/capture-yuanbao-samples.ts

# 运行样本包准备脚本
bun run scripts/prepare-yuanbao-sample-pack.ts

# 运行验证脚本
bun run scripts/validate-yuanbao-samples.ts
```

#### 控制台采集代码

在 Yuanbao 页面控制台执行以下代码，可快速提取样本：

```javascript
// 采集最近的 detail 请求
const detailRequests = performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/api/user/agent/conversation/v2/detail'));
console.log('Detail requests:', detailRequests);

// 采集最近的 list 请求
const listRequests = performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/api/user/agent/conversation/v2/list'));
console.log('List requests:', listRequests);
```

### Yuanbao 样本包模板

完整的 Yuanbao 样本包应包含：

```
fixtures/yuanbao-live/
├── README.md                          # 样本说明
├── detail-request.curl                # 详情请求 cURL
├── detail-response.json               # 详情响应
├── list-request.curl                  # 列表请求 cURL
├── list-response.json                 # 列表响应
├── screenshots/
│   ├── detail-page.png                # 详情页截图
│   └── list-page.png                  # 列表页截图
├── html-snapshots/
│   ├── detail-page.html               # 详情页 HTML
│   └── list-page.html                 # 列表页 HTML
├── logs/
│   └── capture-*.txt                  # 采集日志
└── .sample-info.json                  # 样本元数据
```

### Yuanbao 脱敏专用命令

```bash
# 批量脱敏 cURL 文件
for file in fixtures/yuanbao-live/*-request.curl; do
  sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' "$file"
  sed -i '' 's/Authorization: [^"]*/Authorization: [REDACTED]/g' "$file"
done

# 批量脱敏 JSON 文件
for file in fixtures/yuanbao-live/*.json; do
  jq '.conversationId = "[CONVERSATION_ID]" | 
      .userId = "[USER_ID]" |
      .convs[].speechesV2[].content[] |= (
        if .type == "text" then .msg = "[消息内容]"
        elif .type == "think" then .content = "[思考内容]"
        else .
        end
      )' "$file" > tmp.json && mv tmp.json "$file"
done
```

### Yuanbao 验证检查项

```bash
# 检查必需文件
test -f fixtures/yuanbao-live/detail-response.json && echo "✅ detail-response.json 存在"
test -f fixtures/yuanbao-live/list-response.json && echo "✅ list-response.json 存在"

# 检查 JSON 格式
jq -e '.conversationId and .convs' fixtures/yuanbao-live/detail-response.json > /dev/null && echo "✅ detail-response.json 格式正确"
jq -e '.conversations' fixtures/yuanbao-live/list-response.json > /dev/null && echo "✅ list-response.json 格式正确"

# 检查敏感信息
grep -E "Cookie:|Authorization:" fixtures/yuanbao-live/*.curl | grep -v "\[REDACTED\]" && echo "⚠️ 发现未脱敏信息" || echo "✅ 敏感信息已脱敏"
```

### 相关文档

- [`docs/YUANBAO_SAMPLE_PACK.md`](./YUANBAO_SAMPLE_PACK.md) - Yuanbao 样本包提交规范（**重点**）
- [`docs/YUANBAO_LIVE_VALIDATION.md`](./YUANBAO_LIVE_VALIDATION.md) - Yuanbao 真实页面验证
- [`fixtures/yuanbao-live/README.md`](../fixtures/yuanbao-live/README.md) - 本地样本说明

---

## 附录：DeepSeek 专项指南

### DeepSeek 平台特点

DeepSeek（深度求索）平台（chat.deepseek.com）的 API 特点（**待验证**）：

1. **API 版本**: 当前为 v1（推测，待验证）
2. **认证方式**: Cookie / Token（待验证）
3. **响应结构**（推测）:
   - 详情响应包含 `messages` 或 `chats` 数组
   - 可能支持 `reasoning_content` 字段（思考过程）
   - 时间戳可能为 Unix 毫秒或秒级
4. **消息类型**: `text`, `think`, `code`, `image`（待验证）

⚠️ **注意**: 以上信息基于常见模式推测，需要实际采集验证。

### DeepSeek 专用采集命令

#### 快速采集脚本

```bash
# 运行样本包准备脚本
bun run scripts/prepare-deepseek-sample-pack.ts

# 运行脱敏脚本（采集后）
bash fixtures/deepseek/sanitize.sh
```

#### 控制台采集代码

在 DeepSeek 页面控制台执行以下代码，可快速提取样本：

```javascript
// 采集最近的 detail 请求（关键词可能需要调整）
const detailRequests = performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/api/chat/detail') || r.name.includes('conversation'));
console.log('Detail requests:', detailRequests);

// 采集最近的 list 请求
const listRequests = performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/api/chat/list') || r.name.includes('conversation'));
console.log('List requests:', listRequests);

// 导出页面 HTML
const html = document.documentElement.outerHTML;
const blob = new Blob([html], { type: 'text/html' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'page-sample.html';
a.click();
```

### DeepSeek 样本包模板

完整的 DeepSeek 样本包应包含：

```
fixtures/deepseek/
├── README.md                          # 样本说明
├── CHECKLIST.md                       # 采集检查清单
├── .sample-info.json                  # 样本元数据
├── sanitize.sh                        # 脱敏脚本
├── raw/                               # 原始 API 响应
│   ├── detail-sample-001.json         # 详情响应（必需）
│   ├── list-sample-001.json           # 列表响应（必需）
│   ├── page-sample-001.html           # 页面 HTML（必需）
│   ├── edge-sample-001.json           # 边界情况（推荐）
│   ├── think-sample-001.json          # Think 块（推荐）
│   └── code-sample-001.json           # 代码块（推荐）
├── normalized/                        # 标准化后数据
│   └── normalized-sample-001.json     # 标准化样本（推荐）
├── screenshots/                       # 页面截图
│   ├── detail-page.png                # 详情页截图
│   └── list-page.png                  # 列表页截图
└── logs/                              # 采集日志
    └── capture-log.txt                # 采集过程记录
```

### DeepSeek 脱敏专用命令

```bash
# 批量脱敏 JSON 文件（使用 sanitize.sh 脚本）
bash fixtures/deepseek/sanitize.sh

# 或手动执行：
for file in fixtures/deepseek/raw/*.json; do
  jq '
    .conversationId = "[CONVERSATION_ID]" |
    .userId = "[USER_ID]" |
    (.messages // []) |= map(
      .id = "[MESSAGE_ID]" |
      if .content then .content = "[MESSAGE_CONTENT]" else . end
    )
  ' "$file" > tmp.json && mv tmp.json "$file"
done
```

### DeepSeek 验证检查项

```bash
# 检查必需文件
test -f fixtures/deepseek/raw/detail-sample-001.json && echo "✅ detail-sample-001.json 存在"
test -f fixtures/deepseek/raw/list-sample-001.json && echo "✅ list-sample-001.json 存在"
test -f fixtures/deepseek/raw/page-sample-001.html && echo "✅ page-sample-001.html 存在"

# 检查 JSON 格式
jq -e '.conversationId and .messages' fixtures/deepseek/raw/detail-sample-001.json > /dev/null && echo "✅ detail 格式正确"
jq -e '.conversations' fixtures/deepseek/raw/list-sample-001.json > /dev/null && echo "✅ list 格式正确"

# 检查敏感信息
grep -E "Cookie:|Authorization:" fixtures/deepseek/raw/*.curl 2>/dev/null | grep -v "\[REDACTED\]" && echo "⚠️ 发现未脱敏信息" || echo "✅ 敏感信息已脱敏"
```

### DeepSeek 预期数据结构

#### 详情响应（预期）

```json
{
  "_meta": {
    "platform": "deepseek",
    "capturedAt": "2026-03-19T10:00:00.000Z",
    "apiVersion": "v1"
  },
  "conversationId": "[CONVERSATION_ID]",
  "title": "[会话标题]",
  "messages": [
    {
      "id": "[MESSAGE_ID]",
      "role": "user|assistant",
      "content": "[消息内容]",
      "reasoning_content": "[思考过程]（可选）",
      "created_at": 1710840000000
    }
  ],
  "created_at": 1710840000000,
  "updated_at": 1710840015000
}
```

#### 列表响应（预期）

```json
{
  "_meta": {
    "platform": "deepseek",
    "capturedAt": "2026-03-19T10:00:00.000Z",
    "apiVersion": "v1"
  },
  "conversations": [
    {
      "conversationId": "[CONVERSATION_ID]",
      "title": "[会话标题]",
      "created_at": 1710840000000,
      "updated_at": 1710840015000,
      "message_count": 10
    }
  ],
  "has_more": false,
  "next_cursor": null
}
```

### 相关文档

- [`docs/DEEPSEEK_SAMPLE_PACK.md`](./DEEPSEEK_SAMPLE_PACK.md) - DeepSeek 样本包提交规范（**重点**）
- [`docs/DEEPSEEK_TEST_PLAN.md`](./DEEPSEEK_TEST_PLAN.md) - DeepSeek 测试计划
- [`docs/DEEPSEEK_ADAPTER_NOTES.md`](./DEEPSEEK_ADAPTER_NOTES.md) - DeepSeek 适配器开发笔记
- [`fixtures/deepseek/README.md`](../fixtures/deepseek/README.md) - 本地样本说明
- [`fixtures/deepseek/CHECKLIST.md`](../fixtures/deepseek/CHECKLIST.md) - 采集检查清单
