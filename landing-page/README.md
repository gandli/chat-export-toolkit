# Landing Page

Chat Export Toolkit 项目落地页。

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

- **Hero** - 主标题、副标题、CTA 按钮、版本标识
- **功能亮点** - 6 个核心功能卡片
- **产品形态** - Tampermonkey 脚本（当前主力）与浏览器扩展（开发中）
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

## 部署

### GitHub Pages（推荐 - 自动部署）

本项目已配置 GitHub Actions 自动部署工作流。

**自动部署：**
- 推送到 `feat/landing-page` 分支的 `landing-page/` 目录变更会自动触发部署
- 也可手动触发：GitHub Actions → "Deploy Landing Page to GitHub Pages" → Run workflow

**首次设置步骤：**
1. 进入仓库 Settings → Pages
2. 在 "Source" 下选择 "GitHub Actions"（而非传统的 branch 选项）
3. 等待首次工作流运行完成
4. 部署后页面地址：`https://gandli.github.io/chat-export-toolkit/`

**手动部署（可选）：**
```bash
# 使用 gh-pages 分支（传统方式）
git checkout --orphan gh-pages
git reset --hard
cp landing-page/* .
git add .
git commit -m "Deploy landing page to GitHub Pages"
git push origin gh-pages --force
```

### Vercel

1. 登录 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库
3. 设置 Root Directory 为 `landing-page`
4. 点击 Deploy

或使用配置文件 `vercel.json`（已提供）。

### Netlify

1. 登录 [Netlify](https://netlify.com)
2. 拖放 `landing-page/` 目录到 Netlify Drop
3. 或连接 GitHub 仓库并设置发布目录为 `landing-page`

### 自定义域名
部署后在平台设置中配置自定义域名。

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 主页面 |
| `favicon.svg` | 网站图标（SVG 格式） |
| `robots.txt` | 搜索引擎爬虫配置 |
| `vercel.json` | Vercel 部署配置 |
| `README.md` | 本文件 |

## 待办事项

- [ ] 添加项目截图/演示 GIF
- [ ] 添加 Google Analytics（可选，需注意隐私）
- [ ] 优化 Lighthouse 分数
- [ ] 添加 PWA 支持（可选）
- [ ] 添加更多平台实际验证后的状态更新

## 许可证

MIT License（与主项目一致）
