# DeepSeek Raw Fixtures

此目录包含 DeepSeek 平台的**原始 API 响应**样本。

## 状态

📋 **模板阶段**

当前文件为**模板/占位符**，用于定义预期的数据结构。真实样本需要从 DeepSeek 平台采集后替换。

## 文件清单

| 文件 | 状态 | 说明 |
|------|------|------|
| `template-detail-001.json` | 📋 模板 | 对话详情响应模板 |
| `template-edge-001.json` | 📋 模板 | 边界情况模板（空消息、特殊字符等） |

## 如何采集真实样本

### 方法 1：浏览器开发者工具

1. 访问 https://chat.deepseek.com 并登录
2. 打开开发者工具（F12）→ Network 标签
3. 打开一个已有对话或创建新对话
4. 找到对话详情相关的 API 请求（可能是 `/api/chat/detail`、`/graphql` 等）
5. 右键 → Copy → Copy response
6. 保存为 `detail-sample-001.json`

### 方法 2：HAR 导出

1. 在 Network 面板中，勾选 "Preserve log"
2. 刷新页面并进行对话操作
3. 右键 → "Save all as HAR with content"
4. 从 HAR 文件中提取 JSON 响应

### 方法 3：页面 HTML 导出

1. 在对话页面执行：
   ```javascript
   document.documentElement.outerHTML
   ```
2. 或使用浏览器 "另存为" 保存完整 HTML

## 需要的样本类型

### 必需样本（🔴 高优先级）

- [ ] **对话详情 API 响应** - 至少 1 个完整对话
- [ ] **对话列表 API 响应** - 至少 1 个列表响应
- [ ] **对话页面 HTML** - 完整页面结构
- [ ] **网络请求列表** - 识别所有 API 端点

### 理想样本（🟡 中优先级）

- [ ] 包含 think/reasoning 块的对话
- [ ] 包含代码块的对话
- [ ] 包含数学公式的对话
- [ ] 包含附件/文件的对话
- [ ] 长对话（>20 条消息）
- [ ] 不同模型版本的对话

## 注意事项

⚠️ **隐私和安全**：
- 移除所有 Cookie、Authorization、token 等敏感信息
- 使用脱敏数据，不要包含真实用户对话内容
- 标注采集时间和 DeepSeek 版本/API 版本

⚠️ **模板使用**：
- 模板文件仅用于测试开发和结构定义
- 不要将模板数据当作真实样本提交
- 真实样本应命名为 `*-sample-*.json` 或 `*-real-*.json`

## 相关文档

- [DEEPSEEK_ADAPTER_NOTES.md](../../../docs/DEEPSEEK_ADAPTER_NOTES.md)
- [SAMPLE_CAPTURE_GUIDE.md](../../../docs/SAMPLE_CAPTURE_GUIDE.md)
- [DEEPSEEK_TEST_PLAN.md](../../../docs/DEEPSEEK_TEST_PLAN.md)

---

**最后更新**: 2026-03-19  
**状态**: 模板阶段，等待真实样本采集
