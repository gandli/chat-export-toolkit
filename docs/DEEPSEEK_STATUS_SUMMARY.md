# DeepSeek 适配器状态总结

> 本文档总结 DeepSeek 适配器当前状态、已完成工作和落地所需步骤。
> 
> **⚠️ 重要声明**: 当前为**测试驱动准备态**，所有实现基于模板数据，**不可用于生产环境**。

## 当前状态

**实现级别**: L1 骨架（模板阶段）

| 组件 | 状态 | 完成度 | 说明 |
|------|------|--------|------|
| 类型定义 | ✅ 完整 | 100% | 基于常见 AI 平台结构推测 |
| Adapter 实现 | 🟡 骨架 | 70% | 接口完整，核心逻辑待实现 |
| Normalizer 实现 | 🟡 骨架 | 80% | 逻辑完整，未经验证 |
| 测试框架 | ✅ 完整 | 100% | Contract + Golden 测试就绪 |
| Fixture 模板 | ✅ 完整 | 100% | 模板数据，非真实样本 |
| 真实样本 | ❌ 缺失 | 0% | **阻塞落地** |
| DOM 提取 | ❌ 未实现 | 0% | **阻塞 L1 功能** |
| API 拦截 | ❌ 未实现 | 0% | L2 功能，可选 |

## 已完成工作 ✅

### 1. 类型定义（100%）

- ✅ `src/adapters/deepseek-types.ts` - 完整的类型定义
- ✅ 支持多种可能的 API 响应结构
- ✅ 定义 DeepSeek 特有字段（reasoning_content 等）

### 2. Adapter 骨架（70%）

- ✅ `src/adapters/deepseek.ts` - DeepSeekAdapter 实现
- ✅ detect() 方法 - 域名检测
- ✅ extractMessages() 方法 - 消息提取
- ✅ getConversation() 方法 - 获取单个对话（骨架）
- ✅ listConversations() 方法 - 获取对话列表（骨架）
- ✅ 多结构兼容支持
- ✅ 错误处理和降级

### 3. Normalizer 骨架（80%）

- ✅ `src/normalizers/deepseek.ts` - DeepSeekNormalizer 实现
- ✅ normalizeConversation() - 对话标准化
- ✅ normalizeMessage() - 消息标准化
- ✅ Think/Reasoning 块处理
- ✅ 代码块处理
- ✅ 时间戳转换
- ✅ Metadata 保留
- ✅ 边界情况处理

### 4. 测试资产（100%）

#### Contract Tests
- ✅ `tests/contracts/deepseek-contract.test.ts` - 31 个测试通过
- ✅ 验证 Adapter 接口契约
- ✅ 验证 Normalizer 输出 schema
- ✅ 验证边界情况处理

#### Golden Tests
- ✅ `tests/golden/deepseek/deepseek-golden.test.ts` - 13 个测试通过
- ✅ 验证标准化输出一致性
- ✅ 验证 Markdown 导出格式（V1/V2）
- ✅ 验证 JSON 导出格式
- ✅ 验证 Think/Reasoning 处理
- ✅ 验证代码块处理
- ✅ 验证边界情况

#### Fixtures
- ✅ `fixtures/deepseek/raw/template-detail-001.json` - 对话详情模板
- ✅ `fixtures/deepseek/raw/template-edge-001.json` - 边界情况模板
- ✅ `fixtures/deepseek/normalized/template-normalized-001.json` - 标准化模板
- ✅ `fixtures/deepseek/normalized/template-normalized-edge-001.json` - 边界情况标准化模板

#### Golden Files
- ✅ `tests/golden/deepseek/expected-markdown-v1.md` - V1 Markdown 预期
- ✅ `tests/golden/deepseek/expected-markdown-v2.md` - V2 Markdown 预期
- ✅ `tests/golden/deepseek/expected-json.json` - JSON 预期
- ✅ `tests/golden/deepseek/expected-zip-manifest.json` - ZIP manifest 预期

### 5. 文档（100%）

- ✅ `docs/DEEPSEEK_ADAPTER_NOTES.md` - 适配器开发笔记
- ✅ `docs/DEEPSEEK_TEST_PLAN.md` - 测试计划
- ✅ `fixtures/deepseek/README.md` - Fixture 说明
- ✅ `fixtures/deepseek/raw/README.md` - 原始数据说明
- ✅ `fixtures/deepseek/normalized/README.md` - 标准化数据说明
- ✅ `tests/golden/deepseek/README.md` - Golden tests 说明

## 落地阶段拆解

DeepSeek 适配器的落地分为四个明确阶段，**必须按顺序完成**：

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  阶段 1      │ →  │  阶段 2      │ →  │  阶段 3      │ →  │  阶段 4      │
│  样本采集    │    │  Schema 校准  │    │  L1 DOM 提取 │    │  L2 拦截    │
│  (阻塞)     │    │  (阻塞)     │    │  (核心)     │    │  (增强)     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     ↓                    ↓                    ↓                    ↓
  真实 API 响应          类型定义验证          页面消息提取          完整对话获取
  页面 HTML 结构         Normalizer 修复       基础功能可用          批量导出能力
```

### 阶段 1: 样本采集 🔴（当前阻塞点）

**目标**: 获取真实的 DeepSeek 数据样本

**必需产出**:
- [ ] `fixtures/deepseek/raw/detail-sample-001.json` - 至少 1 个完整对话的 API 响应
- [ ] `fixtures/deepseek/raw/page-sample-001.html` - 对话页面的完整 HTML
- [ ] `fixtures/deepseek/raw/list-sample-001.json` - 对话列表 API 响应（可选）

**采集方法**:
```bash
# 1. 访问 https://chat.deepseek.com
# 2. 打开开发者工具 → Network
# 3. 进行对话操作（发送消息、切换对话）
# 4. 捕获 API 响应（JSON）
# 5. 在 Console 执行：document.documentElement.outerHTML
# 6. 脱敏后保存为 fixture
```

**完成标志**: fixture 目录包含真实样本文件（非模板）

**当前状态**: ❌ 未开始

---

### 阶段 2: Schema 校准 🟡（样本采集后）

**目标**: 验证并修正类型定义和 Normalizer 逻辑

**任务**:
- [ ] 用真实样本替换模板运行 golden tests
- [ ] 验证 `deepseek-types.ts` 中的类型定义
- [ ] 修复 `normalizers/deepseek.ts` 中的字段映射
- [ ] 更新 golden 文件以匹配真实输出
- [ ] 验证 think/reasoning 块是否存在及格式

**完成标志**: 所有 golden tests 使用真实数据通过

**当前状态**: ⏸️ 等待样本

---

### 阶段 3: L1 DOM 提取 🟢（核心功能）

**目标**: 实现从当前页面 DOM 提取可见消息

**任务**:
- [ ] 分析 `page-sample-001.html` 的 DOM 结构
- [ ] 识别消息容器选择器（如 `.message`, `[data-role]`）
- [ ] 识别角色标识方式（class / data 属性 / 文本）
- [ ] 识别内容区域选择器（如 `.content`, `.message-text`）
- [ ] 实现 `extractConversationMetasFromDom()` 方法
- [ ] 实现 `getConversation()` 的 DOM 提取回退逻辑
- [ ] 编写 L1 功能验证测试

**完成标志**: 在 DeepSeek 页面上可提取当前对话的消息

**当前状态**: ⏸️ 等待 DOM 分析

---

### 阶段 4: L2 API 拦截 🟢（增强功能）

**目标**: 通过拦截 API 响应获取完整对话历史

**任务**:
- [ ] 识别对话详情 API 端点
- [ ] 识别对话列表 API 端点
- [ ] 实现 `installInterceptors()` 方法
- [ ] 拦截 XHR 和 fetch 请求
- [ ] 解析并缓存响应数据
- [ ] 实现增量获取逻辑

**完成标志**: 可获取完整对话历史（不仅是可见消息）

**当前状态**: ⏸️ 等待 L1 完成

---

## 当前"不能做什么" 🔴

**请明确以下限制，避免误用**:

| 功能 | 当前状态 | 原因 |
|------|----------|------|
| 从 DeepSeek 页面导出对话 | ❌ 不可用 | DOM 提取未实现 |
| 获取完整对话历史 | ❌ 不可用 | API 拦截未实现 |
| 批量导出多个对话 | ❌ 不可用 | 列表 API 未实现 |
| 验证类型定义正确性 | ❌ 无法验证 | 无真实样本 |
| 验证 DOM 选择器 | ❌ 无法验证 | 无真实 HTML |
| 处理 DeepSeek 特有功能 | ⚠️ 推测 | think/reasoning 未验证 |

**唯一可用的功能**:
- ✅ 运行测试（使用模板数据）
- ✅ 查看代码结构（作为参考）
- ✅ 理解适配器架构

**不要**:
- ❌ 在生产环境使用此适配器
- ❌ 向用户承诺 DeepSeek 支持
- ❌ 基于当前代码推断 API 结构

### 重要项（核心功能）

#### 4. L1 DOM 提取实现 🟡

**问题**: 当前 getConversation() 返回 null，无法从页面提取消息

**需要**:
- [ ] 实现 extractConversationMetasFromDom() 方法
- [ ] 实现从 DOM 中提取消息的逻辑
- [ ] 验证提取结果

**影响**: 基础功能不可用

**优先级**: 🟡 中

#### 5. Golden Test 真实数据验证 🟡

**问题**: 当前 golden tests 使用模板数据

**需要**:
- [ ] 用真实样本替换模板
- [ ] 运行 golden tests
- [ ] 修复发现的问题
- [ ] 更新 golden 文件

**影响**: 无法保证输出质量

**优先级**: 🟡 中

#### 6. Think/Reasoning 块验证 🟡

**问题**: DeepSeek 是否支持 think/reasoning 块未经验证

**需要**:
- [ ] 确认 DeepSeek 是否有类似功能
- [ ] 如果有，验证字段名和格式
- [ ] 更新 normalizer 逻辑

**影响**: DeepSeek 特有功能可能无法正确处理

**优先级**: 🟡 中

### 次要项（增强功能）

#### 7. L2 API 拦截 🟢

**问题**: 未实现 API 响应拦截

**需要**:
- [ ] 实现 installInterceptors() 方法
- [ ] 拦截 XHR 请求
- [ ] 拦截 fetch 请求
- [ ] 解析并缓存响应

**影响**: 无法获取完整对话历史

**优先级**: 🟢 低

#### 8. L3 主动调用 🟢

**问题**: 未实现主动 API 调用

**需要**:
- [ ] 实现 fetchConversationDetail() 方法
- [ ] 实现 fetchConversationList() 方法
- [ ] 处理认证
- [ ] 处理分页

**影响**: 无法批量导出

**优先级**: 🟢 低

## 最短落地路径

### 第一次可演示的最小范围

**目标**: 证明 DeepSeek 适配器可以工作（不追求完整）

**范围**:
1. 采集 1 个简单对话的样本（纯文本，无复杂功能）
2. 验证 normalizer 可以处理真实数据
3. 实现最基础的 DOM 消息提取

**具体步骤**:

```
第 1 步：样本采集（2 小时）
├─ 访问 https://chat.deepseek.com
├─ 进行 2-3 轮简单对话
├─ 捕获 API 响应 → detail-sample-001.json
└─ 保存页面 HTML → page-sample-001.html

第 2 步：Schema 校准（2 小时）
├─ 替换模板为真实样本
├─ 运行 golden tests
├─ 修复字段映射问题
└─ 确保测试通过

第 3 步：L1 提取验证（4 小时）
├─ 分析 HTML 找到消息选择器
├─ 实现 extractMessagesFromDom()
├─ 在页面上测试提取
└─ 验证输出格式

第 4 步：演示准备（1 小时）
├─ 录制演示视频/截图
├─ 准备演示脚本
└─ 整理注意事项
```

**第一次演示应展示**:
- ✅ 在 DeepSeek 页面上运行适配器
- ✅ 提取当前对话的消息
- ✅ 导出为 Markdown 或 JSON
- ✅ 明确说明这是 MVP，仅支持基础功能

**不包含**:
- ❌ 对话列表
- ❌ 批量导出
- ❌ API 拦截
- ❌ 复杂内容（图片、文件、引用）

---

## 完整落地路径（参考）

| 阶段 | 任务 | 预计时间 | 依赖 | 产出 |
|------|------|----------|------|------|
| 阶段 1 | 样本采集 | 2-4 小时 | 人工访问 | 真实 fixture |
| 阶段 2 | Schema 校准 | 2-4 小时 | 阶段 1 | 修复的 normalizer |
| 阶段 3 | L1 DOM 提取 | 4-8 小时 | 阶段 2 | 可用的 DOM 提取 |
| 阶段 4 | L2 API 拦截 | 8-16 小时 | 阶段 3 | 完整对话获取 |
| 阶段 5 | 文档与发布 | 2-4 小时 | 阶段 3/4 | 完整文档 |

**总计**: 18-36 小时（不含缓冲）

## 成功标准

DeepSeek 适配器达到"可落地"的标志：

### 阶段 1 完成标准（样本采集）
- [ ] `fixtures/deepseek/raw/detail-sample-001.json` 存在且包含真实数据
- [ ] `fixtures/deepseek/raw/page-sample-001.html` 存在
- [ ] 样本已脱敏（移除个人信息、token 等）

### 阶段 2 完成标准（Schema 校准）
- [x] ✅ 类型定义完整（deepseek-types.ts）
- [x] ✅ Normalizer 骨架实现（deepseek.ts normalizer）
- [x] ✅ Fixture 模板完整
- [x] ✅ Golden test 框架完整
- [ ] 📋 Golden test 使用真实数据通过
- [ ] 📋 所有字段映射验证完成

### 阶段 3 完成标准（L1 功能）
- [ ] 🔴 DOM 结构分析完成
- [ ] 🔴 消息选择器验证
- [ ] 🔴 `extractMessagesFromDom()` 实现
- [ ] 🔴 L1 功能测试通过
- [ ] 🔴 手动验证通过（真实页面）

### 阶段 4 完成标准（L2 功能，可选）
- [ ] 🟢 API 端点识别
- [ ] 🟢 拦截器实现
- [ ] 🟢 完整对话获取测试

### 文档完成标准
- [ ] 🟢 DEEPSEEK_ADAPTER_NOTES.md 更新
- [ ] 🟢 使用指南编写
- [ ] 🟢 已知问题记录

---

## 下一步行动

### 立即可做（无需真实样本）✅

以下工作已完成：
- [x] ✅ 完善 fixture 模板
- [x] ✅ 创建 golden test（13 个测试通过）
- [x] ✅ 创建 contract test（31 个测试通过）
- [x] ✅ 更新文档
- [x] ✅ 运行现有测试确保不报错

### 需要人工介入（下一步）🔴

**这是当前阻塞点，需要人工完成**:

1. **访问 DeepSeek 网页版**
   - 打开 https://chat.deepseek.com
   - 登录账户（如果需要）
   - 创建或打开一个对话

2. **捕获 API 响应**
   - 打开开发者工具 → Network
   - 找到对话详情 API 请求
   - 复制响应 JSON
   - 保存为 `fixtures/deepseek/raw/detail-sample-001.json`

3. **捕获页面 HTML**
   - 在 Console 执行：`document.documentElement.outerHTML`
   - 或使用"另存为"保存完整 HTML
   - 保存为 `fixtures/deepseek/raw/page-sample-001.html`

4. **脱敏处理**
   - 移除个人信息
   - 移除认证 token
   - 移除敏感数据

### 样本采集后

1. 替换模板为真实数据
2. 运行 golden tests
3. 修复发现的问题
4. 实现 L1 DOM 提取
5. 验证 L1 功能

---

## 测试命令

```bash
# 运行所有 DeepSeek 测试
bun test tests/contracts/deepseek-contract.test.ts tests/golden/deepseek/

# 仅运行 contract tests
bun test tests/contracts/deepseek-contract.test.ts

# 仅运行 golden tests
bun test tests/golden/deepseek/deepseek-golden.test.ts

# 带覆盖率运行
bun test --coverage tests/contracts/deepseek-contract.test.ts tests/golden/deepseek/
```

---

## 建议 Commit Message

### 当前状态（测试驱动准备态）

```
feat(deepseek): 完成测试驱动准备，进入样本采集等待态

- 完善 fixture 模板（template-detail-001, template-edge-001）
- 创建 golden tests（13 个测试覆盖 normalizer 输出）
- 创建 contract tests（31 个测试验证接口契约）
- 更新 DEEPSEEK_STATUS_SUMMARY.md 明确落地阶段
- 更新 DEEPSEEK_TEST_PLAN.md 明确测试优先级
- 明确当前限制：模板阶段，不可用于生产

下一步：采集真实 DeepSeek 样本（需要人工介入）
```

### 阶段 1 完成后（样本采集）

```
feat(deepseek): 采集真实样本，完成阶段 1

- 添加真实 API 响应样本 detail-sample-001.json
- 添加页面 HTML 样本 page-sample-001.html
- 样本已脱敏处理
- 更新 fixture README 说明

进入阶段 2: Schema 校准
```

### 阶段 2 完成后（Schema 校准）

```
feat(deepseek): 完成 Schema 校准，golden tests 使用真实数据

- 修复 normalizer 字段映射
- 更新类型定义匹配真实 API
- golden tests 全部通过（使用真实样本）
- 验证 think/reasoning 块处理

进入阶段 3: L1 DOM 提取实现
```

### 阶段 3 完成后（L1 功能）

```
feat(deepseek): 实现 L1 DOM 提取，基础功能可用

- 分析 DOM 结构，确定消息选择器
- 实现 extractMessagesFromDom() 方法
- 实现 getConversation() DOM 回退逻辑
- 添加 L1 功能验证测试
- 手动验证通过

🎉 DeepSeek 适配器 MVP 完成，可演示基础导出功能
```

---

## 相关文档

- [DEEPSEEK_ADAPTER_NOTES.md](./DEEPSEEK_ADAPTER_NOTES.md) - 适配器开发笔记
- [DEEPSEEK_TEST_PLAN.md](./DEEPSEEK_TEST_PLAN.md) - 测试计划
- [SAMPLE_CAPTURE_GUIDE.md](./SAMPLE_CAPTURE_GUIDE.md) - 样本采集指南
- [ADAPTER_TESTING.md](./ADAPTER_TESTING.md) - 适配器测试指南

---

**最后更新**: 2026-03-19  
**状态**: 测试驱动可落地准备态（等待真实样本）  
**下一步**: 采集真实 DeepSeek 样本（需要人工介入）  
**当前限制**: 模板阶段，不可用于生产环境
