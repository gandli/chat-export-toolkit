# Landing Page

Chat Export Toolkit 项目落地页（MVP）。

## 快速开始

### 方式一：直接打开
直接在浏览器中打开 `index.html` 文件即可查看。

### 方式二：本地预览（推荐）
使用 Bun 启动本地开发服务器：

```bash
# 安装 serve 工具（如果尚未安装）
bun install -g serve

# 启动本地服务器
serve .
```

然后在浏览器访问 `http://localhost:3000`。

### 方式三：使用 Python
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

然后在浏览器访问 `http://localhost:8000`。

## 技术栈

- **HTML5** - 语义化结构
- **Tailwind CSS (CDN)** - 样式框架，通过 CDN 加载，无需构建
- **原生 JavaScript** - 无额外依赖

## 设计原则

1. **简洁** - 独立开发者风格，不过度营销
2. **可信** - 强调开源、本地处理、隐私优先
3. **响应式** - 支持桌面和移动设备
4. **轻量** - 单文件 HTML，无构建步骤
5. **SEO 基础** - 包含 meta description、Open Graph 标签

## 页面结构

- **Hero** - 主标题、副标题、CTA 按钮
- **功能亮点** - 6 个核心功能卡片
- **产品形态** - Tampermonkey 脚本 vs 浏览器扩展对比
- **支持平台** - 各平台支持状态表格
- **信任区块** - 为什么值得信任（开源、本地处理、透明）
- **CTA** - 开始使用引导
- **Footer** - 版权信息、链接

## 自定义

### 修改颜色
编辑 `index.html` 中的 CSS 变量：

```css
:root {
  --primary: #01B259;      /* 主色调（翡翠绿） */
  --primary-dark: #01964a; /* 主色深色变体 */
  --secondary: #0ea5e9;    /* 辅助色（天蓝） */
}
```

### 修改内容
直接编辑 `index.html` 中的文本内容。

### 部署

#### GitHub Pages
1. 将 `landing-page/` 目录内容推送到 `gh-pages` 分支
2. 在仓库设置中启用 GitHub Pages

#### Vercel / Netlify
将整个仓库或 `landing-page/` 目录拖放到 Vercel/Netlify 即可自动部署。

#### 自定义域名
部署后在平台设置中配置自定义域名。

## 待办事项

- [ ] 添加 favicon
- [ ] 添加项目截图/演示 GIF
- [ ] 添加 Google Analytics（可选）
- [ ] 添加多语言支持（如需）
- [ ] 优化 Lighthouse 分数
- [ ] 添加 PWA 支持（可选）

## 许可证

MIT License（与主项目一致）
