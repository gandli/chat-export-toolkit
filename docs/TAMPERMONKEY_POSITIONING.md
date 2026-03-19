# Tampermonkey Userscript 定位说明

**项目**: chat-export-toolkit  
**产品形态**: Tampermonkey Userscript  
**产物路径**: `userscripts/chat-export.v2.user.js`

---

## 为什么是 Tampermonkey？

本项目选择 Tampermonkey Userscript 作为当前产品形态，基于以下考虑：

### 技术优势

1. **零发布成本** — 无需通过浏览器扩展商店审核，用户可直接安装
2. **快速迭代** — 修改后重新构建，用户刷新即可更新
3. **轻量级** — 单个 JS 文件，无额外权限声明
4. **跨浏览器** — Tampermonkey 支持 Chrome、Firefox、Edge、Safari

### 开发效率

1. **无需构建扩展壳层** — 专注核心逻辑，不处理 Manifest、背景脚本等扩展基础设施
2. **调试友好** — 浏览器开发者工具直接调试，支持热重载
3. **环境简单** — 仅需 Tampermonkey 扩展，无需额外开发环境

### 用户体验

1. **安装简单** — 点击 Raw 链接 → Tampermonkey 自动识别 → 确认安装
2. **按需使用** — 仅在目标网站激活，不影响其他浏览体验
3. **易于卸载** — Tampermonkey 面板中一键禁用/删除

---

## 与浏览器扩展的区别

| 维度 | Tampermonkey Userscript | 浏览器扩展 (MV3) |
|------|------------------------|-----------------|
| **发布渠道** | 直接安装（GitHub Raw 链接） | 需通过商店审核 |
| **更新方式** | 用户手动更新或 Tampermonkey 自动检查 | 商店自动推送 |
| **权限模型** | Tampermonkey 统一权限 | 需声明具体权限 |
| **开发复杂度** | 低（单文件） | 高（Manifest + 多脚本） |
| **审核周期** | 无 | 数小时至数天 |
| **跨浏览器** | 是（Tampermonkey 支持） | 需分别打包/适配 |

**当前决策**: 本项目聚焦核心功能验证和快速迭代，选择 Tampermonkey Userscript 作为产品形态。未来如需要更深入的浏览器集成（如后台持久化、系统级通知），可考虑扩展形态。

---

## 产物说明

### 构建产物

```bash
bun run build
# 输出：userscripts/chat-export.v2.user.js
```

### Userscript 元数据

构建产物包含标准 Userscript 元数据块：

```javascript
// ==UserScript==
// @name         Chat Export Toolkit
// @namespace    https://github.com/your-repo/chat-export-toolkit
// @version      0.7.0-alpha.1
// @description  多站点 AI 对话导出工具包
// @author       Your Name
// @match        https://yuanbao.tencent.com/*
// @match        https://chatgpt.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @license      MIT
// ==/UserScript==
```

### 安装方式

1. 确保浏览器已安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 访问 [`userscripts/chat-export.v2.user.js`](../userscripts/chat-export.v2.user.js) 的 Raw 页面
3. Tampermonkey 自动识别并弹出安装对话框
4. 点击"安装"确认

### 更新方式

- **手动** — 重复上述安装步骤，Tampermonkey 会提示更新
- **自动** — Tampermonkey 定期检查更新（需在扩展设置中启用）

---

## 开发流程

### 本地开发

```bash
# 安装依赖
bun install

# 开发模式（监听构建）
bun run dev

# 生产构建
bun run build
```

### 测试验证

1. **本地测试**（可自动化）
   ```bash
   bun test          # 运行所有本地测试
   bun test:unit     # 单元测试
   bun test:watch    # 监视模式
   ```

2. **浏览器验证**（必须手动）
   - 在 Tampermonkey 中安装最新构建的脚本
   - 访问目标平台页面
   - 按 [TAMPERMONKEY_TEST_PLAN.md](TAMPERMONKEY_TEST_PLAN.md) 执行 Smoke Test 或回归测试
   - 按 [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) 逐项验证

详见 [TESTING_STRATEGY.md](TESTING_STRATEGY.md) 和 [TAMPERMONKEY_TEST_PLAN.md](TAMPERMONKEY_TEST_PLAN.md)。

---

## 未来演进

如项目发展需要，可考虑以下演进方向：

### 短期（保持 Userscript）

- 完善现有平台适配器（ChatGPT、Kimi、豆包等）
- 实现批量导出（ZIP 打包）
- 增加更多导出格式

### 中期（可选扩展壳层）

- 保持核心逻辑不变，添加浏览器扩展壳层
- 通过扩展提供额外能力（后台持久化、系统通知等）
- Userscript 和扩展并行维护

### 长期（独立应用）

- 如需要跨平台桌面应用，可考虑 Electron/Tauri
- 核心逻辑复用，仅适配层变更

---

## 总结

**chat-export-toolkit** 当前是 **Tampermonkey Userscript** 项目，产物为 `userscripts/chat-export.v2.user.js`。

这一选择基于快速迭代、低发布成本、跨浏览器兼容的考虑。核心架构设计保持可扩展，未来如需演进为浏览器扩展或独立应用，可复用现有适配器层和导出逻辑。
