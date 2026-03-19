# Yuanbao 真机实测执行包 - 工作总结

**创建日期**: 2026-03-19  
**版本**: v0.7.0-alpha.1  
**状态**: ✅ 执行包已就绪

---

## 📦 创建内容

### 1. 主执行文档

**文件**: `docs/YUANBAO_LIVE_EXECUTION_PACK.md` (12.9 KB)

**内容**:
- ✅ 快速开始指南（5 分钟 Smoke Test）
- ✅ 完整执行流程（30 分钟回归测试）
- ✅ 逐步执行说明：安装 → 打开页面 → 检查日志 → 导出 → 保存证据
- ✅ 结果记录模板（通过/失败/附件路径/日志摘要）
- ✅ 必须收集的证据清单（截图、下载文件、console 片段、network 样本）
- ✅ 建议 commit message 示例
- ✅ 常见问题解答

### 2. 辅助脚本

#### 初始化脚本
**文件**: `scripts/init-live-execution-pack.sh` (7.2 KB)

**功能**:
- ✅ 检查环境依赖（Node.js, Bun, Tampermonkey）
- ✅ 安装依赖并构建 Userscript
- ✅ 创建证据收集目录结构
- ✅ 生成测试结果记录模板
- ✅ 自动打开 Userscript 安装页面

**用法**:
```bash
./scripts/init-live-execution-pack.sh
```

#### 证据检查脚本
**文件**: `scripts/check-evidence-collection.ts` (9.0 KB)

**功能**:
- ✅ 检查 13 项证据文件是否存在
- ✅ 验证 cURL 文件敏感信息是否脱敏
- ✅ 验证 JSON 文件结构是否完整
- ✅ 生成收集报告和建议

**用法**:
```bash
bun run scripts/check-evidence-collection.ts
```

### 3. 结果记录模板

**文件**: `fixtures/yuanbao-live/RESULT_TEMPLATE.md` (5.1 KB)

**内容**:
- ✅ 测试基本信息表格
- ✅ 50 项测试结果汇总（通过/失败/未测试）
- ✅ 详细问题描述模板
- ✅ 日志摘要区域
- ✅ 附件清单表格
- ✅ 验证命令执行结果区域
- ✅ 总体评价和发布建议
- ✅ 签名确认区域

### 4. 汇总文档

**文件**: `LIVE_EXECUTION_PACK.md` (5.5 KB)

**内容**:
- ✅ 快速开始（3 步）
- ✅ 目录结构说明
- ✅ 验收标准（P0/P1/P2）
- ✅ 辅助脚本列表
- ✅ 测试类型说明（Smoke Test vs 回归测试）
- ✅ Commit message 建议
- ✅ 常见问题解答

### 5. 文档更新

**更新的文件**:
- ✅ `fixtures/yuanbao-live/README.md` - 添加执行包引用
- ✅ `docs/YUANBAO_LIVE_VALIDATION.md` - 添加执行包主文档链接
- ✅ `docs/TAMPERMONKEY_TEST_PLAN.md` - 更新文档关联表

---

## 📁 完整文件列表

```
chat-export-toolkit/
├── LIVE_EXECUTION_PACK.md                      ← 📦 汇总文档（根目录）
├── docs/
│   ├── YUANBAO_LIVE_EXECUTION_PACK.md          ← 📦 主执行文档（12.9 KB）
│   ├── YUANBAO_EXECUTION_PACK_SUMMARY.md       ← 📝 本文档
│   ├── YUANBAO_LIVE_VALIDATION.md              ← 已更新链接
│   └── TAMPERMONKEY_TEST_PLAN.md               ← 已更新链接
├── fixtures/yuanbao-live/
│   ├── README.md                               ← 已更新链接
│   ├── CHECKLIST.md                            ← 采集检查清单
│   ├── RESULT_TEMPLATE.md                      ← 📝 结果记录模板（5.1 KB）
│   ├── detail-request.sample.curl              ← 示例 cURL
│   ├── list-request.sample.curl                ← 示例 cURL
│   ├── detail-response.sample.json             ← 示例 JSON
│   ├── list-response.sample.json               ← 示例 JSON
│   ├── .sample-info.json                       ← 元数据
│   ├── screenshots/                            ← 截图目录
│   ├── exports/                                ← 导出文件目录
│   ├── logs/                                   ← 日志目录
│   └── html-snapshots/                         ← HTML 快照目录
└── scripts/
    ├── init-live-execution-pack.sh             ← 🚀 初始化脚本（7.2 KB）
    ├── check-evidence-collection.ts            ← ✅ 证据检查脚本（9.0 KB）
    ├── verify-build.ts                         ← 构建验证
    ├── validate-yuanbao-samples.ts             ← 样本验证
    └── diagnose-yuanbao.ts                     ← 诊断报告
```

---

## ✅ 功能验证

### 初始化脚本测试
```bash
$ ./scripts/init-live-execution-pack.sh
========================================
Yuanbao 真机实测执行包初始化
========================================
ℹ️  步骤 1/6: 检查 Node.js...
✅ Node.js 已安装：v25.8.1
ℹ️  步骤 2/6: 检查 Bun...
✅ Bun 已安装：1.x.x
ℹ️  步骤 3/6: 检查 Tampermonkey...
⚠️  请确认浏览器已安装 Tampermonkey 扩展
...
✅ 创建 exports/ 目录
✅ 创建 screenshots/ 目录
✅ 创建 logs/ 目录
✅ 创建 html-snapshots/ 目录
✅ 生成测试结果记录模板
```

### 证据检查脚本测试
```bash
$ bun run scripts/check-evidence-collection.ts
========================================
Yuanbao 真机实测证据收集检查
========================================

📋 检查结果:

❌ 控制台初始化日志截图 (必需)
   文件不存在（必需）
❌ FAB 按钮截图 (必需)
   文件不存在（必需）
...
✅ 详情请求 cURL (必需)
   敏感信息已脱敏或使用占位符
✅ 列表请求 cURL (必需)
   敏感信息已脱敏或使用占位符
...
========================================
汇总
========================================

总检查项：13
通过：6
失败：7
```

---

## 🎯 执行包特点

### 1. 逐步执行流程

文档中提供了清晰的逐步执行流程：

```
安装 userscript
    ↓
打开页面
    ↓
检查日志
    ↓
导出 JSON/Markdown/ZIP
    ↓
保存证据
    ↓
反馈结果
```

### 2. 结果记录模板

提供完整的结果记录模板，包含：
- 测试基本信息
- 50 项测试结果汇总
- 问题描述区域
- 日志摘要
- 附件清单
- 验证命令执行结果
- 总体评价和发布建议

### 3. 执行包初始化脚本

一个命令完成所有准备工作：
```bash
./scripts/init-live-execution-pack.sh
```

### 4. 必须收集的证据

明确列出必须收集的证据：

| 证据类型 | 文件名 | 保存位置 |
|----------|--------|----------|
| 控制台初始化日志 | `console-init.png` | `screenshots/` |
| FAB 按钮 | `fab-button.png` | `screenshots/` |
| 导出面板 | `export-panel.png` | `screenshots/` |
| Network 请求 | `network-requests.png` | `screenshots/` |
| 成功导出 | `export-success.png` | `screenshots/` |
| JSON 导出文件 | `yuanbao-export-*.json` | `exports/` |
| Markdown 导出文件 | `yuanbao-export-*.md` | `exports/` |
| API 请求 cURL | `detail-request.curl` | `../` |
| API 响应样本 | `detail-response.json` | `../` |
| Console 日志 | `console-log.txt` | `logs/` |

### 5. 建议 Commit Message

提供三种场景的 commit message 模板：
- Smoke Test 通过
- 完整回归测试通过
- 发现问题

---

## 🚀 使用指南

### 验证者快速开始

```bash
# 1. 进入仓库
cd /Users/user/.openclaw/workspace/chat-export-toolkit

# 2. 运行初始化脚本
./scripts/init-live-execution-pack.sh

# 3. 按照提示安装 Userscript
open userscripts/chat-export.v2.user.js

# 4. 访问 Yuanbao 并开始测试
open https://yuanbao.tencent.com

# 5. 测试完成后检查证据收集
bun run scripts/check-evidence-collection.ts

# 6. 填写测试结果记录
open fixtures/yuanbao-live/RESULT_TEMPLATE.md
```

### 详细执行流程

参见：[`docs/YUANBAO_LIVE_EXECUTION_PACK.md`](./YUANBAO_LIVE_EXECUTION_PACK.md)

---

## 📊 统计数据

| 项目 | 数量 |
|------|------|
| 新增文档 | 3 个 |
| 新增脚本 | 2 个 |
| 更新文档 | 3 个 |
| 总文档大小 | ~24 KB |
| 总脚本大小 | ~16 KB |
| 检查项数量 | 13 项 |
| 测试项目覆盖 | 50+ 项 |

---

## ⚠️ 注意事项

1. **不要声称已完成实测** - 执行包只是准备工具，实际测试需要人工执行
2. **重点是执行包** - 不是实现新功能，而是整理实测流程
3. **敏感信息脱敏** - 提交前必须检查 cURL 和 JSON 文件中的敏感信息
4. **证据完整性** - 使用检查脚本验证所有必需证据已收集

---

## 🔗 相关文档

| 文档 | 用途 |
|------|------|
| [`docs/YUANBAO_LIVE_EXECUTION_PACK.md`](./YUANBAO_LIVE_EXECUTION_PACK.md) | **主执行文档** - 完整执行流程 |
| [`LIVE_EXECUTION_PACK.md`](../LIVE_EXECUTION_PACK.md) | 汇总文档 - 快速开始 |
| [`docs/YUANBAO_LIVE_VALIDATION.md`](./YUANBAO_LIVE_VALIDATION.md) | 详细验证标准 |
| [`docs/TAMPERMONKEY_TEST_PLAN.md`](./TAMPERMONKEY_TEST_PLAN.md) | 完整测试计划 |
| [`fixtures/yuanbao-live/RESULT_TEMPLATE.md`](../fixtures/yuanbao-live/RESULT_TEMPLATE.md) | 结果记录模板 |

---

**维护者**: Chat Export Toolkit Team  
**版本**: v0.7.0-alpha.1  
**最后更新**: 2026-03-19
