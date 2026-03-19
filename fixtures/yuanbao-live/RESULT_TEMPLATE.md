# Yuanbao 真机测试结果记录

> **说明**: 复制此模板填写你的测试结果，完成后保存到 `fixtures/yuanbao-live/results/TEST-YYYYMMDD-username.md`

---

## 测试基本信息

| 项目 | 值 |
|------|-----|
| **测试日期** | 2026-03-__ |
| **测试版本** | v0.7.0-alpha.1 |
| **执行者** | @________ |
| **浏览器** | Chrome ___ / Edge ___ + Tampermonkey 5.x |
| **操作系统** | macOS ___ / Windows ___ / Linux ___ |
| **Yuanbao URL** | https://yuanbao.tencent.com |
| **测试类型** | □ Smoke Test (5 分钟)  □ 完整回归测试 (30 分钟) |

---

## 测试结果汇总

### ✅ 通过 / ❌ 失败 / ⚠️ 部分通过 / ○ 未测试

| 类别 | 测试项 | 结果 | 备注 |
|------|--------|------|------|
| **安装** | Userscript 安装 | ○ | |
| | Tampermonkey 识别 | ○ | |
| | 仪表板显示 | ○ | |
| **加载** | 控制台版本横幅 | ○ | |
| | 平台检测日志 | ○ | |
| | 无 JavaScript 错误 | ○ | |
| **UI 注入** | FAB 按钮存在 | ○ | |
| | FAB 位置正确 | ○ | |
| | 导出面板弹出 | ○ | |
| **API 拦截** | Detail 请求拦截 | ○ | |
| | List 请求拦截 | ○ | |
| | 缓存功能正常 | ○ | |
| **导出功能** | JSON 导出 | ○ | |
| | Markdown 导出 | ○ | |
| | ZIP 导出 | ○ | |
| | 文件名格式正确 | ○ | |
| **异常恢复** | 网络中断恢复 | ○ | |
| | 页面刷新恢复 | ○ | |
| | 路由切换 | ○ | |

**总计**: __ 通过 / __ 失败 / __ 未测试

---

## 详细问题描述

### 问题 1: [问题标题]

**严重程度**: □ 阻塞性  □ 严重  □ 一般  □ 轻微

**现象描述**:
[详细描述问题现象]

**复现步骤**:
1. [步骤 1]
2. [步骤 2]
3. [步骤 3]

**预期行为**:
[描述预期应该发生什么]

**实际行为**:
[描述实际发生了什么]

**日志/错误信息**:
```
[粘贴相关日志或错误信息]
```

**截图证据**:
- `screenshots/error-xxx.png`

**可能原因**:
[如有分析，填写可能原因]

---

### 问题 2: [问题标题]

[同上格式]

---

## 日志摘要

### 控制台初始化日志

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

### 关键日志片段

```
[粘贴其他关键日志]
```

---

## 附件清单

### 截图证据

| 文件名 | 路径 | 说明 | 是否提供 |
|--------|------|------|----------|
| `console-init.png` | `screenshots/` | 控制台初始化日志 | □ |
| `fab-button.png` | `screenshots/` | FAB 按钮 | □ |
| `export-panel.png` | `screenshots/` | 导出面板 | □ |
| `network-requests.png` | `screenshots/` | Network 请求 | □ |
| `export-success.png` | `screenshots/` | 导出成功提示 | □ |
| `error-xxx.png` | `screenshots/` | 错误截图（如有） | □ |

### 导出文件

| 文件名 | 路径 | 格式 | 是否提供 |
|--------|------|------|----------|
| `yuanbao-export-*.json` | `exports/` | JSON | □ |
| `yuanbao-export-*.md` | `exports/` | Markdown | □ |
| `yuanbao-export-*.zip` | `exports/` | ZIP | □ |

### API 样本

| 文件名 | 路径 | 是否脱敏 | 是否提供 |
|--------|------|----------|----------|
| `detail-request.curl` | `../` | □ 已脱敏 | □ |
| `detail-response.json` | `../` | □ 已脱敏 | □ |
| `list-request.curl` | `../` | □ 已脱敏 | □ |
| `list-response.json` | `../` | □ 已脱敏 | □ |

### 日志文件

| 文件名 | 路径 | 说明 | 是否提供 |
|--------|------|------|----------|
| `console-log.txt` | `logs/` | 控制台日志 | □ |
| `network-log.txt` | `logs/` | Network 日志 | □ |

---

## 验证命令执行结果

```bash
# 验证 JSON 格式
jq '.' exports/yuanbao-export-*.json | head -30
# [粘贴输出]

# 验证必需字段
jq -e '.id and .title and .messages' exports/yuanbao-export-*.json > /dev/null && echo "✅ 结构正确"
# [粘贴输出]

# 验证样本文件
bun run scripts/validate-yuanbao-samples.ts
# [粘贴输出]
```

---

## 总体评价

**测试结论**: □ 通过  □ 有条件通过  □ 不通过

**发布建议**: 
- □ ✅ 建议发布
- □ ⚠️ 需要修复以下问题后重新测试
- □ ❌ 不建议发布

**主要优点**:
- [优点 1]
- [优点 2]

**需要改进**:
- [改进点 1]
- [改进点 2]

**其他建议**:
[填写其他建议或观察]

---

## 签名确认

**执行者签名**: ________________  
**确认日期**: 2026-03-__  

**审查者签名**: ________________（如适用）  
**审查日期**: 2026-03-__  

---

**模板版本**: v1.0  
**最后更新**: 2026-03-19
