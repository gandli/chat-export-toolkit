# 📦 Yuanbao 真机实测执行包

> **快速开始**: 按照 [`docs/YUANBAO_LIVE_EXECUTION_PACK.md`](./docs/YUANBAO_LIVE_EXECUTION_PACK.md) 执行完整测试流程

---

## 🎯 目标

本执行包用于指导人工验证者在**腾讯元宝真实页面**上验证 Chat Export Toolkit V2 的功能，确保：

1. ✅ Userscript 可正确安装到 Tampermonkey
2. ✅ 在真实页面上正确加载和拦截 API
3. ✅ 导出功能正常工作（JSON/Markdown）
4. ✅ 收集完整的测试证据（截图、日志、API 样本）
5. ✅ 记录测试结果并反馈

---

## 🚀 快速开始（3 步）

### 步骤 1: 初始化环境

```bash
cd /Users/user/.openclaw/workspace/chat-export-toolkit

# 运行初始化脚本
./scripts/init-live-execution-pack.sh
```

**脚本会自动**:
- ✅ 检查 Node.js 和 Bun
- ✅ 确认 Tampermonkey 已安装
- ✅ 安装依赖并构建 Userscript
- ✅ 创建证据收集目录
- ✅ 生成测试结果模板

### 步骤 2: 安装 Userscript

```bash
# 打开 Userscript
open userscripts/chat-export.v2.user.js

# → Tampermonkey 会弹出安装确认 → 点击「安装」
```

### 步骤 3: 开始测试

1. 访问 https://yuanbao.tencent.com
2. 打开开发者工具（F12）
3. 检查控制台日志
4. 点击 FAB 按钮测试导出
5. 收集证据（截图、导出文件、API 样本）

**详细流程**: [`docs/YUANBAO_LIVE_EXECUTION_PACK.md`](./docs/YUANBAO_LIVE_EXECUTION_PACK.md)

---

## 📁 目录结构

```
chat-export-toolkit/
├── docs/
│   ├── YUANBAO_LIVE_EXECUTION_PACK.md  ← 📦 主执行文档
│   ├── YUANBAO_LIVE_VALIDATION.md      ← 详细验证标准
│   └── TAMPERMONKEY_TEST_PLAN.md       ← 完整测试计划
├── fixtures/yuanbao-live/
│   ├── README.md                       ← 样本目录说明
│   ├── CHECKLIST.md                    ← 采集检查清单
│   ├── RESULT_TEMPLATE.md              ← 结果记录模板
│   ├── screenshots/                    ← 截图证据
│   ├── exports/                        ← 导出文件
│   ├── logs/                           ← 日志文件
│   └── *.json, *.curl                  ← API 样本
├── scripts/
│   ├── init-live-execution-pack.sh     ← 🚀 初始化脚本
│   ├── check-evidence-collection.ts    ← ✅ 证据检查脚本
│   ├── verify-build.ts                 ← 构建验证
│   └── validate-yuanbao-samples.ts     ← 样本验证
└── userscripts/
    └── chat-export.v2.user.js          ← 📜 Userscript
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

---

## 🛠️ 辅助脚本

| 脚本 | 用途 | 命令 |
|------|------|------|
| `init-live-execution-pack.sh` | 初始化执行包环境 | `./scripts/init-live-execution-pack.sh` |
| `check-evidence-collection.ts` | 检查证据收集完整性 | `bun run scripts/check-evidence-collection.ts` |
| `verify-build.ts` | 验证构建产物 | `bun run scripts/verify-build.ts` |
| `validate-yuanbao-samples.ts` | 验证 API 样本 | `bun run scripts/validate-yuanbao-samples.ts` |
| `diagnose-yuanbao.ts` | 生成诊断报告 | `bun run scripts/diagnose-yuanbao.ts` |

---

## 📋 测试类型

### Smoke Test（5 分钟）

快速验证基本功能，每次构建后执行：

1. 安装 Userscript
2. 打开 Yuanbao 页面
3. 检查控制台日志
4. 测试 JSON 导出
5. 验证导出文件

**详细清单**: [`docs/YUANBAO_LIVE_EXECUTION_PACK.md#-快速开始 5 分钟-smoke-test`](./docs/YUANBAO_LIVE_EXECUTION_PACK.md)

### 完整回归测试（30 分钟）

发布前完整验证，覆盖所有关键路径：

1. 安装与更新验证
2. 脚本加载验证
3. 页面注入验证
4. UI 交互验证
5. 下载功能验证
6. API 拦截验证
7. 异常恢复验证
8. 证据收集

**详细清单**: [`docs/TAMPERMONKEY_TEST_PLAN.md#回归测试清单`](./docs/TAMPERMONKEY_TEST_PLAN.md)

---

## 📝 结果记录

### 使用模板

复制并填写 [`fixtures/yuanbao-live/RESULT_TEMPLATE.md`](./fixtures/yuanbao-live/RESULT_TEMPLATE.md)

### 保存位置

```
fixtures/yuanbao-live/results/TEST-YYYYMMDD-username.md
```

### 提交内容

1. 填写完整的测试结果记录
2. 证据文件（截图、导出文件、API 样本）
3. Commit message（参考下方建议）

---

## 💡 Commit Message 建议

### Smoke Test 通过

```bash
test(yuanbao): Smoke Test 通过 - v0.7.0-alpha.1

- 验证 Userscript 安装和加载
- 验证 FAB 按钮和导出面板
- 验证 JSON 导出功能
- 采集 API 样本（已脱敏）

测试环境：Chrome 131 + Tampermonkey 5.x, macOS 14.x
测试结果：全部通过

证据：fixtures/yuanbao-live/screenshots/, fixtures/yuanbao-live/exports/
```

### 完整回归测试通过

```bash
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
```

### 发现问题

```bash
test(yuanbao): 报告问题 - [问题简述]

测试版本：v0.7.0-alpha.1
问题：[简述问题]
复现步骤：[简要步骤]
影响：[影响范围]

附件:
- 截图：fixtures/yuanbao-live/screenshots/error-xxx.png
- 日志：fixtures/yuanbao-live/logs/error-log.txt

Related: #123
```

---

## 🔗 相关文档

| 文档 | 用途 |
|------|------|
| [`docs/YUANBAO_LIVE_EXECUTION_PACK.md`](./docs/YUANBAO_LIVE_EXECUTION_PACK.md) | **主执行文档** - 完整执行流程 |
| [`docs/YUANBAO_LIVE_VALIDATION.md`](./docs/YUANBAO_LIVE_VALIDATION.md) | 详细验证标准和失败排查 |
| [`docs/TAMPERMONKEY_TEST_PLAN.md`](./docs/TAMPERMONKEY_TEST_PLAN.md) | 完整测试项目定义 |
| [`fixtures/yuanbao-live/README.md`](./fixtures/yuanbao-live/README.md) | 样本目录说明 |
| [`fixtures/yuanbao-live/CHECKLIST.md`](./fixtures/yuanbao-live/CHECKLIST.md) | 样本采集检查清单 |
| [`fixtures/yuanbao-live/RESULT_TEMPLATE.md`](./fixtures/yuanbao-live/RESULT_TEMPLATE.md) | 结果记录模板 |

---

## ❓ 常见问题

### Q: 如何快速开始？

**A**: 运行初始化脚本：
```bash
./scripts/init-live-execution-pack.sh
```

### Q: 如何检查证据是否收集完整？

**A**: 运行证据检查脚本：
```bash
bun run scripts/check-evidence-collection.ts
```

### Q: Tampermonkey 不识别脚本？

**A**: 
1. 确保访问的是 Raw 文件或直接打开本地文件
2. 检查 Tampermonkey 扩展是否已启用
3. 尝试在 Tampermonkey 仪表板手动创建脚本

### Q: 如何脱敏敏感信息？

**A**: 
```bash
# 替换 cURL 中的 Cookie 和 Authorization
sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' *.curl
sed -i '' 's/Authorization: [^"]*/Authorization: [REDACTED]/g' *.curl

# 替换 JSON 中的 ID 字段
jq '.conversationId = "[CONVERSATION_ID]"' input.json > output.json
```

---

**维护者**: Chat Export Toolkit Team  
**版本**: v0.7.0-alpha.1  
**最后更新**: 2026-03-19
