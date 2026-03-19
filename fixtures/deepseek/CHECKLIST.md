# DeepSeek 样本采集检查清单

> **规范文档**: [DEEPSEEK_SAMPLE_PACK.md](../docs/DEEPSEEK_SAMPLE_PACK.md)

## 采集前准备

- [ ] 已登录 DeepSeek 账号 (https://chat.deepseek.com)
- [ ] 浏览器开发者工具已打开 (F12)
- [ ] Network 标签已切换到 XHR/Fetch
- [ ] "Preserve log" 已勾选
- [ ] 筛选条件设置为：\`detail\` 或 \`conversation\` 或 \`chat\`
- [ ] 已准备至少 1 个完整对话用于采集

## 文件采集

### 🔴 必需文件

#### 详情响应 (detail-sample-001.json)

- [ ] 找到详情 API 请求 (URL 可能包含 \`/api/chat/detail\`、\`/conversation\`、\`/chat\`)
- [ ] 已复制响应 JSON → \`raw/detail-sample-001.json\`
- [ ] 响应包含 \`conversationId\` 或类似字段
- [ ] 响应包含消息数组 (\`messages\`、\`chats\`、\`turns\` 等)
- [ ] 消息数量 >= 2 (至少一轮对话)
- [ ] JSON 格式正确 (可通过 \`jq '.'\` 验证)

#### 列表响应 (list-sample-001.json)

- [ ] 找到列表 API 请求 (URL 可能包含 \`/api/chat/list\`、\`/conversation/list\`)
- [ ] 已复制响应 JSON → \`raw/list-sample-001.json\`
- [ ] 响应包含 \`conversations\` 或类似数组
- [ ] 数组中至少有 1 个会话
- [ ] JSON 格式正确

#### 页面 HTML (page-sample-001.html)

- [ ] 在对话页面执行 HTML 导出脚本
- [ ] 保存为 \`raw/page-sample-001.html\`
- [ ] HTML 文件可正常打开
- [ ] 文件大小合理 (100KB - 2MB)

### 🟡 推荐文件

#### 边界情况样本 (edge-sample-001.json)

- [ ] 包含空消息或 null 内容
- [ ] 包含特殊字符 (@#$%^&* 等)
- [ ] 包含 Emoji
- [ ] 包含多语言混合

#### Think 块样本 (think-sample-001.json)

- [ ] 包含推理/思考过程
- [ ] Think 块字段明确 (\`reasoning_content\`、\`thinkContent\` 等)
- [ ] 包含最终回答内容

#### 代码样本 (code-sample-001.json)

- [ ] 包含代码块
- [ ] 代码块有语言标记
- [ ] 包含多种语言代码 (如 Python、JavaScript)

### 🟢 可选文件

#### 截图

- [ ] 详情页截图 → \`screenshots/detail-page.png\`
- [ ] 列表页截图 → \`screenshots/list-page.png\`
- [ ] 截图清晰显示 URL 栏
- [ ] 截图包含至少一条完整消息

#### 日志

- [ ] 采集过程记录 → \`logs/capture-log.txt\`
- [ ] 记录采集时间
- [ ] 记录浏览器版本
- [ ] 记录遇到的问题

## 脱敏处理

### JSON 文件脱敏

\`\`\`bash
# 批量脱敏 JSON 文件
for file in fixtures/deepseek/raw/*.json; do
  jq '
    .conversationId = "[CONVERSATION_ID]" |
    .userId = "[USER_ID]" |
    .sessionId = "[SESSION_ID]" |
    (.messages // []) |= map(
      .id = "[MESSAGE_ID]" |
      if .content then .content = "[MESSAGE_CONTENT]" else . end
    )
  ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done
\`\`\`

### 检查清单

- [ ] Cookie 字段已替换为 \`[REDACTED]\`
- [ ] Authorization header 已替换为 \`[REDACTED]\`
- [ ] 其他 token 已移除或替换
- [ ] 用户 ID 已替换为 \`[USER_ID]\`
- [ ] 对话 ID 已替换为 \`[CONVERSATION_ID]\`
- [ ] 消息 ID 已替换为 \`[MESSAGE_ID]\`
- [ ] 真实对话内容已替换为占位符
- [ ] 个人身份信息已移除
- [ ] URL 中的敏感参数已处理

## 格式验证

- [ ] JSON 文件可通过 \`jq '.'\` 验证
- [ ] 使用 2 空格缩进
- [ ] 无语法错误
- [ ] 文件名符合规范 (\`detail-sample-001.json\` 格式)
- [ ] 包含 \`_meta\` 字段（平台、采集时间）

## 自动化验证

\`\`\`bash
# 验证 JSON 格式
jq '.' fixtures/deepseek/raw/detail-sample-001.json > /dev/null
jq '.' fixtures/deepseek/raw/list-sample-001.json > /dev/null

# 检查必需字段
jq -e '.conversationId and .messages' fixtures/deepseek/raw/detail-sample-001.json > /dev/null
jq -e '.conversations' fixtures/deepseek/raw/list-sample-001.json > /dev/null

# 检查敏感信息
grep -E "Cookie:|Authorization:" fixtures/deepseek/raw/*.curl 2>/dev/null | grep -v "\\[REDACTED\\]"
\`\`\`

- [ ] 验证脚本全部通过
- [ ] 无敏感信息泄露
- [ ] 所有必需文件存在

## 元数据

- [ ] 已创建 \`.sample-info.json\`
- [ ] 填写采集时间
- [ ] 填写浏览器版本
- [ ] 填写操作系统
- [ ] 填写样本特点
- [ ] 更新 \`checklist\` 字段状态

## 提交前检查

- [ ] 运行 \`git diff\` 确认无敏感信息
- [ ] 更新 \`README.md\` 的采集时间
- [ ] 编写清晰的 commit message
- [ ] 通知维护者审查

### 建议 Commit Message

\`\`\`
feat(deepseek): 添加真实样本包（detail/list/page）

- 添加 detail-sample-001.json（对话详情 API 响应）
- 添加 list-sample-001.json（对话列表 API 响应）
- 添加 page-sample-001.html（对话页面 HTML）
- 所有样本已脱敏处理

验证状态:
- ✅ JSON 格式验证通过
- ✅ 必需字段完整
- ✅ 敏感信息已脱敏
- ⏸️ 待 Golden Tests 验证

关联文档:
- refs: DEEPSEEK_TEST_PLAN.md
- refs: SAMPLE_CAPTURE_GUIDE.md
- refs: DEEPSEEK_SAMPLE_PACK.md
\`\`\`

---

**采集日期**: 2026-03-19  
**采集者**: user  
**状态**: 📋 待采集
