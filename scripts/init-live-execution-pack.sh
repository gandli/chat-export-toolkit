#!/usr/bin/env bash
#
# init-live-execution-pack.sh
#
# 初始化 Yuanbao 真机实测执行包环境
#
# 用法:
#   ./scripts/init-live-execution-pack.sh
#
# 功能:
#   1. 检查环境依赖（Node.js, Bun, Tampermonkey）
#   2. 安装依赖并构建 Userscript
#   3. 创建证据收集目录结构
#   4. 生成测试结果记录模板
#   5. 打开 Userscript 安装页面

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
FIXTURES_DIR="$ROOT_DIR/fixtures/yuanbao-live"
EXPORTS_DIR="$FIXTURES_DIR/exports"
SCREENSHOTS_DIR="$FIXTURES_DIR/screenshots"
LOGS_DIR="$FIXTURES_DIR/logs"
HTML_SNAPSHOTS_DIR="$FIXTURES_DIR/html-snapshots"
USERSRIPT_PATH="$ROOT_DIR/userscripts/chat-export.v2.user.js"
EXECUTION_PACK_DOC="$ROOT_DIR/docs/YUANBAO_LIVE_EXECUTION_PACK.md"

# 打印函数
print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "ℹ️  $1"
}

# 检查命令是否存在
check_command() {
  if command -v "$1" &> /dev/null; then
    return 0
  else
    return 1
  fi
}

# 主函数
main() {
  print_header "Yuanbao 真机实测执行包初始化"
  echo ""

  # 1. 检查 Node.js
  print_info "步骤 1/6: 检查 Node.js..."
  if check_command node; then
    NODE_VERSION=$(node -v)
    print_success "Node.js 已安装：$NODE_VERSION"
  else
    print_error "Node.js 未安装"
    print_info "请使用 fnm 安装：https://github.com/Schniz/fnm"
    exit 1
  fi
  echo ""

  # 2. 检查 Bun
  print_info "步骤 2/6: 检查 Bun..."
  if check_command bun; then
    BUN_VERSION=$(bun -v)
    print_success "Bun 已安装：$BUN_VERSION"
  else
    print_error "Bun 未安装"
    print_info "请安装 Bun：https://bun.sh"
    exit 1
  fi
  echo ""

  # 3. 检查 Tampermonkey（通过提示用户确认）
  print_info "步骤 3/6: 检查 Tampermonkey..."
  print_warning "请确认浏览器已安装 Tampermonkey 扩展"
  echo "   - Chrome: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo"
  echo "   - Edge: https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd"
  read -p "   已安装 Tampermonkey? (y/n): " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "请先安装 Tampermonkey 扩展，然后重新运行此脚本"
    exit 0
  fi
  print_success "Tampermonkey 确认已安装"
  echo ""

  # 4. 安装依赖并构建
  print_info "步骤 4/6: 安装依赖并构建 Userscript..."
  cd "$ROOT_DIR"
  
  if [ -d "node_modules" ]; then
    print_info "依赖已存在，跳过安装"
  else
    print_info "正在安装依赖..."
    bun install
  fi

  print_info "正在构建 Userscript..."
  bun run build

  if [ -f "$USERSRIPT_PATH" ]; then
    FILE_SIZE=$(wc -c < "$USERSRIPT_PATH")
    print_success "Userscript 构建成功：$USERSRIPT_PATH ($FILE_SIZE bytes)"
  else
    print_error "Userscript 构建失败"
    exit 1
  fi
  echo ""

  # 5. 创建目录结构
  print_info "步骤 5/6: 创建证据收集目录..."
  
  mkdir -p "$EXPORTS_DIR"
  mkdir -p "$SCREENSHOTS_DIR"
  mkdir -p "$LOGS_DIR"
  mkdir -p "$HTML_SNAPSHOTS_DIR"
  
  print_success "创建 exports/ 目录"
  print_success "创建 screenshots/ 目录"
  print_success "创建 logs/ 目录"
  print_success "创建 html-snapshots/ 目录"
  echo ""

  # 6. 生成测试结果记录模板
  print_info "步骤 6/6: 生成测试结果记录模板..."
  
  TEMPLATE_FILE="$FIXTURES_DIR/test-result-template.md"
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
  DATE_TODAY=$(date +"%Y-%m-%d")
  
  cat > "$TEMPLATE_FILE" << EOF
# Yuanbao 真机测试结果

**测试日期**: $DATE_TODAY  
**版本**: v0.7.0-alpha.1  
**执行者**: @________  
**浏览器**: Chrome/Edge ___ + Tampermonkey 5.x  
**操作系统**: macOS/Windows/Linux ___  

---

## 测试结果

### 安装与加载

- [ ] **Userscript 安装**: 通过 / 失败
- [ ] **脚本加载**: 通过 / 失败
- [ ] **控制台日志**: 通过 / 失败
- [ ] **FAB 按钮注入**: 通过 / 失败

### 导出功能

- [ ] **JSON 导出**: 通过 / 失败
- [ ] **Markdown 导出**: 通过 / 失败
- [ ] **ZIP 导出**: 通过 / 失败 / 未测试
- [ ] **文件名格式**: 正确 / 错误

### API 拦截

- [ ] **Detail 请求拦截**: 通过 / 失败
- [ ] **List 请求拦截**: 通过 / 失败
- [ ] **缓存功能**: 通过 / 失败

### 异常恢复

- [ ] **网络中断恢复**: 通过 / 失败 / 未测试
- [ ] **页面刷新恢复**: 通过 / 失败
- [ ] **路由切换**: 通过 / 失败

---

## 问题描述

[如有失败，请详细描述问题现象]

```
[可粘贴错误信息或日志]
```

---

## 日志摘要

\`\`\`
[粘贴关键控制台日志]
\`\`\`

---

## 附件清单

### 截图证据

- [ ] \`screenshots/console-init.png\` - 控制台初始化日志
- [ ] \`screenshots/fab-button.png\` - FAB 按钮
- [ ] \`screenshots/export-panel.png\` - 导出面板
- [ ] \`screenshots/network-requests.png\` - Network 请求
- [ ] \`screenshots/export-success.png\` - 导出成功提示

### 导出文件

- [ ] \`exports/yuanbao-export-*.json\` - JSON 导出文件
- [ ] \`exports/yuanbao-export-*.md\` - Markdown 导出文件

### API 样本

- [ ] \`detail-request.curl\` - 详情请求 cURL（已脱敏）
- [ ] \`detail-response.json\` - 详情响应（已脱敏）
- [ ] \`list-request.curl\` - 列表请求 cURL（已脱敏）
- [ ] \`list-response.json\` - 列表响应（已脱敏）

### 日志文件

- [ ] \`logs/console-log.txt\` - 控制台日志文本

---

## 备注

[其他观察或建议]

---

**记录时间**: $TIMESTAMP
EOF

  print_success "生成测试结果记录模板：$TEMPLATE_FILE"
  echo ""

  # 完成
  print_header "初始化完成！"
  echo ""
  print_success "执行包已准备就绪"
  echo ""
  
  print_info "下一步操作:"
  echo ""
  echo "  1. 打开 Userscript 安装页面:"
  echo "     $ open $USERSRIPT_PATH"
  echo ""
  echo "  2. 在 Tampermonkey 中安装脚本"
  echo ""
  echo "  3. 访问 https://yuanbao.tencent.com 并登录"
  echo ""
  echo "  4. 打开开发者工具（F12），检查控制台日志"
  echo ""
  echo "  5. 点击 FAB 按钮，测试导出功能"
  echo ""
  echo "  6. 按照文档收集证据:"
  echo "     $ open $EXECUTION_PACK_DOC"
  echo ""
  echo "  7. 填写测试结果记录:"
  echo "     $ open $TEMPLATE_FILE"
  echo ""
  
  print_info "详细执行指南：$EXECUTION_PACK_DOC"
  echo ""
  
  # 自动打开 Userscript（可选）
  read -p "是否现在打开 Userscript 安装页面？(y/n): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "$USERSRIPT_PATH"
    print_success "已打开 Userscript"
  fi
  
  echo ""
  print_success "祝测试顺利！"
}

# 运行主函数
main
