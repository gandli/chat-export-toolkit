# Yuanbao 真实页面验证准备工作 - 完成总结

## 概述

本次工作为腾讯元宝 (Yuanbao) 真实页面验证做好了全面准备，包括文档、脚本和示例文件。

## 新增文件清单

### 1. 核心文档

#### `docs/YUANBAO_LIVE_VALIDATION.md` (10.7 KB)

完整的 Yuanbao 真实页面验证指南，包含：

- ✅ 前置准备和环境要求
- ✅ 三种安装方式 (Tampermonkey/控制台/本地服务器)
- ✅ 打开页面后的检查项 (日志、UI、Network)
- ✅ Network 样本采集步骤
- ✅ 拦截成功判断标准
- ✅ 导出成功判定标准 (JSON/Markdown)
- ✅ 失败时信息收集方法
- ✅ 只能人工验证的项目清单

### 2. 辅助脚本

#### `scripts/capture-yuanbao-samples.ts` (5.3 KB)

样本采集辅助脚本，功能：

- 提供控制台采集代码
- 自动生成 fixtures/yuanbao-live/README.md
- 指导用户手动采集 cURL 命令
- 输出详细的采集步骤

**使用方法**:
```bash
bun run scripts/capture-yuanbao-samples.ts
```

#### `scripts/validate-export.ts` (8.0 KB)

导出文件验证脚本，功能：

- 验证 JSON 导出文件结构
- 验证 Markdown 导出文件格式
- 检查必需字段
- 敏感性检查
- 详细的错误和警告信息

**使用方法**:
```bash
bun run scripts/validate-export.ts --file ./output/test-export.json
bun run scripts/validate-export.ts --file ./output/test-export.md
```

#### `scripts/diagnose-yuanbao.ts` (7.1 KB)

诊断报告生成脚本，功能：

- 收集环境信息 (Node.js/Bun/OS)
- 检查构建产物完整性
- 检查文档和源代码
- 生成诊断报告 JSON
- 提供修复建议

**使用方法**:
```bash
bun run scripts/diagnose-yuanbao.ts
```

#### `scripts/validate-yuanbao-samples.ts` (7.3 KB)

样本文件验证脚本，功能：

- 验证 JSON 样本文件格式
- 验证 cURL 样本文件格式
- 敏感性检查 (Cookie/Token)
- 必需文件检查
- 跳过示例文件 (.sample.*)

**使用方法**:
```bash
bun run scripts/validate-yuanbao-samples.ts
```

#### `scripts/yuanbao-checklist.ts` (5.7 KB)

快速检查清单脚本，功能：

- 环境检查 (Node.js/Bun)
- 构建检查 (userscript/测试页/fixtures)
- 文档检查
- 脚本检查
- 提供下一步建议

**使用方法**:
```bash
bun run scripts/yuanbao-checklist.ts
```

### 3. 示例文件

#### `fixtures/yuanbao-live/` 目录

| 文件 | 说明 |
|------|------|
| `README.md` | 样本目录说明文档 |
| `detail-response.sample.json` | 详情响应示例 (展示格式) |
| `list-response.sample.json` | 列表响应示例 (展示格式) |
| `detail-request.sample.curl` | 详情请求 cURL 示例 |
| `list-request.sample.curl` | 列表请求 cURL 示例 |

**注意**: 示例文件仅供格式参考，需要替换为真实采集的数据。

### 4. 更新的文件

#### `test-integration.html`

新增 Yuanbao 真实页面验证入口说明框，包含：

- 验证指南链接
- 样本采集命令
- 导出验证命令
- 诊断报告命令

#### `fixtures/README.md`

新增 `yuanbao-live/` 目录说明，包含：

- 采集方法
- 文件结构
- 注意事项 (脱敏/隐私)

## 验证结果

运行快速检查清单：

```bash
$ bun run scripts/yuanbao-checklist.ts

╔════════════════════════════════════════════════════════╗
║     Yuanbao 验证检查清单                              ║
╚════════════════════════════════════════════════════════╝

🖥️  环境检查
✅ Node.js 已安装
✅ Bun 已安装

📦 构建检查
✅ Userscript 已生成
✅ 测试页存在
✅ Fixtures 目录完整

📚 文档检查
✅ Yuanbao 验证指南
✅ E2E 验证指南
✅ 适配器开发指南

🔗 真实页面验证
✅ 样本采集脚本
✅ 导出验证脚本
✅ 诊断脚本
✅ 样本验证脚本

═══════════════════════════════════════════════════════

📊 检查结果：12 通过，0 失败

✅ 所有检查通过！环境已就绪。
```

## 使用流程

### 场景 1: 本地测试 (无需登录)

```bash
# 1. 启动测试服务器
bun run scripts/serve-test.ts

# 2. 访问测试页
open http://localhost:3000/test-integration.html

# 3. 按页面提示测试初始化和导出
```

### 场景 2: 真实页面验证 (需要登录)

```bash
# 1. 访问 Yuanbao 页面
open https://yuanbao.tencent.com

# 2. 运行采集脚本获取说明
bun run scripts/capture-yuanbao-samples.ts

# 3. 按提示执行控制台代码采集样本

# 4. 验证样本
bun run scripts/validate-yuanbao-samples.ts

# 5. 验证导出文件
bun run scripts/validate-export.ts --file ./your-export.json
```

### 场景 3: 问题诊断

```bash
# 运行诊断脚本
bun run scripts/diagnose-yuanbao.ts

# 查看诊断报告
cat output/diagnosis-report.json
```

## 只能人工验证的项目

以下项目无法自动化，必须人工在真实站点测试：

1. **登录态验证** - 需要真实账号
2. **真实对话数据** - 长对话、图片、代码块、think 块
3. **实时交互** - 发送消息后立即导出、流式输出
4. **批量导出** - 多个对话、ZIP 打包
5. **UI 交互体验** - FAB 位置、响应速度、暗色模式
6. **跨浏览器兼容性** - Chrome/Edge/Safari/Firefox
7. **性能测试** - 大对话导出时间、内存占用

详见 `docs/YUANBAO_LIVE_VALIDATION.md` 第 8 节。

## 建议 Commit Message

```
docs: 添加 Yuanbao 真实页面验证准备文档和脚本

新增文档:
- docs/YUANBAO_LIVE_VALIDATION.md - 完整验证指南

新增脚本:
- scripts/capture-yuanbao-samples.ts - 样本采集辅助
- scripts/validate-export.ts - 导出文件验证
- scripts/diagnose-yuanbao.ts - 诊断报告生成
- scripts/validate-yuanbao-samples.ts - 样本验证
- scripts/yuanbao-checklist.ts - 快速检查清单

新增示例:
- fixtures/yuanbao-live/README.md - 样本目录说明
- fixtures/yuanbao-live/*.sample.* - 格式示例文件

更新:
- test-integration.html - 添加 Yuanbao 验证入口说明
- fixtures/README.md - 添加 yuanbao-live 目录说明

核心内容:
- 安装步骤 (Tampermonkey/控制台/本地服务器)
- Network 样本采集方法
- 拦截成功判断标准
- 导出成功判定标准 (JSON/Markdown)
- 失败时信息收集方法
- 只能人工验证的项目清单

验证: bun run scripts/yuanbao-checklist.ts (12/12 通过)
```

## 后续工作建议

### 高优先级

1. **采集真实样本** - 访问 Yuanbao 页面运行采集脚本
2. **验证导出功能** - 在真实页面测试导出 JSON/Markdown
3. **补充边界样本** - 长对话、图片、特殊字符等

### 中优先级

4. **更新示例文件** - 用真实样本替换 .sample.* 文件
5. **添加自动化测试** - 基于真实样本的单元测试
6. **完善错误处理** - 根据真实场景优化错误提示

### 低优先级

7. **性能优化** - 大对话导出性能测试和优化
8. **多浏览器测试** - Chrome/Edge/Safari/Firefox 兼容性
9. **文档翻译** - 英文版本 (如需国际化)

## 文件统计

| 类型 | 数量 | 总大小 |
|------|------|--------|
| 文档 | 1 (主文档) + 1 (README) | ~14 KB |
| 脚本 | 5 | ~30 KB |
| 示例 | 5 | ~3 KB |
| 更新 | 2 | - |
| **总计** | **13** | **~47 KB** |

---

**完成时间**: 2024-03-19  
**执行者**: Subagent (cet-round5-yuanbao-live-validation)  
**状态**: ✅ 完成
