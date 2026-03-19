# DeepSeek 样本包提交规范

> **状态**: 📋 模板阶段  
> **优先级**: 🔴 高（阻塞 DeepSeek 适配器落地）  
> **关联文档**: [DEEPSEEK_TEST_PLAN.md](./DEEPSEEK_TEST_PLAN.md) | [SAMPLE_CAPTURE_GUIDE.md](./SAMPLE_CAPTURE_GUIDE.md)

---

## 目标

为 DeepSeek 适配器提供**最小可行样本包**，降低第一次落地门槛。

**样本包用途**:
1. 验证类型定义和 Normalizer 逻辑
2. 为 Golden Tests 提供真实数据
3. 为 L1 DOM 提取提供参考
4. 为后续开发者提供采集模板

---

## 最小样本包要求

### 必需文件（🔴 阻塞）

| 文件 | 路径 | 说明 | 验证方式 |
|------|------|------|---------|
| **详情响应** | `fixtures/deepseek/raw/detail-sample-001.json` | 至少 1 个完整对话的 API 响应 | `jq '.conversationId and .messages'` |
| **列表响应** | `fixtures/deepseek/raw/list-sample-001.json` | 对话列表 API 响应 | `jq '.conversations'` |
| **页面 HTML** | `fixtures/deepseek/raw/page-sample-001.html` | 对话页面完整 HTML | 可在浏览器打开 |
| **元数据** | `fixtures/deepseek/.sample-info.json` | 样本采集信息 | 包含采集时间、浏览器版本等 |

### 推荐文件（🟡 建议）

| 文件 | 路径 | 说明 |
|------|------|------|
| **边界样本** | `fixtures/deepseek/raw/edge-sample-001.json` | 包含空消息、特殊字符等边界情况 |
| **Think 块样本** | `fixtures/deepseek/raw/think-sample-001.json` | 包含推理/思考过程的对话 |
| **代码样本** | `fixtures/deepseek/raw/code-sample-001.json` | 包含代码块的对话 |
| **详情页截图** | `fixtures/deepseek/screenshots/detail-page.png` | 对话页面截图 |
| **列表页截图** | `fixtures/deepseek/screenshots/list-page.png` | 列表页面截图 |

### 可选文件（🟢 增强）

| 文件 | 路径 | 说明 |
|------|------|------|
| **长对话样本** | `fixtures/deepseek/raw/long-sample-001.json` | 20+ 轮消息的对话 |
| **多模态样本** | `fixtures/deepseek/raw/multi-modal-sample-001.json` | 包含图片/附件的对话 |
| **数学公式样本** | `fixtures/deepseek/raw/math-sample-001.json` | 包含 LaTeX 公式的对话 |
| **HAR 文件** | `fixtures/deepseek/logs/capture-session.har` | 完整网络请求日志 |

---

## 目录结构模板

```
fixtures/deepseek/
├── README.md                          # 目录说明（已存在）
├── .sample-info.json                  # 样本包元数据（脚本生成）
├── raw/                               # 原始 API 响应
│   ├── README.md                      # 说明（已存在）
│   ├── template-detail-001.json       # 模板（已存在）
│   ├── template-edge-001.json         # 边界模板（已存在）
│   ├── detail-sample-001.json         # 🔴 必需：真实详情样本
│   ├── list-sample-001.json           # 🔴 必需：真实列表样本
│   ├── page-sample-001.html           # 🔴 必需：页面 HTML
│   ├── edge-sample-001.json           # 🟡 推荐：边界情况
│   ├── think-sample-001.json          # 🟡 推荐：Think 块
│   └── code-sample-001.json           # 🟡 推荐：代码块
├── normalized/                        # 标准化后数据
│   ├── README.md                      # 说明（已存在）
│   ├── template-normalized-001.json   # 模板（已存在）
│   ├── template-normalized-edge-001.json  # 边界模板（已存在）
│   └── normalized-sample-001.json     # 🟡 推荐：标准化样本
├── samples/                           # 便捷样本目录
│   └── .gitkeep
├── screenshots/                       # 页面截图
│   ├── detail-page.png                # 详情页截图
│   └── list-page.png                  # 列表页截图
└── logs/                              # 采集日志
    └── capture-log.txt                # 采集过程记录
```

---

## 命名规范

### 文件名格式

```
{类型}-{描述}-{序号}.{扩展名}
```

**示例**:
```
detail-sample-001.json          # 详情样本 #1
list-sample-001.json            # 列表样本 #1
page-sample-001.html            # 页面样本 #1
edge-sample-001.json            # 边界样本 #1
think-sample-001.json           # Think 块样本 #1
```

### 目录命名

| 目录 | 用途 | 必需 |
|------|------|------|
| `raw/` | 原始 API 响应 | ✅ |
| `normalized/` | 标准化后数据 | ✅ |
| `samples/` | 便捷样本 | ⚠️ |
| `screenshots/` | 页面截图 | ⚠️ |
| `logs/` | 采集日志 | ⚠️ |

### 平台标识

统一使用 `deepseek` 作为前缀（小写）：
- ✅ `deepseek-detail-sample-001.json`
- ❌ `DeepSeek-detail-sample-001.json`
- ❌ `deep_seek_detail_sample_001.json`

---

## 脱敏要求

### ⚠️ 必须脱敏的字段

| 类型 | 字段示例 | 脱敏方法 |
|------|---------|---------|
| **认证信息** | `Cookie`, `Authorization`, `X-Token`, `X-API-Key` | 替换为 `[REDACTED]` |
| **用户标识** | `userId`, `sessionId`, `deviceId`, `user_id` | 替换为 `[USER_ID]` |
| **对话标识** | `conversationId`, `chatId`, `sessionId` | 替换为 `[CONVERSATION_ID]` |
| **消息 ID** | `messageId`, `msgId`, `id` (消息级别) | 替换为 `[MESSAGE_ID]` |
| **真实内容** | 真实对话文本 | 替换为占位符或虚构内容 |
| **时间戳** | 精确时间戳 | 保留相对时间，模糊化绝对时间 |
| **URL 参数** | `?token=xxx&user=yyy` | 移除或替换参数值 |

### 脱敏命令示例

#### 批量脱敏 JSON 文件

```bash
# 使用 jq 批量脱敏
for file in fixtures/deepseek/raw/*.json; do
  jq '
    .conversationId = "[CONVERSATION_ID]" |
    .userId = "[USER_ID]" |
    .sessionId = "[SESSION_ID]" |
    (.messages // []) |= map(
      .id = "[MESSAGE_ID]" |
      .content = "[MESSAGE_CONTENT]"
    )
  ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done
```

#### 脱敏 cURL 请求

```bash
# 脱敏 Cookie 和 Authorization
sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' fixtures/deepseek/raw/*-request.curl
sed -i '' 's/Authorization: [^"]*/Authorization: [REDACTED]/g' fixtures/deepseek/raw/*-request.curl
```

#### 脱敏 HTML 文件

```bash
# 移除 HTML 中的敏感 meta 标签
sed -i '' '/<meta.*token/d' fixtures/deepseek/raw/page-sample-001.html
sed -i '' '/<meta.*authorization/d' fixtures/deepseek/raw/page-sample-001.html
```

### 脱敏检查清单

提交前必须确认：

- [ ] Cookie 字段已移除或替换为 `[REDACTED]`
- [ ] Authorization header 已移除或替换为 `[REDACTED]`
- [ ] 所有 token 类字段已处理
- [ ] 用户 ID、会话 ID 已脱敏
- [ ] 真实对话内容已替换
- [ ] 个人身份信息（姓名、邮箱、电话）已移除
- [ ] URL 中的敏感参数已处理
- [ ] 运行 `git diff` 确认无敏感信息泄露

---

## 样本结构定义

### 详情响应结构（预期）

```json
{
  "_meta": {
    "platform": "deepseek",
    "capturedAt": "2026-03-19T10:00:00.000Z",
    "apiVersion": "v1",
    "endpoint": "/api/chat/detail"
  },
  "conversationId": "[CONVERSATION_ID]",
  "title": "[会话标题]",
  "messages": [
    {
      "id": "[MESSAGE_ID]",
      "role": "user|assistant",
      "content": "[消息内容]",
      "reasoning_content": "[思考过程]（可选）",
      "created_at": 1710840000000,
      "metadata": {
        "model": "deepseek-chat"
      }
    }
  ],
  "created_at": 1710840000000,
  "updated_at": 1710840015000
}
```

### 列表响应结构（预期）

```json
{
  "_meta": {
    "platform": "deepseek",
    "capturedAt": "2026-03-19T10:00:00.000Z",
    "apiVersion": "v1",
    "endpoint": "/api/chat/list"
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

---

## 提交流程

### 步骤 1: 准备环境

```bash
# 1. 确保已安装必要工具
brew install jq  # JSON 处理

# 2. 克隆或更新仓库
cd /Users/user/.openclaw/workspace/chat-export-toolkit
git pull
```

### 步骤 2: 运行初始化脚本

```bash
# 生成样本包目录结构和模板
bun run scripts/prepare-deepseek-sample-pack.ts
```

### 步骤 3: 采集样本

按照 `fixtures/deepseek/CHECKLIST.md` 的指引采集样本：

1. 访问 https://chat.deepseek.com 并登录
2. 打开开发者工具 (F12) → Network 标签
3. 筛选 `detail` 或 `conversation` 关键词
4. 找到详情 API 请求，复制响应 → `detail-sample-001.json`
5. 找到列表 API 请求，复制响应 → `list-sample-001.json`
6. 保存页面 HTML → `page-sample-001.html`

### 步骤 4: 脱敏处理

```bash
# 运行脱敏命令（参考上文脱敏要求）
# 或手动编辑文件移除敏感信息

# 验证脱敏效果
grep -r "Cookie:" fixtures/deepseek/raw/*.curl | grep -v "\[REDACTED\]"
grep -r "Authorization:" fixtures/deepseek/raw/*.curl | grep -v "\[REDACTED\]"
```

### 步骤 5: 验证样本

```bash
# 验证 JSON 格式
jq '.' fixtures/deepseek/raw/detail-sample-001.json > /dev/null && echo "✅ 格式正确"

# 验证必需字段
jq -e '.conversationId and .messages' fixtures/deepseek/raw/detail-sample-001.json > /dev/null && echo "✅ 包含必需字段"

# 运行验证脚本（如有）
bun run scripts/validate-deepseek-samples.ts
```

### 步骤 6: 更新元数据

编辑 `fixtures/deepseek/.sample-info.json`：

```json
{
  "platform": "deepseek",
  "capturedAt": "2026-03-19T10:00:00.000Z",
  "capturedBy": "your-username",
  "environment": {
    "browser": "Chrome 122.0.0.0",
    "os": "macOS 14.3",
    "userAgent": "Mozilla/5.0 ..."
  },
  "sanitized": true,
  "validated": true,
  "notes": "包含 think 块和代码块示例"
}
```

### 步骤 7: 提交 Git

```bash
# 检查变更
git status
git diff fixtures/deepseek/

# 添加文件
git add fixtures/deepseek/raw/detail-sample-001.json
git add fixtures/deepseek/raw/list-sample-001.json
git add fixtures/deepseek/raw/page-sample-001.html
git add fixtures/deepseek/.sample-info.json

# 提交（使用建议的 commit message）
git commit -m "feat(deepseek): 添加真实样本包（detail/list/page）

- 添加 detail-sample-001.json（对话详情 API 响应）
- 添加 list-sample-001.json（对话列表 API 响应）
- 添加 page-sample-001.html（对话页面 HTML）
- 所有样本已脱敏处理
- 更新 .sample-info.json 元数据

样本状态：
- ✅ JSON 格式验证通过
- ✅ 必需字段完整
- ✅ 敏感信息已脱敏
- ⚠️ 待 Golden Tests 验证

关联：
- refs: DEEPSEEK_TEST_PLAN.md
- refs: SAMPLE_CAPTURE_GUIDE.md"

# 推送
git push
```

---

## 验证命令

### 快速验证

```bash
# 检查必需文件
test -f fixtures/deepseek/raw/detail-sample-001.json && echo "✅ detail-sample-001.json"
test -f fixtures/deepseek/raw/list-sample-001.json && echo "✅ list-sample-001.json"
test -f fixtures/deepseek/raw/page-sample-001.html && echo "✅ page-sample-001.html"
test -f fixtures/deepseek/.sample-info.json && echo "✅ .sample-info.json"

# 验证 JSON 格式
jq -e '.' fixtures/deepseek/raw/detail-sample-001.json > /dev/null && echo "✅ detail JSON 有效"
jq -e '.' fixtures/deepseek/raw/list-sample-001.json > /dev/null && echo "✅ list JSON 有效"

# 验证必需字段
jq -e '.conversationId and .messages' fixtures/deepseek/raw/detail-sample-001.json > /dev/null && echo "✅ detail 包含必需字段"
jq -e '.conversations' fixtures/deepseek/raw/list-sample-001.json > /dev/null && echo "✅ list 包含必需字段"

# 检查敏感信息
grep -r "Cookie:" fixtures/deepseek/raw/*.curl 2>/dev/null | grep -v "\[REDACTED\]" && echo "⚠️ 发现未脱敏 Cookie" || echo "✅ Cookie 已脱敏"
grep -r "Authorization:" fixtures/deepseek/raw/*.curl 2>/dev/null | grep -v "\[REDACTED\]" && echo "⚠️ 发现未脱敏 Authorization" || echo "✅ Authorization 已脱敏"
```

### 运行测试

```bash
# 运行 DeepSeek contract tests
bun test tests/contracts/deepseek-contract.test.ts

# 运行 DeepSeek golden tests（需要真实样本）
bun test tests/golden/deepseek/deepseek-golden.test.ts

# 运行所有 DeepSeek 相关测试
bun test tests/contracts/deepseek-contract.test.ts tests/golden/deepseek/
```

---

## 采集完样本后下一步

### 1. 替换模板为真实数据

将采集的真实样本替换测试中的模板数据：

```typescript
// tests/golden/deepseek/deepseek-golden.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';

// 从模板切换到真实样本
const rawFixture = JSON.parse(
  readFileSync(join(__dirname, '../../../fixtures/deepseek/raw/detail-sample-001.json'), 'utf-8')
);
```

### 2. 校准 Schema 和 Normalizer

根据真实样本调整：

- [ ] 验证 `src/adapters/deepseek-types.ts` 中的类型定义
- [ ] 修复 `src/normalizers/deepseek.ts` 中的字段映射
- [ ] 验证 think/reasoning 块处理逻辑
- [ ] 更新时间戳转换逻辑（秒级 vs 毫秒级）

### 3. 更新 Golden Files

```bash
# 运行测试生成新的预期输出
bun test tests/golden/deepseek/deepseek-golden.test.ts --update-snapshot

# 或手动更新 golden 文件
# tests/golden/deepseek/expected-markdown-v1.md
# tests/golden/deepseek/expected-markdown-v2.md
# tests/golden/deepseek/expected-json.json
```

### 4. 连接到 tests/golden/contracts

样本验证通过后，将 DeepSeek 集成到统一的 contract 测试：

```typescript
// tests/contracts/adapter-contract.test.ts
import { DeepSeekAdapter } from '../../src/adapters/deepseek';
import { DeepSeekNormalizer } from '../../src/normalizers/deepseek';

describe('DeepSeek Adapter', () => {
  const adapter = new DeepSeekAdapter();
  const normalizer = new DeepSeekNormalizer();
  
  // 使用真实样本运行通用 contract 测试
  runAdapterContractTests(adapter, normalizer, 'deepseek');
});
```

### 5. 实现 L1 DOM 提取

基于 `page-sample-001.html` 分析 DOM 结构：

```typescript
// src/adapters/deepseek.ts
export class DeepSeekAdapter implements ChatAdapter {
  // ... 现有代码 ...
  
  async extractMessagesFromDom(document: Document): Promise<ExtractedMessage[]> {
    // 基于真实页面 HTML 实现选择器
    const messageElements = document.querySelectorAll('.message-item, [data-testid="message"]');
    // ... 实现提取逻辑
  }
}
```

### 6. 更新文档

- [ ] 更新 `DEEPSEEK_ADAPTER_NOTES.md` 的"已知信息"部分
- [ ] 更新 `DEEPSEEK_TEST_PLAN.md` 的完成状态
- [ ] 在 `ADAPTERS.md` 中更新 DeepSeek 状态

---

## 建议 Commit Message

### 首次提交样本包

```
feat(deepseek): 添加真实样本包（detail/list/page）

- 添加 detail-sample-001.json（对话详情 API 响应）
- 添加 list-sample-001.json（对话列表 API 响应）
- 添加 page-sample-001.html（对话页面 HTML）
- 添加 .sample-info.json 元数据
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
```

### 更新 Golden Tests

```
test(deepseek): 使用真实样本更新 Golden Tests

- 替换模板数据为真实样本
- 更新 expected-markdown-v1.md
- 更新 expected-markdown-v2.md
- 更新 expected-json.json
- 修复 Normalizer 字段映射问题

测试结果:
- ✅ 13/13 Golden Tests 通过
- ✅ Contract Tests 全部通过

关联:
- refs: fixtures/deepseek/raw/detail-sample-001.json
```

### 实现 L1 DOM 提取

```
feat(deepseek): 实现 L1 DOM 消息提取

- 分析 page-sample-001.html 的 DOM 结构
- 实现 extractMessagesFromDom() 方法
- 添加 DOM 选择器常量
- 添加 L1 功能验证测试

验证:
- ✅ 在真实页面上手动测试通过
- ✅ L1 单元测试通过

关联:
- refs: DEEPSEEK_TEST_PLAN.md (阶段 3)
```

---

## 常见问题

### Q: 样本文件应该多大？

A: 没有严格限制，但建议：
- **详情响应**: 1-10 条消息为宜（5KB-50KB）
- **列表响应**: 5-20 个会话为宜（2KB-20KB）
- **页面 HTML**: 完整页面（100KB-2MB）

### Q: 需要多少个样本？

A: 最小要求：
- **必需**: 1 个详情 + 1 个列表 + 1 个页面 HTML
- **推荐**: 3-5 个不同类型的详情样本（普通对话、Think 块、代码块等）
- **理想**: 10+ 个样本覆盖各种边界情况

### Q: 如何验证脱敏是否完整？

A: 使用以下命令检查：

```bash
# 搜索常见敏感字段
grep -rE "(Cookie|Authorization|Bearer|token|api_key|secret)" fixtures/deepseek/raw/ | grep -v "\[REDACTED\]"

# 检查是否有真实 URL 参数
grep -rE "\?[^\"']*=([^\"'\[\]]+)" fixtures/deepseek/raw/*.json
```

### Q: 样本采集后测试失败了怎么办？

A: 按以下步骤排查：
1. 检查 JSON 格式：`jq '.' file.json`
2. 检查必需字段：`jq '.conversationId and .messages' file.json`
3. 对比模板结构：`diff template-detail-001.json detail-sample-001.json`
4. 查看测试错误信息，调整 Normalizer 逻辑

---

## 相关文档

- [DEEPSEEK_TEST_PLAN.md](./DEEPSEEK_TEST_PLAN.md) - DeepSeek 测试计划
- [SAMPLE_CAPTURE_GUIDE.md](./SAMPLE_CAPTURE_GUIDE.md) - 样本采集通用指南
- [DEEPSEEK_ADAPTER_NOTES.md](./DEEPSEEK_ADAPTER_NOTES.md) - DeepSeek 适配器开发笔记
- [ADAPTER_TESTING.md](./ADAPTER_TESTING.md) - 适配器测试指南

---

**版本**: 1.0.0  
**最后更新**: 2026-03-19  
**维护者**: Chat Export Toolkit Team  
**状态**: 📋 模板阶段（等待真实样本采集）
