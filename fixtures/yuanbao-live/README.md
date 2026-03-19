# Yuanbao 真实页面样本

此目录包含从腾讯元宝真实页面采集的 API 请求和响应样本。

> **📦 执行包文档**: 参见 [`docs/YUANBAO_LIVE_EXECUTION_PACK.md`](../docs/YUANBAO_LIVE_EXECUTION_PACK.md)  
> **样本包规范**: 参见 [`docs/YUANBAO_SAMPLE_PACK.md`](../docs/YUANBAO_SAMPLE_PACK.md)  
> **采集检查清单**: 参见 [`CHECKLIST.md`](./CHECKLIST.md)  
> **结果记录模板**: 参见 [`RESULT_TEMPLATE.md`](./RESULT_TEMPLATE.md)

## 快速开始

### 采集样本

```bash
# 1. 访问 https://yuanbao.tencent.com 并登录
# 2. 打开开发者工具 (F12)
# 3. 运行采集脚本
bun run scripts/capture-yuanbao-samples.ts
# 4. 按提示执行控制台代码

# 或者生成样本包目录结构
bun run scripts/prepare-yuanbao-sample-pack.ts
```

### 验证样本

```bash
# 验证样本文件完整性
bun run scripts/validate-yuanbao-samples.ts

# 检查 JSON 格式
jq '.' detail-response.json > /dev/null && echo "✅ detail-response.json 格式正确"
jq '.' list-response.json > /dev/null && echo "✅ list-response.json 格式正确"
```

## 文件说明

| 文件 | 说明 | 必需 | 状态 |
|------|------|------|------|
| `detail-response.json` | 对话详情 API 响应样本 | ✅ | ❌ 待采集 |
| `list-response.json` | 对话列表 API 响应样本 | ✅ | ❌ 待采集 |
| `detail-request.sample.curl` | 对话详情 API 请求 (cURL 格式，示例) | ⚠️ | ✅ 示例 |
| `list-request.sample.curl` | 对话列表 API 请求 (cURL 格式，示例) | ⚠️ | ✅ 示例 |
| `screenshots/` | 页面截图目录 | ⚠️ | ✅ 已创建 |
| `html-snapshots/` | HTML 快照目录 | ⚠️ | ✅ 已创建 |
| `logs/` | 采集日志目录 | ⚠️ | ✅ 已创建 |
| `.sample-info.json` | 样本元数据 | ⚠️ | ❌ 待生成 |
| `CHECKLIST.md` | 采集检查清单 | ⚠️ | ✅ 已创建 |

> **注意**: 当前目录包含的是**示例文件**，请替换为从真实 Yuanbao 页面采集的数据。

## 样本结构

### detail-response.json

```json
{
  "conversationId": "[CONVERSATION_ID]",
  "sessionTitle": "[会话标题]",
  "convs": [
    {
      "speaker": "user|ai",
      "index": 1,
      "speechesV2": [
        {
          "content": [
            { "type": "text", "msg": "[消息内容]" },
            { "type": "think", "title": "思考", "content": "[思考内容]" }
          ]
        }
      ],
      "createTime": 1710840000000
    }
  ],
  "createTime": 1710840000000,
  "updateTime": 1710840000000
}
```

### list-response.json

```json
{
  "code": 0,
  "msg": "success",
  "conversations": [
    {
      "conversationId": "[CONVERSATION_ID]",
      "title": "[会话标题]",
      "createTime": 1710840000000,
      "updateTime": 1710840000000,
      "messageCount": 10
    }
  ],
  "hasMore": true,
  "nextCursor": "cursor_xxx"
}
```

## 采集步骤

### 1. 准备环境

1. 打开 Chrome/Edge 浏览器
2. 访问 https://yuanbao.tencent.com
3. 登录账号
4. 打开开发者工具 (F12)
5. 切换到 Network 标签
6. 勾选 "Preserve log" (保留日志)
7. 在筛选框输入：`yuanbao` 或 `conversation` 或 `api`

### 2. 采集详情请求和响应

1. 在筛选框输入：`detail` 或 `conversation`
2. 找到一个 `POST` 请求，URL 包含 `/api/user/agent/conversation/v2/detail`
3. 右键 → Copy → Copy as cURL
4. 保存为 `detail-request.curl`
5. 再次右键 → Copy response
6. 保存为 `detail-response.json`

### 3. 采集列表请求和响应

1. 在筛选框输入：`list` 或 `conversation`
2. 找到一个 `POST` 请求，URL 包含 `/api/user/agent/conversation/v2/list`
3. 右键 → Copy → Copy as cURL
4. 保存为 `list-request.curl`
5. 再次右键 → Copy response
6. 保存为 `list-response.json`

### 4. 采集截图（推荐）

**方法 A: 使用开发者工具**

1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (Mac)
2. 输入 `screenshot`
3. 选择 "Capture full size screenshot" 或 "Capture visible area"
4. 保存到 `screenshots/` 目录

**方法 B: 使用采集脚本**

```bash
# 在 Yuanbao 页面控制台执行脚本提供的代码
bun run scripts/capture-yuanbao-samples.ts
```

### 5. 脱敏处理

**重要**: 提交前必须移除以下敏感信息：

```bash
# 编辑 cURL 文件，移除或替换：
# - Cookie 字段
# - Authorization header
# - 任何 token

# 示例 (使用 sed):
sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' detail-request.curl
sed -i '' 's/Authorization: [^"]*/Authorization: [REDACTED]/g' detail-request.curl

# 脱敏 JSON 文件中的敏感字段
jq '.conversationId = "[CONVERSATION_ID]" | .userId = "[USER_ID]"' detail-response.json > tmp.json && mv tmp.json detail-response.json
```

## 脱敏检查清单

提交前请确认：

- [ ] Cookie 字段已移除或替换为 `[REDACTED]`
- [ ] Authorization header 已移除或替换为 `[REDACTED]`
- [ ] 用户 ID 已替换为 `[USER_ID]`
- [ ] 对话 ID 已替换为 `[CONVERSATION_ID]`
- [ ] 真实对话内容已替换为占位符
- [ ] JSON 格式正确（可通过 `jq '.'` 验证）
- [ ] 运行验证脚本通过

## 验证命令

```bash
# 验证 JSON 格式
jq '.' detail-response.json > /dev/null && echo "✅ detail-response.json 格式正确"
jq '.' list-response.json > /dev/null && echo "✅ list-response.json 格式正确"

# 检查必需字段
jq -e '.conversationId and .convs' detail-response.json > /dev/null && echo "✅ detail-response.json 包含必需字段"
jq -e '.conversations' list-response.json > /dev/null && echo "✅ list-response.json 包含必需字段"

# 检查敏感信息
grep -E "Cookie:|Authorization:" *.curl | grep -v "\[REDACTED\]" && echo "⚠️ 发现未脱敏信息" || echo "✅ 敏感信息已脱敏"

# 运行验证脚本
bun run scripts/validate-yuanbao-samples.ts
```

## 目录结构

```
fixtures/yuanbao-live/
├── README.md                          # 本文件
├── CHECKLIST.md                       # 采集检查清单
├── detail-request.sample.curl         # 详情请求示例
├── detail-response.json               # 详情响应（待替换为真实数据）
├── list-request.sample.curl           # 列表请求示例
├── list-response.json                 # 列表响应（待替换为真实数据）
├── .sample-info.json                  # 样本元数据（运行脚本生成）
├── screenshots/
│   ├── detail-page.png                # 详情页截图
│   └── list-page.png                  # 列表页截图
├── html-snapshots/
│   ├── detail-page.html               # 详情页 HTML
│   └── list-page.html                 # 列表页 HTML
└── logs/
    └── capture-*.txt                  # 采集日志
```

## 相关文档

- [YUANBAO_SAMPLE_PACK.md](../docs/YUANBAO_SAMPLE_PACK.md) - 样本包提交规范（**重点**）
- [SAMPLE_CAPTURE_GUIDE.md](../docs/SAMPLE_CAPTURE_GUIDE.md) - 样本采集通用指南
- [YUANBAO_LIVE_VALIDATION.md](../docs/YUANBAO_LIVE_VALIDATION.md) - 真实页面验证指南

## 辅助脚本

| 脚本 | 用途 | 命令 |
|------|------|------|
| `capture-yuanbao-samples.ts` | 样本采集辅助 | `bun run scripts/capture-yuanbao-samples.ts` |
| `validate-yuanbao-samples.ts` | 样本验证 | `bun run scripts/validate-yuanbao-samples.ts` |
| `prepare-yuanbao-sample-pack.ts` | 生成样本包结构 | `bun run scripts/prepare-yuanbao-sample-pack.ts` |
| `diagnose-yuanbao.ts` | 诊断报告 | `bun run scripts/diagnose-yuanbao.ts` |

---

**采集时间**: 待采集  
**维护者**: Chat Export Toolkit Team  
**版本**: V2.0.0-alpha  
**最后更新**: 2024-03-19
