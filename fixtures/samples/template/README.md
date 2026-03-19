# {平台名称} 真实页面样本

此目录包含从 {平台名称} 真实页面采集的 API 请求和响应样本。

## 快速开始

### 采集样本

```bash
# 1. 访问 {平台 URL} 并登录
# 2. 打开开发者工具 (F12)
# 3. 切换到 Network 标签，勾选 "Preserve log"
# 4. 在筛选框输入：{关键词}
# 5. 执行操作触发 API 请求（如切换对话、发送消息）
```

### 验证样本

```bash
# 验证 JSON 格式
jq '.' *-response.json > /dev/null && echo "Valid JSON"

# 运行项目验证脚本（如有）
bun run scripts/validate-{platform}-samples.ts
```

## 文件说明

| 文件 | 说明 | 必需 |
|------|------|------|
| `detail-request.curl` | 对话详情 API 请求 | 推荐 |
| `detail-response.json` | 对话详情 API 响应 | ✅ |
| `list-request.curl` | 对话列表 API 请求 | 推荐 |
| `list-response.json` | 对话列表 API 响应 | ✅ |
| `chat-request.curl` | 发送消息请求 | 可选 |
| `chat-response.json` | 发送消息响应 | 可选 |

## 手动采集步骤

### 1. 准备环境

1. 打开 Chrome/Edge 浏览器
2. 访问 {平台 URL}
3. 登录账号
4. 按 `F12` 打开开发者工具
5. 切换到 **Network** 标签
6. 勾选 **Preserve log** (保留日志)

### 2. 采集详情请求

1. 在筛选框输入：`{关键词}`
2. 找到一个 `POST` 请求（详情 API）
3. 右键 → **Copy** → **Copy as cURL**
4. 保存为 `detail-request.curl`
5. 切换到 **Response** 标签
6. 右键 → **Copy response**
7. 保存为 `detail-response.json`

### 3. 采集列表请求

1. 刷新页面或导航到对话列表
2. 找到列表 API 请求
3. 右键 → **Copy** → **Copy as cURL**
4. 保存为 `list-request.curl`
5. 复制响应保存为 `list-response.json`

### 4. 脱敏处理

**重要**: 提交前必须移除以下敏感信息：

```bash
# 脱敏 cURL 文件
sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' *-request.curl
sed -i '' 's/Authorization: [^"]*/Authorization: [REDACTED]/g' *-request.curl

# 脱敏 JSON 文件
jq '
  .conversationId = "[CONVERSATION_ID]" |
  .userId = "[USER_ID]" |
  .sessionId = "[SESSION_ID]"
' *-response.json > sanitized.json
```

## 样本结构

### detail-response.json

```json
{
  "_meta": {
    "platform": "{platform}",
    "capturedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
    "apiVersion": "v1",
    "endpoint": "/api/xxx/detail"
  },
  "conversationId": "[CONVERSATION_ID]",
  "sessionTitle": "示例对话标题",
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

### list-response.json

```json
{
  "_meta": {
    "platform": "{platform}",
    "capturedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
    "apiVersion": "v1",
    "endpoint": "/api/xxx/list"
  },
  "conversations": [
    {
      "conversationId": "[CONVERSATION_ID]",
      "title": "示例对话标题",
      "createTime": 1710840000000,
      "updateTime": 1710840000000,
      "messageCount": 10
    }
  ],
  "hasMore": false,
  "nextCursor": ""
}
```

## 验证清单

- [ ] JSON 格式正确（使用 `jq '.' file.json` 验证）
- [ ] 包含 `_meta` 字段（平台、采集时间、API 版本）
- [ ] 已移除 Cookie、Authorization 等敏感信息
- [ ] 已替换真实对话内容为占位符
- [ ] README 包含采集时间和维护者信息

## 注意事项

- ⚠️ **敏感信息**: 提交前请移除 Cookie、Authorization 等认证信息
- ⚠️ **隐私**: 不要包含个人对话内容，使用脱敏数据
- ⚠️ **时效性**: API 响应可能随时间变化，请标注采集时间

## 相关文档

- [SAMPLE_CAPTURE_GUIDE.md](../../docs/SAMPLE_CAPTURE_GUIDE.md) - 样本采集通用指南
- [ADAPTERS.md](../../docs/ADAPTERS.md) - 适配器开发指南

---

**采集时间**: YYYY-MM-DD  
**维护者**: Chat Export Toolkit Team
