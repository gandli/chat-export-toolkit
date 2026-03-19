# Tampermonkey Userscript 测试计划

**项目**: Chat Export Toolkit  
**产品形态**: Tampermonkey Userscript (`userscripts/chat-export.v2.user.js`)  
**版本**: v0.7.0-alpha.1  
**创建日期**: 2026-03-19

---

## 概述

本文档定义 **作为 Tampermonkey Userscript 必须在浏览器中验证的测试项目**，明确区分本地自动化测试与浏览器手动验证的职责边界，提供最小 Smoke Test 清单和回归测试清单。

### 核心原则

1. **本地测试证明代码逻辑正确** — 类型、构建、单元逻辑、数据格式
2. **浏览器验证证明集成正确** — Userscript 加载、GM_* API、页面注入、真实交互
3. **不伪造自动化** — 明确标注哪些必须人工执行，哪些未来可自动化

---

## 为什么必须在浏览器里测？

Tampermonkey Userscript 的以下特性**无法**在 Node.js 环境中模拟：

| 特性 | 为什么必须浏览器 | 本地替代方案 |
|------|-----------------|-------------|
| `GM_*` API | Tampermonkey 专有 API，Node.js 无实现 | 完全无法模拟 |
| 页面注入 | 需要真实 DOM 和页面上下文 | jsdom 不完整 |
| 真实 API 拦截 | 需要真实网络请求和响应 | 可用 mock，但无法验证端点匹配 |
| 浏览器渲染 | CSS、布局、遮挡、暗色模式 | 无法完全模拟 |
| 下载行为 | `GM_download` 触发浏览器下载 | 无法模拟 |
| 跨域请求 | 浏览器 CORS + Tampermonkey 代理 | 无法模拟 |
| 扩展交互 | Tampermonkey 扩展与脚本通信 | 无法模拟 |

---

## 测试覆盖范围

### 1. 安装与更新

**测试目标**: 验证 Userscript 可正确安装到 Tampermonkey 并更新

| ID | 测试项 | 执行方式 | 自动化潜力 |
|----|--------|----------|-----------|
| INS-01 | Tampermonkey 扩展已安装 | 人工 | 低（需浏览器扩展检测） |
| INS-02 | 访问 Raw 链接时 Tampermonkey 识别脚本 | 人工 | 中（可用 Puppeteer） |
| INS-03 | 安装对话框正确显示脚本元数据 | 人工 | 中（可用 Puppeteer） |
| INS-04 | 安装后脚本出现在 Tampermonkey 仪表板 | 人工 | 中（可用 Puppeteer） |
| INS-05 | 更新可用时 Tampermonkey 提示更新 | 人工 | 低（需版本服务器） |
| INS-06 | 更新后版本号正确 | 人工 | 中（可用 Puppeteer） |
| INS-07 | 禁用/启用脚本功能正常 | 人工 | 中（可用 Puppeteer） |
| INS-08 | 卸载脚本后页面不再注入 | 人工 | 中（可用 Puppeteer） |

**Smoke Test 覆盖**: INS-02, INS-03, INS-04

---

### 2. 脚本加载

**测试目标**: 验证 Userscript 在目标页面正确加载和执行

| ID | 测试项 | 执行方式 | 自动化潜力 |
|----|--------|----------|-----------|
| LOAD-01 | 访问匹配 URL 时脚本自动执行 | 人工 | 高（可用 Puppeteer+Tampermonkey） |
| LOAD-02 | 控制台显示初始化日志 | 人工 | 高（可用 Puppeteer 捕获 console） |
| LOAD-03 | 控制台无 JavaScript 错误 | 人工 | 高（可用 Puppeteer 捕获 error） |
| LOAD-04 | `@match` 模式正确匹配目标站点 | 人工 | 高（可用 Puppeteer 测试多 URL） |
| LOAD-05 | `@match` 模式不匹配非目标站点 | 人工 | 高（可用 Puppeteer 测试多 URL） |
| LOAD-06 | 脚本在页面 DOMContentLoaded 后执行 | 人工 | 高（可用 Puppeteer 检测时机） |
| LOAD-07 | 脚本在 iframe 中不执行（如配置） | 人工 | 中（需特殊配置） |
| LOAD-08 | 多标签页同时加载无冲突 | 人工 | 中（需多标签控制） |

**Smoke Test 覆盖**: LOAD-01, LOAD-02, LOAD-03

---

### 3. 页面注入

**测试目标**: 验证 UI 组件正确注入到页面 DOM

| ID | 测试项 | 执行方式 | 自动化潜力 |
|----|--------|----------|-----------|
| INJ-01 | FAB 按钮元素存在于 DOM | 人工 | 高（可用 Puppeteer querySelector） |
| INJ-02 | FAB 按钮位置正确（右下角） | 人工 | 高（可用 Puppeteer getBoundingClientRect） |
| INJ-03 | FAB 按钮不被页面元素遮挡 | 人工 | 中（需检测 z-index 和覆盖） |
| INJ-04 | 导出面板注入到正确位置 | 人工 | 高（可用 Puppeteer querySelector） |
| INJ-05 | Toast 通知注入到正确位置 | 人工 | 高（可用 Puppeteer querySelector） |
| INJ-06 | 注入元素继承页面字体/样式 | 人工 | 中（需计算样式对比） |
| INJ-07 | 暗色模式下注入元素可见 | 人工 | 高（可用 Puppeteer 检测颜色） |
| INJ-08 | 页面缩放后注入元素位置正确 | 人工 | 中（需模拟缩放） |
| INJ-09 | 页面滚动后注入元素位置正确 | 人工 | 高（可用 Puppeteer scroll+检测） |
| INJ-10 | 注入元素不影响页面原有功能 | 人工 | 低（需全面功能测试） |

**Smoke Test 覆盖**: INJ-01, INJ-02, INJ-03

---

### 4. UI 交互

**测试目标**: 验证 UI 组件交互功能正常

| ID | 测试项 | 执行方式 | 自动化潜力 |
|----|--------|----------|-----------|
| UI-01 | 点击 FAB 按钮弹出导出面板 | 人工 | 高（可用 Puppeteer click+检测） |
| UI-02 | 点击面板外关闭面板 | 人工 | 高（可用 Puppeteer click+检测） |
| UI-03 | 格式选择器选项完整 | 人工 | 高（可用 Puppeteer querySelectorAll） |
| UI-04 | 范围选择器选项完整 | 人工 | 高（可用 Puppeteer querySelectorAll） |
| UI-05 | 导出按钮可点击 | 人工 | 高（可用 Puppeteer 检测 disabled 状态） |
| UI-06 | 导出中显示加载状态 | 人工 | 高（可用 Puppeteer 检测 loading 类） |
| UI-07 | 导出完成显示成功 Toast | 人工 | 高（可用 Puppeteer 检测 Toast 元素） |
| UI-08 | 导出失败显示错误 Toast | 人工 | 高（可用 Puppeteer 检测 Toast 元素） |
| UI-09 | Toast 自动消失 | 人工 | 高（可用 Puppeteer waitForSelector） |
| UI-10 | 面板内选项选择后状态保持 | 人工 | 高（可用 Puppeteer 检测 selected 状态） |
| UI-11 | 键盘操作（Tab/Enter/Esc） | 人工 | 中（需键盘事件模拟） |
| UI-12 | 移动端触摸交互（如支持） | 人工 | 中（需移动设备模拟） |

**Smoke Test 覆盖**: UI-01, UI-05, UI-07

---

### 5. 下载功能

**测试目标**: 验证导出文件正确下载

| ID | 测试项 | 执行方式 | 自动化潜力 |
|----|--------|----------|-----------|
| DL-01 | 点击导出触发浏览器下载 | 人工 | 中（需配置下载目录检测） |
| DL-02 | 下载文件名符合预期格式 | 人工 | 中（需检测下载文件） |
| DL-03 | JSON 格式文件内容有效 | 人工 | 高（可用 Puppeteer+fs 检测） |
| DL-04 | Markdown 格式文件内容有效 | 人工 | 高（可用 Puppeteer+fs 检测） |
| DL-05 | ZIP 格式文件可解压 | 人工 | 高（可用 Puppeteer+解压检测） |
| DL-06 | 大文件下载不超时 | 人工 | 中（需大对话测试） |
| DL-07 | 批量下载多个文件 | 人工 | 中（需多文件检测） |
| DL-08 | 下载中断后可恢复 | 人工 | 低（需模拟网络中断） |
| DL-09 | 下载权限请求正确处理 | 人工 | 低（需首次安装测试） |

**Smoke Test 覆盖**: DL-01, DL-02, DL-03

---

### 6. 日志与调试

**测试目标**: 验证日志输出正确，便于问题诊断

| ID | 测试项 | 执行方式 | 自动化潜力 |
|----|--------|----------|-----------|
| LOG-01 | 控制台显示版本横幅 | 人工 | 高（可用 Puppeteer 捕获 console） |
| LOG-02 | 控制台显示平台检测结果 | 人工 | 高（可用 Puppeteer 捕获 console） |
| LOG-03 | 控制台显示拦截器安装日志 | 人工 | 高（可用 Puppeteer 捕获 console） |
| LOG-04 | 控制台显示 UI 初始化日志 | 人工 | 高（可用 Puppeteer 捕获 console） |
| LOG-05 | 控制台显示导出开始/完成日志 | 人工 | 高（可用 Puppeteer 捕获 console） |
| LOG-06 | 错误日志包含堆栈信息 | 人工 | 高（可用 Puppeteer 捕获 error） |
| LOG-07 | 日志级别可配置（如实现） | 人工 | 中（需配置检测） |
| LOG-08 | 生产环境日志精简 | 人工 | 高（可用 Puppeteer 对比日志量） |

**Smoke Test 覆盖**: LOG-01, LOG-02, LOG-03

---

### 7. 异常恢复

**测试目标**: 验证脚本在异常情况下表现合理

| ID | 测试项 | 执行方式 | 自动化潜力 |
|----|--------|----------|-----------|
| ERR-01 | 网络中断时显示友好错误 | 人工 | 中（需模拟网络中断） |
| ERR-02 | API 返回错误时不崩溃 | 人工 | 中（需 mock 错误响应） |
| ERR-03 | 无效数据时显示错误提示 | 人工 | 中（需注入异常数据） |
| ERR-04 | 页面跳转后脚本重新初始化 | 人工 | 高（可用 Puppeteer 导航检测） |
| ERR-05 | 单页应用路由切换后功能正常 | 人工 | 高（可用 Puppeteer 导航检测） |
| ERR-06 | Tampermonkey 禁用后页面无残留 | 人工 | 中（需手动禁用检测） |
| ERR-07 | 浏览器重启后脚本正常加载 | 人工 | 中（需重启浏览器） |
| ERR-08 | 本地存储损坏时重置 | 人工 | 低（需手动损坏存储） |
| ERR-09 | 并发导出请求正确处理 | 人工 | 中（需快速多次点击） |

**Smoke Test 覆盖**: ERR-01, ERR-04

---

### 8. 跨浏览器差异

**测试目标**: 验证脚本在不同浏览器中表现一致

| ID | 测试项 | 执行方式 | 自动化潜力 |
|----|--------|----------|-----------|
| BRW-01 | Chrome + Tampermonkey 功能正常 | 人工 | 高（可用 Puppeteer-Chrome） |
| BRW-02 | Edge + Tampermonkey 功能正常 | 人工 | 高（可用 Puppeteer-Edge） |
| BRW-03 | Firefox + Tampermonkey 功能正常 | 人工 | 中（需 Firefox Driver） |
| BRW-04 | Safari + Tampermonkey 功能正常 | 人工 | 低（Safari 自动化困难） |
| BRW-05 | 各浏览器 UI 渲染一致 | 人工 | 中（需截图对比） |
| BRW-06 | 各浏览器下载行为一致 | 人工 | 中（需检测下载） |
| BRW-07 | 各浏览器 `GM_*` API 行为一致 | 人工 | 中（需日志对比） |
| BRW-08 | 各浏览器性能表现一致 | 人工 | 中（需性能检测） |

**Smoke Test 覆盖**: BRW-01（主浏览器）

---

### 9. 数据与状态

**测试目标**: 验证数据存储和状态管理正确

| ID | 测试项 | 执行方式 | 自动化潜力 |
|----|--------|----------|-----------|
| DATA-01 | `GM_setValue`/`GM_getValue` 正常工作 | 人工 | 中（需验证存储读写） |
| DATA-02 | 导出历史记录正确保存 | 人工 | 中（需检测存储） |
| DATA-03 | 用户偏好设置持久化 | 人工 | 中（需重启验证） |
| DATA-04 | 缓存数据正确更新 | 人工 | 中（需检测缓存失效） |
| DATA-05 | 多对话状态不混淆 | 人工 | 中（需多对话测试） |
| DATA-06 | 清除缓存后重新获取 | 人工 | 中（需清除验证） |

**Smoke Test 覆盖**: DATA-01

---

## 最小 Smoke Test 清单

**用途**: 每次构建后快速验证基本功能，耗时 < 5 分钟

```markdown
## Smoke Test Checklist (5 分钟)

### 环境准备
- [ ] Tampermonkey 扩展已安装
- [ ] 目标平台页面可访问（如 yuanbao.tencent.com）

### 安装验证
- [ ] INS-02: 访问 Raw 链接时 Tampermonkey 识别脚本
- [ ] INS-03: 安装对话框显示正确元数据
- [ ] INS-04: 安装后脚本出现在 Tampermonkey 仪表板

### 加载验证
- [ ] LOAD-01: 访问目标页面时脚本自动执行
- [ ] LOAD-02: 控制台显示初始化日志（含版本号）
- [ ] LOAD-03: 控制台无 JavaScript 错误

### UI 验证
- [ ] INJ-01: FAB 按钮出现在页面右下角
- [ ] INJ-02: FAB 按钮不被遮挡
- [ ] UI-01: 点击 FAB 弹出导出面板

### 导出验证
- [ ] UI-05: 导出按钮可点击
- [ ] DL-01: 点击导出触发下载
- [ ] DL-02: 下载文件名正确
- [ ] DL-03: JSON 文件可打开且格式正确

### 日志验证
- [ ] LOG-01: 控制台显示版本横幅
- [ ] LOG-02: 控制台显示平台检测结果

### 异常验证
- [ ] ERR-01: 网络中断时显示友好错误（可选）
- [ ] ERR-04: 页面刷新后脚本重新初始化
```

**执行频率**: 每次 `bun run build` 后  
**执行者**: 开发者  
**预计耗时**: 3-5 分钟

---

## 回归测试清单

**用途**: 发布前完整验证，覆盖所有关键路径，耗时 < 30 分钟

```markdown
## 回归测试 Checklist (30 分钟)

### 安装与更新
- [ ] INS-02: 访问 Raw 链接时 Tampermonkey 识别脚本
- [ ] INS-03: 安装对话框显示正确元数据
- [ ] INS-04: 安装后脚本出现在 Tampermonkey 仪表板
- [ ] INS-07: 禁用/启用脚本功能正常
- [ ] INS-08: 卸载脚本后页面不再注入

### 脚本加载
- [ ] LOAD-01: 访问匹配 URL 时脚本自动执行
- [ ] LOAD-02: 控制台显示初始化日志
- [ ] LOAD-03: 控制台无 JavaScript 错误
- [ ] LOAD-04: `@match` 模式正确匹配目标站点
- [ ] LOAD-05: `@match` 模式不匹配非目标站点
- [ ] LOAD-08: 多标签页同时加载无冲突

### 页面注入
- [ ] INJ-01: FAB 按钮元素存在于 DOM
- [ ] INJ-02: FAB 按钮位置正确（右下角）
- [ ] INJ-03: FAB 按钮不被页面元素遮挡
- [ ] INJ-04: 导出面板注入到正确位置
- [ ] INJ-07: 暗色模式下注入元素可见
- [ ] INJ-09: 页面滚动后注入元素位置正确

### UI 交互
- [ ] UI-01: 点击 FAB 按钮弹出导出面板
- [ ] UI-02: 点击面板外关闭面板
- [ ] UI-03: 格式选择器选项完整
- [ ] UI-04: 范围选择器选项完整
- [ ] UI-05: 导出按钮可点击
- [ ] UI-06: 导出中显示加载状态
- [ ] UI-07: 导出完成显示成功 Toast
- [ ] UI-08: 导出失败显示错误 Toast
- [ ] UI-09: Toast 自动消失
- [ ] UI-10: 面板内选项选择后状态保持

### 下载功能
- [ ] DL-01: 点击导出触发浏览器下载
- [ ] DL-02: 下载文件名符合预期格式
- [ ] DL-03: JSON 格式文件内容有效
- [ ] DL-04: Markdown 格式文件内容有效
- [ ] DL-05: ZIP 格式文件可解压（如实现）
- [ ] DL-06: 大文件下载不超时（>50 条消息）

### 日志与调试
- [ ] LOG-01: 控制台显示版本横幅
- [ ] LOG-02: 控制台显示平台检测结果
- [ ] LOG-03: 控制台显示拦截器安装日志
- [ ] LOG-05: 控制台显示导出开始/完成日志
- [ ] LOG-06: 错误日志包含堆栈信息

### 异常恢复
- [ ] ERR-01: 网络中断时显示友好错误
- [ ] ERR-02: API 返回错误时不崩溃
- [ ] ERR-03: 无效数据时显示错误提示
- [ ] ERR-04: 页面跳转后脚本重新初始化
- [ ] ERR-05: 单页应用路由切换后功能正常
- [ ] ERR-09: 并发导出请求正确处理

### 数据与状态
- [ ] DATA-01: `GM_setValue`/`GM_getValue` 正常工作
- [ ] DATA-03: 用户偏好设置持久化（重启验证）
- [ ] DATA-05: 多对话状态不混淆

### 跨浏览器（如多浏览器支持）
- [ ] BRW-01: Chrome + Tampermonkey 功能正常
- [ ] BRW-02: Edge + Tampermonkey 功能正常
- [ ] BRW-05: 各浏览器 UI 渲染一致
```

**执行频率**: 每个 Release 前  
**执行者**: 开发者或 QA  
**预计耗时**: 20-30 分钟

---

## 自动化路线图

### 当前状态（v0.7.0-alpha.1）

| 测试类型 | 自动化程度 | 说明 |
|----------|-----------|------|
| 本地单元测试 | ✅ 100% | `bun test` |
| 本地集成测试 | ✅ 100% | `bun test` |
| 本地 Golden 测试 | ✅ 100% | `bun test` |
| Smoke Test | ❌ 0% | 纯人工 |
| 回归测试 | ❌ 0% | 纯人工 |
| 跨浏览器测试 | ❌ 0% | 纯人工 |

### 短期目标（v0.8.0）

| 测试类型 | 目标自动化程度 | 技术方案 |
|----------|---------------|----------|
| Smoke Test | 🔶 50% | Puppeteer + Tampermonkey 扩展 |
| 基础 UI 检测 | 🔶 50% | Puppeteer querySelector + 截图 |
| 控制台日志验证 | 🔶 70% | Puppeteer console 捕获 |
| 构建产物验证 | ✅ 100% | 现有脚本增强 |

### 中期目标（v1.0.0）

| 测试类型 | 目标自动化程度 | 技术方案 |
|----------|---------------|----------|
| Smoke Test | ✅ 90% | 完整 Puppeteer 流程 |
| 回归测试 | 🔶 60% | 关键路径自动化 |
| 跨浏览器测试 | 🔶 50% | GitHub Actions + 多浏览器 |
| 视觉回归 | 🔶 50% | Percy/Chromatic 截图对比 |

### 长期目标（v2.0.0）

| 测试类型 | 目标自动化程度 | 技术方案 |
|----------|---------------|----------|
| 回归测试 | ✅ 90% | 完整自动化套件 |
| 跨浏览器测试 | ✅ 80% | 云测平台（BrowserStack） |
| 性能测试 | 🔶 70% | Lighthouse CI |
| 可访问性测试 | 🔶 70% | axe-core 集成 |

---

## 人工执行 vs 自动化

### 适合人工执行的项目

以下项目**建议长期保持人工执行**，自动化成本高或收益低：

| 项目 | 原因 |
|------|------|
| INS-05: 更新提示验证 | 需要版本服务器配合，场景复杂 |
| INJ-06: 样式继承检测 | 主观判断成分高 |
| INJ-10: 不影响页面功能 | 需要全面功能测试，范围太大 |
| UI-11: 键盘操作 | 需特殊设备模拟，低频场景 |
| UI-12: 移动端触摸 | 需真实设备，自动化成本高 |
| ERR-08: 存储损坏恢复 | 需手动损坏存储，风险高 |
| BRW-04: Safari 测试 | Safari 自动化支持差 |
| DATA-04: 缓存更新验证 | 场景复杂，人工更可靠 |

### 适合自动化的项目

以下项目**优先实现自动化**，收益高且技术可行：

| 项目 | 技术方案 | 优先级 |
|------|----------|--------|
| LOAD-01~05: 脚本加载 | Puppeteer + console 捕获 | P0 |
| INJ-01,02,04: 元素存在性 | Puppeteer querySelector | P0 |
| UI-01,02,05: 基础交互 | Puppeteer click + 检测 | P0 |
| DL-01,02: 下载触发 | Puppeteer + 下载目录检测 | P1 |
| LOG-01~06: 日志验证 | Puppeteer console 事件 | P1 |
| ERR-04,05: 路由切换 | Puppeteer navigation | P1 |
| BRW-01,02: Chrome/Edge | GitHub Actions 多浏览器 | P2 |

---

## 测试执行记录模板

### Smoke Test 记录

```markdown
## Smoke Test 记录

**日期**: 2026-03-19  
**版本**: v0.7.0-alpha.1  
**执行者**: @username  
**浏览器**: Chrome 131 + Tampermonkey 5.x  
**目标平台**: yuanbao.tencent.com

### 结果
- [x] 安装验证通过
- [x] 加载验证通过
- [x] UI 验证通过
- [x] 导出验证通过
- [x] 日志验证通过

### 问题
[如有问题，详细描述]

### 备注
[其他观察]
```

### 回归测试记录

```markdown
## 回归测试记录

**日期**: 2026-03-19  
**版本**: v0.7.0-alpha.1  
**执行者**: @username  
**浏览器**: Chrome 131 + Tampermonkey 5.x  
**目标平台**: yuanbao.tencent.com, chat.deepseek.com

### 结果汇总
| 类别 | 通过 | 失败 | 跳过 |
|------|------|------|------|
| 安装与更新 | 5 | 0 | 0 |
| 脚本加载 | 6 | 0 | 0 |
| 页面注入 | 6 | 0 | 0 |
| UI 交互 | 10 | 0 | 0 |
| 下载功能 | 6 | 0 | 0 |
| 日志与调试 | 5 | 0 | 0 |
| 异常恢复 | 6 | 0 | 0 |
| 数据与状态 | 3 | 0 | 0 |
| 跨浏览器 | 3 | 0 | 0 |
| **总计** | **50** | **0** | **0** |

### 失败详情
[如有失败，详细描述]

### 发布建议
- [ ] 建议发布
- [ ] 需要修复后重新测试
- [ ] 需要额外验证
```

---

## 与现有测试体系的集成

### 测试流程

```
开发阶段
    ↓
1. 本地自动测试
   ├── bun run typecheck
   ├── bun run build
   ├── bun test
   └── scripts/verify-build.ts
    ↓
2. Smoke Test（浏览器）
   ├── 安装验证
   ├── 加载验证
   ├── UI 验证
   └── 导出验证
    ↓
3. 回归测试（发布前）
   ├── 完整功能验证
   ├── 异常场景验证
   └── 跨浏览器验证（如需要）
    ↓
4. 真实样本验证
   ├── 采集真实 API 响应
   ├── 验证边缘情况
   └── 性能基线测试
    ↓
5. 发布
   └── docs/RELEASE_CHECKLIST.md
```

### 命令集成

```bash
# 完整验证流程
bun install && \
bun run typecheck && \
bun run build && \
bun run scripts/verify-build.ts && \
bun test && \
echo "=== 本地测试完成，请执行 Smoke Test ==="

# 仅构建 + Smoke Test 准备
bun run build && \
echo "=== 构建完成，请执行 Smoke Test ===" && \
open userscripts/chat-export.v2.user.js
```

### 文档关联

| 文档 | 用途 | 关联测试 |
|------|------|----------|
| `YUANBAO_LIVE_EXECUTION_PACK.md` | **真机实测执行包（主文档）** | 完整执行流程 |
| `TAMPERMONKEY_TEST_PLAN.md` | 浏览器测试计划（本文档） | Smoke Test, 回归测试 |
| `TESTING_STRATEGY.md` | 整体测试策略 | 本地测试 |
| `REAL_WORLD_VALIDATION.md` | 真实环境验证计划 | 真实样本验证 |
| `RELEASE_CHECKLIST.md` | 发布检查清单 | 发布前验证 |
| `YUANBAO_LIVE_VALIDATION.md` | Yuanbao 实测指南 | 平台专项验证 |
| `SAMPLE_CAPTURE_GUIDE.md` | 样本采集指南 | 真实样本采集 |

---

## 建议 Commit Message

```
docs: 添加 Tampermonkey Userscript 浏览器测试计划

- 新增 docs/TAMPERMONKEY_TEST_PLAN.md
  - 定义必须在浏览器中验证的测试项目
  - 覆盖安装/更新、脚本加载、页面注入、UI、下载、日志、异常恢复、跨浏览器
  - 提供最小 Smoke Test 清单（5 分钟）
  - 提供完整回归测试清单（30 分钟）
  - 明确人工执行 vs 自动化边界
  - 给出自动化路线图（v0.8.0 → v2.0.0）
  - 提供测试执行记录模板

- 更新 docs/TESTING_STRATEGY.md
  - 引用新的测试计划文档
  - 明确本地测试与浏览器验证的职责边界

- 更新 docs/REAL_WORLD_VALIDATION.md
  - 引用 Smoke Test 和回归测试清单
  - 整合真实样本验证流程

测试计划特点:
- 不伪造自动化：明确标注当前纯人工执行的项目
- 可执行：Smoke Test 可在 5 分钟内完成
- 可扩展：预留自动化演进路径
- 可追溯：提供测试记录模板

Related: #123
```

---

## 附录

### A. Tampermonkey API 参考

| API | 用途 | 测试注意点 |
|-----|------|-----------|
| `GM_registerMenuCommand` | 注册菜单命令 | 菜单是否正确显示 |
| `GM_setValue` / `GM_getValue` | 持久化存储 | 数据是否正确保存和读取 |
| `GM_download` | 触发下载 | 下载是否触发，文件名是否正确 |
| `GM_xmlhttpRequest` | 跨域请求 | 请求是否成功，响应是否正确 |
| `GM_notification` | 系统通知 | 通知是否显示（如使用） |

### B. Puppeteer 测试示例（未来实现）

```typescript
// tests/browser/smoke.test.ts (未来实现)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';

describe('Tampermonkey Smoke Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-extensions-except=/path/to/tampermonkey',
        '--load-extension=/path/to/tampermonkey',
      ],
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  it('应该正确加载脚本', async () => {
    page = await browser.newPage();
    
    // 捕获控制台消息
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    // 访问目标页面
    await page.goto('https://yuanbao.tencent.com', { waitUntil: 'networkidle0' });

    // 验证控制台显示版本横幅
    expect(consoleMessages.some(m => m.includes('Chat Export Toolkit'))).toBe(true);

    // 验证 FAB 按钮存在
    const fabButton = await page.$('#chat-export-fab');
    expect(fabButton).toBeDefined();
  });
});
```

### C. GitHub Actions 配置示例（未来实现）

```yaml
# .github/workflows/browser-tests.yml (未来实现)
name: Browser Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - run: bun run scripts/verify-build.ts
      
      # 未来：运行 Puppeteer 浏览器测试
      # - uses: browser-actions/setup-chrome@v1
      # - run: bun test:browser:smoke
      #   env:
      #     TEST_URL: https://yuanbao.tencent.com

  # 人工验证提醒
  manual-validation:
    runs-on: ubuntu-latest
    steps:
      - name: 提醒人工验证
        run: |
          echo "::notice::请执行 Smoke Test 并更新 docs/SMOKE_TEST_RESULTS.md"
```

### D. 相关文件清单

| 文件 | 用途 |
|------|------|
| `docs/TAMPERMONKEY_TEST_PLAN.md` | 浏览器测试计划（本文档） |
| `docs/TESTING_STRATEGY.md` | 整体测试策略 |
| `docs/REAL_WORLD_VALIDATION.md` | 真实环境验证计划 |
| `docs/RELEASE_CHECKLIST.md` | 发布检查清单 |
| `docs/YUANBAO_LIVE_VALIDATION.md` | Yuanbao 实测指南 |
| `docs/SAMPLE_CAPTURE_GUIDE.md` | 样本采集指南 |
| `docs/ALPHA_STATUS.md` | Alpha 状态说明 |

---

**维护者**: Chat Export Toolkit Team  
**版本**: v0.7.0-alpha.1  
**状态**: 新建  
**下次审查**: v0.8.0 发布前
