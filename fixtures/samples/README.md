# 样本目录模板

此目录提供标准化的样本文件模板，用于快速创建新平台的样本数据。

---

## 使用指南

### 1. 复制模板

为新平台创建样本目录时，复制以下模板文件：

```bash
# 示例：为 Kimi 创建样本目录
cp -r fixtures/samples/template fixtures/kimi-live
```

### 2. 修改 README

编辑 `README.md`，替换占位符：

- `{平台名称}` → 实际平台名称（如 Kimi）
- `{platform}` → 平台标识（如 kimi）
- `{平台 URL}` → 实际网址（如 https://kimi.moonshot.cn）
- `{关键词}` → Network 筛选关键词

### 3. 采集样本

按照 README 中的步骤采集真实样本。

### 4. 脱敏处理

使用以下命令脱敏：

```bash
# 脱敏 cURL 文件
sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' *-request.curl
sed -i '' 's/Authorization: [^"]*/Authorization: [REDACTED]/g' *-request.curl

# 脱敏 JSON 文件
jq '
  .conversationId = "[CONVERSATION_ID]" |
  .userId = "[USER_ID]" |
  .sessionId = "[SESSION_ID]"
' response.json > sanitized.json
```

### 5. 验证样本

```bash
# 验证 JSON 格式
jq '.' *-response.json > /dev/null && echo "Valid"

# 运行项目验证脚本（如有）
bun run scripts/validate-{platform}-samples.ts
```

---

## 模板文件

### template/README.md

平台样本目录的标准说明文件模板。

### template/detail-response.template.json

对话详情 API 响应的最小完整结构模板。

### template/list-response.template.json

对话列表 API 响应的最小完整结构模板。

### template/detail-request.template.curl

对话详情 API 请求的 cURL 命令模板。

### template/list-request.template.curl

对话列表 API 请求的 cURL 命令模板。

---

## 样本文件清单

### 必需文件

- [ ] `README.md` - 采集说明和样本结构
- [ ] `detail-response.json` - 对话详情响应
- [ ] `list-response.json` - 对话列表响应

### 推荐文件

- [ ] `detail-request.curl` - 详情请求 cURL
- [ ] `list-request.curl` - 列表请求 cURL

### 可选文件

- [ ] `chat-request.curl` - 发送消息请求
- [ ] `chat-response.json` - 发送消息响应
- [ ] `capture-log.txt` - 采集日志
- [ ] `*-samples-*.json` - 自动采集的综合样本

---

## 快速参考

### 采集步骤速查

```
1. 访问平台 → 2. F12 打开开发者工具 → 3. Network 标签
   ↓
4. 筛选关键词 → 5. 触发操作 → 6. 找到请求
   ↓
7. Copy as cURL → 8. Copy response → 9. 保存文件
   ↓
10. 脱敏处理 → 11. 验证格式 → 12. 提交
```

### 脱敏速查

```bash
# cURL 文件
sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' file.curl
sed -i '' 's/Authorization: [^"]*/Authorization: [REDACTED]/g' file.curl

# JSON 文件
jq '.conversationId = "[CONVERSATION_ID]"' file.json > sanitized.json
```

### 验证速查

```bash
# JSON 格式
jq '.' file.json > /dev/null

# cURL 执行（脱敏后）
bash file.curl
```

---

## 相关文档

- [SAMPLE_CAPTURE_GUIDE.md](../../docs/SAMPLE_CAPTURE_GUIDE.md) - 样本采集通用指南
- [ADAPTERS.md](../../docs/ADAPTERS.md) - 适配器开发指南

---

**版本**: 1.0.0  
**最后更新**: 2024-03-19  
**维护者**: Chat Export Toolkit Team
