# Yuanbao 样本采集检查清单

## 采集前准备

- [ ] 已登录 Yuanbao 账号
- [ ] 浏览器开发者工具已打开 (F12)
- [ ] Network 标签已切换到 XHR/Fetch
- [ ] "Preserve log" 已勾选
- [ ] 筛选条件设置为：`yuanbao` 或 `conversation`

## 文件采集

### 详情请求和响应

- [ ] 找到 detail API 请求 (URL 包含 `/api/user/agent/conversation/v2/detail`)
- [ ] 已复制 cURL 命令 → `detail-request.curl`
- [ ] 已复制响应 JSON → `detail-response.json`
- [ ] 响应包含 `conversationId` 字段
- [ ] 响应包含 `convs` 数组（至少 1 条消息）

### 列表请求和响应

- [ ] 找到 list API 请求 (URL 包含 `/api/user/agent/conversation/v2/list`)
- [ ] 已复制 cURL 命令 → `list-request.curl`
- [ ] 已复制响应 JSON → `list-response.json`
- [ ] 响应包含 `conversations` 数组（至少 1 个会话）

### 截图（推荐）

- [ ] 详情页截图 → `screenshots/detail-page.png`
- [ ] 列表页截图 → `screenshots/list-page.png`
- [ ] 截图清晰显示 URL 栏

### HTML 快照（可选）

- [ ] 详情页 HTML → `html-snapshots/detail-page.html`
- [ ] 列表页 HTML → `html-snapshots/list-page.html`

## 脱敏处理

- [ ] Cookie 字段已替换为 `[REDACTED]`
- [ ] Authorization header 已替换为 `[REDACTED]`
- [ ] 其他 token 已移除或替换
- [ ] 用户 ID 已替换为 `[USER_ID]`
- [ ] 对话 ID 已替换为 `[CONVERSATION_ID]`
- [ ] 真实对话内容已替换为占位符
- [ ] 个人身份信息已移除

## 格式验证

- [ ] JSON 文件可通过 `jq '.'` 验证
- [ ] 使用 2 空格缩进
- [ ] 无语法错误
- [ ] 文件名符合规范

## 自动化验证

```bash
# 运行验证脚本
bun run scripts/validate-yuanbao-samples.ts

# 检查 JSON 格式
jq '.' detail-response.json > /dev/null
jq '.' list-response.json > /dev/null

# 检查敏感信息
grep -E "Cookie:|Authorization:" *.curl | grep -v "\[REDACTED\]"
```

- [ ] 验证脚本全部通过
- [ ] 无敏感信息泄露
- [ ] 所有必需文件存在

## 元数据

- [ ] 已创建 `.sample-info.json`
- [ ] 填写采集时间
- [ ] 填写浏览器版本
- [ ] 填写操作系统
- [ ] 填写样本特点

## 提交前检查

- [ ] 运行 `git diff` 确认无敏感信息
- [ ] 更新 `README.md` 的采集时间
- [ ] 编写清晰的 commit message
- [ ] 通知维护者审查

---

**采集日期**: 2026-03-19  
**采集者**: user
