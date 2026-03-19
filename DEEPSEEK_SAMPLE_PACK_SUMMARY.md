# DeepSeek 样本采集执行包 - 创建总结

> **创建时间**: 2026-03-19  
> **目标**: 为 DeepSeek 真实样本采集整理执行包，降低第一次落地门槛

---

## 已创建文件清单

### 核心文档

| 文件 | 路径 | 说明 | 状态 |
|------|------|------|------|
| **样本包规范** | `docs/DEEPSEEK_SAMPLE_PACK.md` | DeepSeek 样本包提交规范（13.5KB） | ✅ 新建 |
| **初始化脚本** | `scripts/prepare-deepseek-sample-pack.ts` | 生成样本包目录结构和模板（15.4KB） | ✅ 新建 |
| **验证脚本** | `scripts/validate-deepseek-samples.ts` | 验证样本文件完整性和格式（7.5KB） | ✅ 新建 |
| **采集清单** | `fixtures/deepseek/CHECKLIST.md` | 详细的采集检查清单（5KB） | ✅ 新建 |
| **脱敏脚本** | `fixtures/deepseek/sanitize.sh` | 批量脱敏脚本（1.7KB） | ✅ 新建 |
| **元数据模板** | `fixtures/deepseek/.sample-info.json` | 样本包元数据（1KB） | ✅ 新建 |

### 更新的文档

| 文件 | 变更 | 说明 |
|------|------|------|
| `fixtures/deepseek/README.md` | 添加快速开始、引用新文档 | ✅ 已更新 |
| `docs/DEEPSEEK_TEST_PLAN.md` | 添加样本包规范引用、细化阶段 1 任务 | ✅ 已更新 |
| `docs/SAMPLE_CAPTURE_GUIDE.md` | 添加 DeepSeek 专项指南附录 | ✅ 已更新 |

### 创建的目录

```
fixtures/deepseek/
├── screenshots/          # 页面截图目录
└── logs/                 # 采集日志目录
```

---

## 最小样本包要求

### 必需文件（🔴 阻塞）

| 文件 | 路径 | 验证命令 |
|------|------|---------|
| 详情响应 | `fixtures/deepseek/raw/detail-sample-001.json` | `jq '.conversationId and .messages'` |
| 列表响应 | `fixtures/deepseek/raw/list-sample-001.json` | `jq '.conversations'` |
| 页面 HTML | `fixtures/deepseek/raw/page-sample-001.html` | 可在浏览器打开 |
| 元数据 | `fixtures/deepseek/.sample-info.json` | 脚本自动生成 |

### 推荐文件（🟡 建议）

- `fixtures/deepseek/raw/edge-sample-001.json` - 边界情况样本
- `fixtures/deepseek/raw/think-sample-001.json` - Think 块样本
- `fixtures/deepseek/raw/code-sample-001.json` - 代码块样本
- `fixtures/deepseek/screenshots/detail-page.png` - 详情页截图
- `fixtures/deepseek/screenshots/list-page.png` - 列表页截图

---

## 使用流程

### 1. 初始化样本包

```bash
cd /Users/user/.openclaw/workspace/chat-export-toolkit

# 生成目录结构和模板文件
bun run scripts/prepare-deepseek-sample-pack.ts
```

输出示例：
```
🔧 准备 DeepSeek 样本包目录结构...

📁 创建目录结构:
   ✅ 创建 screenshots/
   ✅ 创建 logs/

📄 生成模板文件:
✅ 生成 .sample-info.json 模板
✅ 生成 CHECKLIST.md
✅ 生成 sanitize.sh

✨ 样本包结构准备完成！
```

### 2. 采集样本

按照 `fixtures/deepseek/CHECKLIST.md` 的指引：

1. 访问 https://chat.deepseek.com 并登录
2. 打开开发者工具 (F12) → Network 标签
3. 筛选 `detail` 或 `conversation` 关键词
4. 找到详情 API 请求，复制响应 → `raw/detail-sample-001.json`
5. 找到列表 API 请求，复制响应 → `raw/list-sample-001.json`
6. 保存页面 HTML → `raw/page-sample-001.html`

### 3. 脱敏处理

```bash
# 运行脱敏脚本
bash fixtures/deepseek/sanitize.sh

# 或手动编辑文件
# 替换 conversationId, userId, messageId 等字段
```

### 4. 验证样本

```bash
# 运行验证脚本
bun run scripts/validate-deepseek-samples.ts

# 手动验证 JSON 格式
jq '.' fixtures/deepseek/raw/detail-sample-001.json > /dev/null && echo "✅ 格式正确"

# 检查必需字段
jq -e '.conversationId and .messages' fixtures/deepseek/raw/detail-sample-001.json > /dev/null && echo "✅ 字段完整"
```

### 5. 提交 Git

```bash
# 检查变更
git status
git diff fixtures/deepseek/

# 添加文件
git add fixtures/deepseek/
git add docs/DEEPSEEK_SAMPLE_PACK.md
git add scripts/prepare-deepseek-sample-pack.ts
git add scripts/validate-deepseek-samples.ts

# 提交（使用建议的 commit message）
git commit -m "feat(deepseek): 添加真实样本包（detail/list/page）

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
- refs: DEEPSEEK_SAMPLE_PACK.md"

# 推送
git push
```

---

## 采集完样本后下一步

### 1. 替换测试中的模板数据

编辑 `tests/golden/deepseek/deepseek-golden.test.ts`：

```typescript
// 从模板切换到真实样本
const rawFixture = JSON.parse(
  readFileSync(
    join(__dirname, '../../../fixtures/deepseek/raw/detail-sample-001.json'),
    'utf-8'
  )
);
```

### 2. 校准 Schema 和 Normalizer

根据真实样本调整：

- [ ] 验证 `src/adapters/deepseek-types.ts` 中的类型定义
- [ ] 修复 `src/normalizers/deepseek.ts` 中的字段映射
- [ ] 验证 think/reasoning 块处理逻辑
- [ ] 更新时间戳转换逻辑（秒级 vs 毫秒级）

### 3. 运行 Golden Tests

```bash
# 运行 DeepSeek golden tests
bun test tests/golden/deepseek/deepseek-golden.test.ts

# 如有失败，更新 golden 文件
bun test tests/golden/deepseek/deepseek-golden.test.ts --update-snapshot
```

### 4. 连接到 tests/golden/contracts

将 DeepSeek 集成到统一的 contract 测试：

```typescript
// tests/contracts/adapter-contract.test.ts
import { DeepSeekAdapter } from '../../src/adapters/deepseek';
import { DeepSeekNormalizer } from '../../src/normalizers/deepseek';

describe('DeepSeek Adapter', () => {
  const adapter = new DeepSeekAdapter();
  const normalizer = new DeepSeekNormalizer();
  
  runAdapterContractTests(adapter, normalizer, 'deepseek');
});
```

### 5. 实现 L1 DOM 提取

基于 `page-sample-001.html` 分析 DOM 结构：

```typescript
// src/adapters/deepseek.ts
export class DeepSeekAdapter implements ChatAdapter {
  async extractMessagesFromDom(document: Document): Promise<ExtractedMessage[]> {
    // 基于真实页面 HTML 实现选择器
    const messageElements = document.querySelectorAll('.message-item');
    // ... 实现提取逻辑
  }
}
```

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

## 验证命令汇总

```bash
# 初始化样本包
bun run scripts/prepare-deepseek-sample-pack.ts

# 验证样本
bun run scripts/validate-deepseek-samples.ts

# 脱敏处理
bash fixtures/deepseek/sanitize.sh

# 手动验证 JSON
jq '.' fixtures/deepseek/raw/detail-sample-001.json

# 检查必需字段
jq -e '.conversationId and .messages' fixtures/deepseek/raw/detail-sample-001.json

# 检查敏感信息
grep -E "Cookie:|Authorization:" fixtures/deepseek/raw/*.curl 2>/dev/null | grep -v "\[REDACTED\]"

# 运行测试
bun test tests/contracts/deepseek-contract.test.ts
bun test tests/golden/deepseek/deepseek-golden.test.ts
```

---

## 相关文档

- [`docs/DEEPSEEK_SAMPLE_PACK.md`](./docs/DEEPSEEK_SAMPLE_PACK.md) - DeepSeek 样本包提交规范（**核心**）
- [`fixtures/deepseek/CHECKLIST.md`](./fixtures/deepseek/CHECKLIST.md) - 采集检查清单
- [`docs/SAMPLE_CAPTURE_GUIDE.md`](./docs/SAMPLE_CAPTURE_GUIDE.md) - 样本采集通用指南（含 DeepSeek 专项）
- [`docs/DEEPSEEK_TEST_PLAN.md`](./docs/DEEPSEEK_TEST_PLAN.md) - DeepSeek 测试计划
- [`docs/DEEPSEEK_ADAPTER_NOTES.md`](./docs/DEEPSEEK_ADAPTER_NOTES.md) - DeepSeek 适配器开发笔记

---

## 注意事项

⚠️ **重要提醒**:

1. **不要伪造真实样本** - 所有样本必须从真实 DeepSeek 页面采集
2. **不要声称 DeepSeek 已可用** - 当前仍为模板阶段，需等待真实样本验证
3. **必须脱敏** - 提交前务必移除所有敏感信息（Cookie、Token、真实对话内容等）
4. **验证 JSON 格式** - 使用 `jq '.'` 确保 JSON 格式正确
5. **更新元数据** - 采集后更新 `.sample-info.json` 中的采集时间、浏览器版本等信息

---

## 预期成果

完成样本采集后，DeepSeek 适配器将具备：

- ✅ 真实 API 响应样本用于验证类型定义
- ✅ 真实页面 HTML 用于实现 L1 DOM 提取
- ✅ Golden Tests 使用真实数据运行
- ✅ Contract Tests 完整覆盖
- ✅ 完整的样本包规范和采集流程文档

**下一步**: 按照本总结中的流程采集真实样本，然后接入 `tests/golden/contracts` 进行验证。

---

**创建者**: Chat Export Toolkit Team  
**创建时间**: 2026-03-19  
**状态**: ✅ 执行包已就绪，等待样本采集
