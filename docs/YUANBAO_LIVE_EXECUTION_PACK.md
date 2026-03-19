# Yuanbao 真机实测执行包

**版本**: v0.7.0-alpha.1  
**创建日期**: 2026-03-19  
**用途**: 指导人工验证者在腾讯元宝真实页面上执行 Chat Export Toolkit V2 的完整测试流程

---

## 📦 执行包内容

本执行包包含：

| 组件 | 路径 | 用途 |
|------|------|------|
| **Userscript** | `userscripts/chat-export.v2.user.js` | 核心脚本，安装到 Tampermonkey |
| **执行指南** | `docs/YUANBAO_LIVE_EXECUTION_PACK.md` | 本文档，逐步执行流程 |
| **验证清单** | `docs/YUANBAO_LIVE_VALIDATION.md` | 详细验证标准 |
| **测试计划** | `docs/TAMPERMONKEY_TEST_PLAN.md` | 完整测试项目定义 |
| **样本目录** | `fixtures/yuanbao-live/` | 存放采集的 API 样本和证据 |
| **辅助脚本** | `scripts/` | 验证和诊断工具 |

---

## 🚀 快速开始（5 分钟 Smoke Test）

### 步骤 1: 环境准备

```bash
# 1. 进入仓库
cd /Users/user/.openclaw/workspace/chat-export-toolkit

# 2. 安装依赖
bun install

# 3. 构建 Userscript
bun run build

# 4. 验证构建产物
bun run scripts/verify-build.ts
```

**预期输出**:
```
✅ Userscript 存在
✅ Userscript 大小：~305 KB
✅ Userscript 元数据：完整
✅ 所有检查通过！
```

### 步骤 2: 安装 Userscript

**方式 A: 直接打开（推荐）**
```bash
open userscripts/chat-export.v2.user.js
```
→ Tampermonkey 会自动弹出安装确认页 → 点击「安装」

**方式 B: 手动复制**
1. 打开 Tampermonkey 仪表板
2. 点击「创建新脚本」
3. 复制 `userscripts/chat-export.v2.user.js` 全部内容
4. 粘贴到编辑器 → 保存（Ctrl/Cmd+S）

### 步骤 3: 打开目标页面

1. 访问 https://yuanbao.tencent.com
2. 确保已登录账号
3. 打开开发者工具（F12）
4. 切换到 **Console** 标签

### 步骤 4: 检查日志

**应看到的日志**:
```
╔════════════════════════════════════════════════════════╗
║     Chat Export Toolkit V2                            ║
║     Version: 2.0.0-alpha                              ║
╚════════════════════════════════════════════════════════╝

[YuanbaoAdapter] detect called
[YuanbaoAdapter] Platform detected: yuanbao.tencent.com
[YuanbaoAdapter] init called
[YuanbaoAdapter] API interceptor installed
[Toolkit] ✅ Initialization complete
```

**同时检查**:
- [ ] 页面右下角出现 🟦 浮动按钮（FAB）
- [ ] 控制台无红色错误

### 步骤 5: 测试导出

1. 点击 🟦 浮动按钮 → 弹出导出面板
2. 选择格式：**JSON**
3. 选择范围：**当前会话**
4. 点击「导出」按钮
5. 浏览器应触发下载

### 步骤 6: 验证导出文件

```bash
# 1. 找到下载的文件（格式：yuanbao-export-YYYYMMDD-HHMMSS.json）
# 2. 验证 JSON 格式
jq '.' ~/Downloads/yuanbao-export-*.json | head -30

# 3. 检查必需字段
jq -e '.id and .title and .messages' ~/Downloads/yuanbao-export-*.json > /dev/null && echo "✅ 结构正确"
```

**预期结构**:
```json
{
  "id": "conversation_id",
  "title": "对话标题",
  "platform": "yuanbao",
  "messages": [
    {
      "id": "msg_001",
      "role": "user|assistant",
      "content": { "text": "..." },
      "timestamp": 1710840000000
    }
  ],
  "metadata": {
    "platform": "yuanbao",
    "messageCount": 4
  }
}
```

### 步骤 7: 记录结果

使用下方的 [结果记录模板](#-结果记录模板) 记录测试结果。

---

## 📋 完整执行流程（30 分钟）

### 阶段 1: 安装与加载验证

#### 1.1 安装 Userscript

- [ ] 访问 `userscripts/chat-export.v2.user.js` 时 Tampermonkey 识别脚本
- [ ] 安装对话框显示正确元数据（名称、版本、@match 规则）
- [ ] 安装后脚本出现在 Tampermonkey 仪表板
- [ ] 脚本状态为「启用」

#### 1.2 验证加载

1. 访问 https://yuanbao.tencent.com
2. 打开开发者工具（F12）
3. 查看 Console 标签

**检查项**:
- [ ] 显示版本横幅
- [ ] 显示平台检测结果
- [ ] 显示拦截器安装日志
- [ ] 无 JavaScript 错误

**截图证据**:
```bash
# 保存控制台截图
# 开发者工具 → 右上角菜单 → Capture screenshot
# 保存到：fixtures/yuanbao-live/screenshots/console-init.png
```

#### 1.3 验证 UI 注入

- [ ] FAB 按钮出现在页面右下角
- [ ] FAB 按钮不被页面元素遮挡
- [ ] 点击 FAB 按钮弹出导出面板
- [ ] 面板包含格式选择器（JSON/Markdown/ZIP）
- [ ] 面板包含范围选择器（当前会话/全部会话）

**截图证据**:
```bash
# 保存 FAB 按钮截图
# 保存到：fixtures/yuanbao-live/screenshots/fab-button.png

# 保存导出面板截图
# 保存到：fixtures/yuanbao-live/screenshots/export-panel.png
```

---

### 阶段 2: API 拦截验证

#### 2.1 准备 Network 抓包

1. 开发者工具 → Network 标签
2. 勾选 **Preserve log**（保留日志）
3. 筛选框输入：`yuanbao` 或 `conversation`
4. 类型筛选：**XHR** / **Fetch**

#### 2.2 触发 API 请求

1. **刷新页面** → 触发对话列表请求
2. **切换对话** → 触发对话详情请求
3. **发送消息** → 触发消息发送和响应

#### 2.3 验证拦截日志

**在 Console 中应看到**:
```
[Interceptor] Fetch intercepted: POST /api/user/agent/conversation/v2/detail
[YuanbaoAdapter] handleResponse called
[YuanbaoAdapter] Conversation cached: abc123
[YuanbaoAdapter] ✅ Response processed successfully
```

**截图证据**:
```bash
# 保存 Network 面板截图（显示 detail 和 list 请求）
# 保存到：fixtures/yuanbao-live/screenshots/network-requests.png
```

#### 2.4 采集 API 样本

**采集详情请求**:
1. 在 Network 面板找到 `detail` 请求
2. 右键 → **Copy** → **Copy as cURL**
3. 保存为：`fixtures/yuanbao-live/detail-request.curl`

**采集详情响应**:
1. 右键 → **Copy** → **Copy response**
2. 保存为：`fixtures/yuanbao-live/detail-response.json`

**采集列表请求**:
1. 在 Network 面板找到 `list` 请求
2. 右键 → **Copy** → **Copy as cURL**
3. 保存为：`fixtures/yuanbao-live/list-request.curl`

**采集列表响应**:
1. 右键 → **Copy** → **Copy response**
2. 保存为：`fixtures/yuanbao-live/list-response.json`

**脱敏处理**（⚠️ 必须执行）:
```bash
# 替换 cURL 中的敏感信息
sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' fixtures/yuanbao-live/detail-request.curl
sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' fixtures/yuanbao-live/list-request.curl
sed -i '' 's/Authorization: [^"]*/Authorization: [REDACTED]/g' fixtures/yuanbao-live/*.curl

# 替换 JSON 中的敏感字段
jq '.conversationId = "[CONVERSATION_ID]" | .userId = "[USER_ID]"' fixtures/yuanbao-live/detail-response.json > tmp.json && mv tmp.json fixtures/yuanbao-live/detail-response.json
```

**验证样本**:
```bash
bun run scripts/validate-yuanbao-samples.ts
```

---

### 阶段 3: 导出功能验证

#### 3.1 JSON 格式导出

- [ ] 选择 JSON 格式
- [ ] 选择当前会话
- [ ] 点击导出 → 触发下载
- [ ] 文件名格式：`yuanbao-export-YYYYMMDD-HHMMSS.json`
- [ ] 文件可打开且 JSON 格式正确
- [ ] 包含必需字段：`id`, `title`, `messages`, `metadata`

**验证命令**:
```bash
jq '.' ~/Downloads/yuanbao-export-*.json | head -50
jq -e '.id and .title and .messages and .metadata.platform' ~/Downloads/yuanbao-export-*.json > /dev/null && echo "✅ JSON 结构正确"
```

#### 3.2 Markdown 格式导出

- [ ] 选择 Markdown 格式
- [ ] 选择当前会话
- [ ] 点击导出 → 触发下载
- [ ] 文件名格式：`yuanbao-export-YYYYMMDD-HHMMSS.md`
- [ ] 文件可打开且格式正确

**验证命令**:
```bash
head -30 ~/Downloads/yuanbao-export-*.md
```

**预期格式**:
```markdown
# 对话标题

**导出时间**: 2024-03-19 16:00:00
**平台**: yuanbao
**消息数**: 4

---

### 第 1 轮 - 用户

> 时间：2024-03-19 16:00:00

你好，请介绍一下你自己。

---

### 第 2 轮 - 助手

> 时间：2024-03-19 16:00:05

你好！我是腾讯元宝...
```

#### 3.3 批量导出（如实现）

- [ ] 选择「全部会话」范围
- [ ] 点击导出 → 触发 ZIP 下载
- [ ] ZIP 文件可解压
- [ ] 解压后包含多个导出文件

---

### 阶段 4: 异常场景验证

#### 4.1 网络中断恢复

1. 断开网络连接
2. 尝试导出
3. **预期**: 显示友好错误提示，不崩溃
4. 恢复网络连接
5. 再次导出
6. **预期**: 功能恢复正常

#### 4.2 页面刷新恢复

1. 执行导出操作
2. 刷新页面（F5）
3. **预期**: 脚本重新初始化，功能正常

#### 4.3 路由切换（SPA）

1. 在 Yuanbao 内切换对话
2. **预期**: 脚本保持工作，无需重新加载

---

### 阶段 5: 证据收集

#### 必须收集的证据

| 证据类型 | 文件名 | 保存位置 | 说明 |
|----------|--------|----------|------|
| **控制台初始化日志** | `console-init.png` | `fixtures/yuanbao-live/screenshots/` | 显示版本横幅和初始化日志 |
| **FAB 按钮** | `fab-button.png` | `fixtures/yuanbao-live/screenshots/` | 显示浮动按钮在页面右下角 |
| **导出面板** | `export-panel.png` | `fixtures/yuanbao-live/screenshots/` | 显示导出选项 |
| **Network 请求** | `network-requests.png` | `fixtures/yuanbao-live/screenshots/` | 显示拦截的 API 请求 |
| **成功导出** | `export-success.png` | `fixtures/yuanbao-live/screenshots/` | 显示成功 Toast 或下载提示 |
| **JSON 导出文件** | `yuanbao-export-*.json` | `fixtures/yuanbao-live/exports/` | 实际导出的 JSON 文件（脱敏） |
| **Markdown 导出文件** | `yuanbao-export-*.md` | `fixtures/yuanbao-live/exports/` | 实际导出的 Markdown 文件（脱敏） |
| **API 请求 cURL** | `detail-request.curl`, `list-request.curl` | `fixtures/yuanbao-live/` | 脱敏后的 cURL 命令 |
| **API 响应样本** | `detail-response.json`, `list-response.json` | `fixtures/yuanbao-live/` | 脱敏后的 JSON 响应 |
| **Console 日志片段** | `console-log.txt` | `fixtures/yuanbao-live/logs/` | 关键日志文本 |

#### 可选收集的证据

| 证据类型 | 文件名 | 保存位置 | 说明 |
|----------|--------|----------|------|
| **页面 HTML 快照** | `detail-page.html` | `fixtures/yuanbao-live/html-snapshots/` | 完整页面 HTML |
| **错误场景截图** | `error-*.png` | `fixtures/yuanbao-live/screenshots/` | 如有错误，记录错误状态 |
| **性能日志** | `performance-*.json` | `fixtures/yuanbao-live/logs/` | Performance API 导出数据 |

#### 收集命令

```bash
# 创建导出目录
mkdir -p fixtures/yuanbao-live/exports

# 复制导出文件（脱敏后）
cp ~/Downloads/yuanbao-export-*.json fixtures/yuanbao-live/exports/
cp ~/Downloads/yuanbao-export-*.md fixtures/yuanbao-live/exports/

# 导出 Console 日志
# 在控制台执行：
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  logs: "粘贴关键日志"
}, null, 2));
# 保存为：fixtures/yuanbao-live/logs/console-log.txt
```

---

## 📝 结果记录模板

### 单次测试记录

```markdown
## Yuanbao 真机测试记录

**测试日期**: 2026-03-19  
**版本**: v0.7.0-alpha.1  
**执行者**: @username  
**浏览器**: Chrome 131 + Tampermonkey 5.x  
**操作系统**: macOS 14.x / Windows 11  
**Yuanbao URL**: https://yuanbao.tencent.com

### 测试结果

- [ ] **安装**: 通过 / 失败
- [ ] **加载**: 通过 / 失败
- [ ] **UI 注入**: 通过 / 失败
- [ ] **API 拦截**: 通过 / 失败
- [ ] **JSON 导出**: 通过 / 失败
- [ ] **Markdown 导出**: 通过 / 失败
- [ ] **异常恢复**: 通过 / 失败

### 问题描述

[如有失败，详细描述问题现象]

### 日志摘要

```
[粘贴关键控制台日志]
```

### 附件路径

- 截图：`fixtures/yuanbao-live/screenshots/xxx.png`
- 导出文件：`fixtures/yuanbao-live/exports/xxx.json`
- API 样本：`fixtures/yuanbao-live/detail-response.json`
- 日志：`fixtures/yuanbao-live/logs/console-log.txt`

### 备注

[其他观察或建议]
```

### 汇总报告

```markdown
## Yuanbao 真机实测汇总报告

**测试周期**: 2026-03-19 ~ 2026-03-XX  
**版本**: v0.7.0-alpha.1  
**执行者**: @username1, @username2  
**测试环境**:
- Chrome 131 + Tampermonkey 5.x (macOS 14.x) - 2 人
- Edge 120 + Tampermonkey 5.x (Windows 11) - 1 人

### 结果汇总

| 测试项 | 通过 | 失败 | 通过率 |
|--------|------|------|--------|
| 安装 | 3 | 0 | 100% |
| 加载 | 3 | 0 | 100% |
| UI 注入 | 3 | 0 | 100% |
| API 拦截 | 3 | 0 | 100% |
| JSON 导出 | 3 | 0 | 100% |
| Markdown 导出 | 3 | 0 | 100% |
| 异常恢复 | 2 | 1 | 67% |
| **总计** | **20** | **1** | **95%** |

### 已知问题

1. **[问题标题]**
   - 描述：[详细描述]
   - 复现步骤：[步骤]
   - 影响：[影响范围]
   - 优先级：P0/P1/P2

### 发布建议

- [ ] ✅ 建议发布
- [ ] ⚠️ 需要修复后重新测试
- [ ] ❌ 不建议发布

### 附件

- 完整测试记录：`docs/TEST_RECORDS/YYYY-MM-DD.md`
- 证据包：`fixtures/yuanbao-live/`
```

---

## 🛠️ 辅助脚本

### 验证构建产物

```bash
bun run scripts/verify-build.ts
```

### 验证样本文件

```bash
bun run scripts/validate-yuanbao-samples.ts
```

### 诊断报告

```bash
bun run scripts/diagnose-yuanbao.ts
```

### 检查 Alpha 就绪状态

```bash
bun run scripts/check-alpha-ready.ts
```

### 准备样本包结构

```bash
bun run scripts/prepare-yuanbao-sample-pack.ts
```

---

## ✅ 验收标准

### 必须满足（P0）

- [ ] Userscript 可安装到 Tampermonkey
- [ ] 在 Yuanbao 页面正确加载（控制台有日志）
- [ ] FAB 按钮正确注入（右下角，不遮挡）
- [ ] 点击 FAB 弹出导出面板
- [ ] JSON 导出功能正常（文件可打开，结构正确）
- [ ] API 拦截功能正常（控制台有拦截日志）
- [ ] 无阻塞性错误

### 建议满足（P1）

- [ ] Markdown 导出功能正常
- [ ] 导出文件名符合规范
- [ ] 成功/失败 Toast 提示正常
- [ ] 页面刷新后功能恢复
- [ ] 采集到完整的 API 样本

### 可选满足（P2）

- [ ] ZIP 批量导出功能正常
- [ ] 暗色模式适配良好
- [ ] 跨浏览器验证通过（Chrome + Edge）
- [ ] 性能表现良好（大对话导出 < 10 秒）

---

## 📤 反馈结果

### 提交内容

1. **填写结果记录**（使用上方模板）
2. **上传证据文件**
   ```bash
   # 打包证据（脱敏后）
   cd fixtures/yuanbao-live
   zip -r yuanbao-live-evidence-YYYYMMDD.zip screenshots/ exports/ logs/ *.json *.curl
   ```
3. **提交到 Git**（如适用）
   ```bash
   git add fixtures/yuanbao-live/
   git commit -m "test: 添加 Yuanbao 真机实测证据 (YYYY-MM-DD)"
   git push
   ```
4. **通知维护者**
   - 在 Issue/PR 中评论测试结果
   - 或发送邮件/消息给维护者

### Commit Message 建议

```bash
# Smoke Test 通过
test(yuanbao): Smoke Test 通过 - v0.7.0-alpha.1

- 验证 Userscript 安装和加载
- 验证 FAB 按钮和导出面板
- 验证 JSON 导出功能
- 采集 API 样本（已脱敏）

测试环境：Chrome 131 + Tampermonkey 5.x, macOS 14.x
测试结果：全部通过

证据：fixtures/yuanbao-live/screenshots/, fixtures/yuanbao-live/exports/

# 完整回归测试通过
test(yuanbao): 回归测试通过 - v0.7.0-alpha.1

- 完成 50 项回归测试（安装/加载/UI/导出/异常恢复）
- 通过率：100% (50/50)
- 采集完整 API 样本（detail/list request+response）
- 验证 JSON/Markdown 导出格式
- 验证网络中断恢复和页面刷新恢复

测试环境:
- Chrome 131 + Tampermonkey 5.x, macOS 14.x
- Edge 120 + Tampermonkey 5.x, Windows 11

证据：fixtures/yuanbao-live/

Related: #123

# 发现问题
test(yuanbao): 报告问题 - [问题简述]

测试版本：v0.7.0-alpha.1
问题：[简述问题]
复现步骤：[简要步骤]
影响：[影响范围]

附件：
- 截图：fixtures/yuanbao-live/screenshots/error-xxx.png
- 日志：fixtures/yuanbao-live/logs/error-log.txt

Related: #123
```

---

## 🔗 相关文档

| 文档 | 用途 |
|------|------|
| [`docs/YUANBAO_LIVE_VALIDATION.md`](./YUANBAO_LIVE_VALIDATION.md) | 详细验证标准和失败排查 |
| [`docs/TAMPERMONKEY_TEST_PLAN.md`](./TAMPERMONKEY_TEST_PLAN.md) | 完整测试项目定义 |
| [`fixtures/yuanbao-live/README.md`](../fixtures/yuanbao-live/README.md) | 样本目录说明 |
| [`fixtures/yuanbao-live/CHECKLIST.md`](../fixtures/yuanbao-live/CHECKLIST.md) | 样本采集检查清单 |
| [`docs/RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) | 发布检查清单 |

---

## ❓ 常见问题

### Q: Tampermonkey 不识别脚本？

**A**: 检查以下几点：
1. 确保访问的是 Raw 文件或直接打开本地文件
2. 检查 Tampermonkey 扩展是否已启用
3. 尝试在 Tampermonkey 仪表板手动创建脚本

### Q: 控制台没有日志输出？

**A**: 
1. 检查页面 URL 是否为 `yuanbao.tencent.com`
2. 检查 Userscript 的 `@match` 规则是否匹配
3. 在 Tampermonkey 仪表板确认脚本状态为「启用」
4. 尝试刷新页面

### Q: FAB 按钮看不到？

**A**:
1. 检查是否被页面元素遮挡（尝试滚动页面）
2. 检查浏览器缩放比例（应为 100%）
3. 查看 Console 是否有 UI 注入错误

### Q: 导出文件为空或格式错误？

**A**:
1. 检查 Console 是否有 API 拦截日志
2. 确认 Network 面板中有 detail/list 请求
3. 检查 API 响应结构是否变化（查看 `detail-response.json`）
4. 运行 `bun run scripts/diagnose-yuanbao.ts` 生成诊断报告

### Q: 如何脱敏敏感信息？

**A**: 使用以下命令：
```bash
# 替换 cURL 中的 Cookie 和 Authorization
sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' *.curl
sed -i '' 's/Authorization: [^"]*/Authorization: [REDACTED]/g' *.curl

# 替换 JSON 中的 ID 字段
jq '.conversationId = "[CONVERSATION_ID]" | .userId = "[USER_ID]"' input.json > output.json
```

---

**维护者**: Chat Export Toolkit Team  
**版本**: v0.7.0-alpha.1  
**最后更新**: 2026-03-19
