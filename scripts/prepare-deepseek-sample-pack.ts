#!/usr/bin/env bun
/**
 * prepare-deepseek-sample-pack.ts
 * 
 * 生成 DeepSeek 样本包目录结构和元数据模板
 * 
 * 用法:
 *   bun run scripts/prepare-deepseek-sample-pack.ts
 * 
 * 功能:
 *   1. 创建标准目录结构
 *   2. 生成 .sample-info.json 模板
 *   3. 生成 README.md（如不存在）
 *   4. 生成采集检查清单
 *   5. 生成脱敏辅助脚本
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

// 基础路径
const BASE_PATH = join(process.cwd(), 'fixtures', 'deepseek');
const RAW_PATH = join(BASE_PATH, 'raw');
const NORMALIZED_PATH = join(BASE_PATH, 'normalized');
const DOCS_PATH = join(process.cwd(), 'docs');

// 目录结构
const DIRECTORIES = [
  'screenshots',
  'logs',
];

// 生成 .sample-info.json 模板
function generateSampleInfo() {
  const template = {
    platform: 'deepseek',
    capturedAt: new Date().toISOString(),
    capturedBy: process.env.USER || 'unknown',
    environment: {
      browser: 'Chrome/Edge (请填写版本号)',
      os: 'macOS/Windows/Linux (请填写版本)',
      userAgent: 'Mozilla/5.0 ... (请填写完整 User-Agent)',
    },
    apiVersion: 'v1 (待验证)',
    endpoints: {
      detail: '/api/chat/detail (推测，待验证)',
      list: '/api/chat/list (推测，待验证)',
    },
    sanitized: false,
    validated: false,
    notes: '请填写样本特点，如：包含 think 块、代码块、数学公式等',
    checklist: {
      detailResponse: false,
      listResponse: false,
      pageHtml: false,
      screenshots: false,
      sanitized: false,
      validated: false,
    },
    samples: {
      required: {
        detail: 'detail-sample-001.json',
        list: 'list-sample-001.json',
        page: 'page-sample-001.html',
      },
      recommended: {
        edge: 'edge-sample-001.json',
        think: 'think-sample-001.json',
        code: 'code-sample-001.json',
      },
    },
  };

  const filePath = join(BASE_PATH, '.sample-info.json');
  writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf-8');
  console.log(`✅ 生成 .sample-info.json 模板`);
  return filePath;
}

// 生成 README.md 模板（如不存在）
function generateReadme() {
  const filePath = join(BASE_PATH, 'README.md');
  
  if (existsSync(filePath)) {
    console.log(`ℹ️  README.md 已存在，跳过生成`);
    return filePath;
  }

  const template = `# DeepSeek 真实页面样本

此目录包含从 DeepSeek 真实页面采集的 API 请求和响应样本。

> **样本包规范**: 参见 [\\\`docs/DEEPSEEK_SAMPLE_PACK.md\\\`](../docs/DEEPSEEK_SAMPLE_PACK.md)

## 快速开始

### 采集样本

\\\`\\\`\\\`bash
# 1. 访问 https://chat.deepseek.com 并登录
# 2. 打开开发者工具 (F12)
# 3. 运行采集脚本
bun run scripts/prepare-deepseek-sample-pack.ts
# 4. 按 CHECKLIST.md 指引采集样本
\\\`\\\`\\\`

### 验证样本

\\\`\\\`\\\`bash
# 验证样本文件完整性
bash scripts/validate-deepseek-samples.sh (待创建)

# 生成样本包结构
bun run scripts/prepare-deepseek-sample-pack.ts
\\\`\\\`\\\`

## 文件说明

| 文件 | 说明 | 必需 | 状态 |
|------|------|------|------|
| \\\`raw/detail-sample-001.json\\\` | 对话详情 API 响应样本 | ✅ | ${existsSync(join(RAW_PATH, 'detail-sample-001.json')) ? '✅' : '❌'} |
| \\\`raw/list-sample-001.json\\\` | 对话列表 API 响应样本 | ✅ | ${existsSync(join(RAW_PATH, 'list-sample-001.json')) ? '✅' : '❌'} |
| \\\`raw/page-sample-001.html\\\` | 对话页面 HTML 快照 | ✅ | ${existsSync(join(RAW_PATH, 'page-sample-001.html')) ? '✅' : '❌'} |
| \\\`raw/edge-sample-001.json\\\` | 边界情况样本 | ⚠️ | ${existsSync(join(RAW_PATH, 'edge-sample-001.json')) ? '✅' : '❌'} |
| \\\`raw/think-sample-001.json\\\` | 包含 Think 块的样本 | ⚠️ | ${existsSync(join(RAW_PATH, 'think-sample-001.json')) ? '✅' : '❌'} |
| \\\`raw/code-sample-001.json\\\` | 包含代码块的样本 | ⚠️ | ${existsSync(join(RAW_PATH, 'code-sample-001.json')) ? '✅' : '❌'} |
| \\\`screenshots/\\\` | 页面截图目录 | ⚠️ | ${existsSync(join(BASE_PATH, 'screenshots')) ? '✅' : '❌'} |
| \\\`.sample-info.json\\\` | 样本元数据 | ✅ | ${existsSync(join(BASE_PATH, '.sample-info.json')) ? '✅' : '❌'} |

## 样本结构

### detail-sample-001.json (预期结构)

\\\`\\\`\\\`json
{
  "_meta": {
    "platform": "deepseek",
    "capturedAt": "2026-03-19T10:00:00.000Z",
    "apiVersion": "v1"
  },
  "conversationId": "[CONVERSATION_ID]",
  "title": "[会话标题]",
  "messages": [
    {
      "id": "[MESSAGE_ID]",
      "role": "user|assistant",
      "content": "[消息内容]",
      "reasoning_content": "[思考过程]（可选）",
      "created_at": 1710840000000
    }
  ],
  "created_at": 1710840000000,
  "updated_at": 1710840015000
}
\\\`\\\`\\\`

### list-sample-001.json (预期结构)

\\\`\\\`\\\`json
{
  "_meta": {
    "platform": "deepseek",
    "capturedAt": "2026-03-19T10:00:00.000Z",
    "apiVersion": "v1"
  },
  "conversations": [
    {
      "conversationId": "[CONVERSATION_ID]",
      "title": "[会话标题]",
      "created_at": 1710840000000,
      "updated_at": 1710840015000,
      "message_count": 10
    }
  ],
  "has_more": false,
  "next_cursor": null
}
\\\`\\\`\\\`

## 采集步骤

### 1. 准备环境

1. 打开 Chrome/Edge 浏览器
2. 访问 https://chat.deepseek.com
3. 登录账号
4. 打开开发者工具 (F12)
5. 切换到 Network 标签
6. 勾选 "Preserve log" (保留日志)

### 2. 采集详情请求

1. 在筛选框输入：\\\`detail\\\` 或 \\\`conversation\\\` 或 \\\`chat\\\`
2. 找到一个对话详情相关的请求
3. 右键 → Copy → Copy response
4. 保存为 \\\`raw/detail-sample-001.json\\\`
5. 使用 \\\`jq '.'\\\` 格式化 JSON

### 3. 采集列表请求

1. 在筛选框输入：\\\`list\\\` 或 \\\`conversation\\\`
2. 找到对话列表请求
3. 右键 → Copy response
4. 保存为 \\\`raw/list-sample-001.json\\\`

### 4. 采集页面 HTML

1. 在对话页面按 \\\`F12\\\` 打开开发者工具
2. 在 Console 中执行：
   \\\`\\\`\\\`javascript
   const html = document.documentElement.outerHTML;
   const blob = new Blob([html], { type: 'text/html' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = 'page-sample.html';
   a.click();
   \\\`\\\`\\\`
3. 保存为 \\\`raw/page-sample-001.html\\\`

### 5. 脱敏处理

**重要**: 提交前必须移除以下敏感信息：

\\\`\\\`\\\`bash
# 使用 jq 脱敏 JSON 文件
for file in fixtures/deepseek/raw/*.json; do
  jq '
    .conversationId = "[CONVERSATION_ID]" |
    .userId = "[USER_ID]" |
    (.messages // []) |= map(.id = "[MESSAGE_ID]")
  ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done
\\\`\\\`\\\`

## 脱敏检查清单

提交前请确认：

- [ ] Cookie 字段已移除或替换为 \\\`[REDACTED]\\\`
- [ ] Authorization header 已移除或替换为 \\\`[REDACTED]\\\`
- [ ] 用户 ID 已替换为 \\\`[USER_ID]\\\`
- [ ] 对话 ID 已替换为 \\\`[CONVERSATION_ID]\\\`
- [ ] 消息 ID 已替换为 \\\`[MESSAGE_ID]\\\`
- [ ] 真实对话内容已替换为占位符
- [ ] JSON 格式正确（可通过 \\\`jq '.'\\\` 验证）
- [ ] 运行验证脚本通过

## 验证命令

\\\`\\\`\\\`bash
# 验证 JSON 格式
jq '.' raw/detail-sample-001.json > /dev/null && echo "✅ detail-sample-001.json 格式正确"
jq '.' raw/list-sample-001.json > /dev/null && echo "✅ list-sample-001.json 格式正确"

# 检查必需字段
jq -e '.conversationId and .messages' raw/detail-sample-001.json > /dev/null && echo "✅ detail 包含必需字段"
jq -e '.conversations' raw/list-sample-001.json > /dev/null && echo "✅ list 包含必需字段"

# 检查敏感信息
grep -E "Cookie:|Authorization:" raw/*.curl 2>/dev/null | grep -v "\\\\[REDACTED\\\\]" && echo "⚠️ 发现未脱敏信息" || echo "✅ 敏感信息已脱敏"
\\\`\\\`\\\`

## 相关文档

- [DEEPSEEK_SAMPLE_PACK.md](../docs/DEEPSEEK_SAMPLE_PACK.md) - 样本包提交规范
- [SAMPLE_CAPTURE_GUIDE.md](../docs/SAMPLE_CAPTURE_GUIDE.md) - 样本采集通用指南
- [DEEPSEEK_TEST_PLAN.md](../docs/DEEPSEEK_TEST_PLAN.md) - DeepSeek 测试计划
- [DEEPSEEK_ADAPTER_NOTES.md](../docs/DEEPSEEK_ADAPTER_NOTES.md) - DeepSeek 适配器开发笔记

---

**采集时间**: ${new Date().toISOString().split('T')[0]}  
**维护者**: Chat Export Toolkit Team  
**状态**: 📋 模板阶段（等待真实样本采集）
`;

  writeFileSync(filePath, template.replace(/\\\\`/g, '`'), 'utf-8');
  console.log(`✅ 生成 README.md`);
  return filePath;
}

// 生成采集检查清单
function generateChecklist() {
  const filePath = join(BASE_PATH, 'CHECKLIST.md');
  
  const template = `# DeepSeek 样本采集检查清单

> **规范文档**: [DEEPSEEK_SAMPLE_PACK.md](../docs/DEEPSEEK_SAMPLE_PACK.md)

## 采集前准备

- [ ] 已登录 DeepSeek 账号 (https://chat.deepseek.com)
- [ ] 浏览器开发者工具已打开 (F12)
- [ ] Network 标签已切换到 XHR/Fetch
- [ ] "Preserve log" 已勾选
- [ ] 筛选条件设置为：\\\`detail\\\` 或 \\\`conversation\\\` 或 \\\`chat\\\`
- [ ] 已准备至少 1 个完整对话用于采集

## 文件采集

### 🔴 必需文件

#### 详情响应 (detail-sample-001.json)

- [ ] 找到详情 API 请求 (URL 可能包含 \\\`/api/chat/detail\\\`、\\\`/conversation\\\`、\\\`/chat\\\`)
- [ ] 已复制响应 JSON → \\\`raw/detail-sample-001.json\\\`
- [ ] 响应包含 \\\`conversationId\\\` 或类似字段
- [ ] 响应包含消息数组 (\\\`messages\\\`、\\\`chats\\\`、\\\`turns\\\` 等)
- [ ] 消息数量 >= 2 (至少一轮对话)
- [ ] JSON 格式正确 (可通过 \\\`jq '.'\\\` 验证)

#### 列表响应 (list-sample-001.json)

- [ ] 找到列表 API 请求 (URL 可能包含 \\\`/api/chat/list\\\`、\\\`/conversation/list\\\`)
- [ ] 已复制响应 JSON → \\\`raw/list-sample-001.json\\\`
- [ ] 响应包含 \\\`conversations\\\` 或类似数组
- [ ] 数组中至少有 1 个会话
- [ ] JSON 格式正确

#### 页面 HTML (page-sample-001.html)

- [ ] 在对话页面执行 HTML 导出脚本
- [ ] 保存为 \\\`raw/page-sample-001.html\\\`
- [ ] HTML 文件可正常打开
- [ ] 文件大小合理 (100KB - 2MB)

### 🟡 推荐文件

#### 边界情况样本 (edge-sample-001.json)

- [ ] 包含空消息或 null 内容
- [ ] 包含特殊字符 (@#$%^&* 等)
- [ ] 包含 Emoji
- [ ] 包含多语言混合

#### Think 块样本 (think-sample-001.json)

- [ ] 包含推理/思考过程
- [ ] Think 块字段明确 (\\\`reasoning_content\\\`、\\\`thinkContent\\\` 等)
- [ ] 包含最终回答内容

#### 代码样本 (code-sample-001.json)

- [ ] 包含代码块
- [ ] 代码块有语言标记
- [ ] 包含多种语言代码 (如 Python、JavaScript)

### 🟢 可选文件

#### 截图

- [ ] 详情页截图 → \\\`screenshots/detail-page.png\\\`
- [ ] 列表页截图 → \\\`screenshots/list-page.png\\\`
- [ ] 截图清晰显示 URL 栏
- [ ] 截图包含至少一条完整消息

#### 日志

- [ ] 采集过程记录 → \\\`logs/capture-log.txt\\\`
- [ ] 记录采集时间
- [ ] 记录浏览器版本
- [ ] 记录遇到的问题

## 脱敏处理

### JSON 文件脱敏

\\\`\\\`\\\`bash
# 批量脱敏 JSON 文件
for file in fixtures/deepseek/raw/*.json; do
  jq '
    .conversationId = "[CONVERSATION_ID]" |
    .userId = "[USER_ID]" |
    .sessionId = "[SESSION_ID]" |
    (.messages // []) |= map(
      .id = "[MESSAGE_ID]" |
      if .content then .content = "[MESSAGE_CONTENT]" else . end
    )
  ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done
\\\`\\\`\\\`

### 检查清单

- [ ] Cookie 字段已替换为 \\\`[REDACTED]\\\`
- [ ] Authorization header 已替换为 \\\`[REDACTED]\\\`
- [ ] 其他 token 已移除或替换
- [ ] 用户 ID 已替换为 \\\`[USER_ID]\\\`
- [ ] 对话 ID 已替换为 \\\`[CONVERSATION_ID]\\\`
- [ ] 消息 ID 已替换为 \\\`[MESSAGE_ID]\\\`
- [ ] 真实对话内容已替换为占位符
- [ ] 个人身份信息已移除
- [ ] URL 中的敏感参数已处理

## 格式验证

- [ ] JSON 文件可通过 \\\`jq '.'\\\` 验证
- [ ] 使用 2 空格缩进
- [ ] 无语法错误
- [ ] 文件名符合规范 (\\\`detail-sample-001.json\\\` 格式)
- [ ] 包含 \\\`_meta\\\` 字段（平台、采集时间）

## 自动化验证

\\\`\\\`\\\`bash
# 验证 JSON 格式
jq '.' fixtures/deepseek/raw/detail-sample-001.json > /dev/null
jq '.' fixtures/deepseek/raw/list-sample-001.json > /dev/null

# 检查必需字段
jq -e '.conversationId and .messages' fixtures/deepseek/raw/detail-sample-001.json > /dev/null
jq -e '.conversations' fixtures/deepseek/raw/list-sample-001.json > /dev/null

# 检查敏感信息
grep -E "Cookie:|Authorization:" fixtures/deepseek/raw/*.curl 2>/dev/null | grep -v "\\\\[REDACTED\\\\]"
\\\`\\\`\\\`

- [ ] 验证脚本全部通过
- [ ] 无敏感信息泄露
- [ ] 所有必需文件存在

## 元数据

- [ ] 已创建 \\\`.sample-info.json\\\`
- [ ] 填写采集时间
- [ ] 填写浏览器版本
- [ ] 填写操作系统
- [ ] 填写样本特点
- [ ] 更新 \\\`checklist\\\` 字段状态

## 提交前检查

- [ ] 运行 \\\`git diff\\\` 确认无敏感信息
- [ ] 更新 \\\`README.md\\\` 的采集时间
- [ ] 编写清晰的 commit message
- [ ] 通知维护者审查

### 建议 Commit Message

\\\`\\\`\\\`
feat(deepseek): 添加真实样本包（detail/list/page）

- 添加 detail-sample-001.json（对话详情 API 响应）
- 添加 list-sample-001.json（对话列表 API 响应）
- 添加 page-sample-001.html（对话页面 HTML）
- 所有样本已脱敏处理

验证状态:
- ✅ JSON 格式验证通过
- ✅ 必需字段完整
- ✅ 敏感信息已脱敏
- ⏸️ 待 Golden Tests 验证

关联文档:
- refs: DEEPSEEK_TEST_PLAN.md
- refs: SAMPLE_CAPTURE_GUIDE.md
- refs: DEEPSEEK_SAMPLE_PACK.md
\\\`\\\`\\\`

---

**采集日期**: ${new Date().toISOString().split('T')[0]}  
**采集者**: ${process.env.USER || 'unknown'}  
**状态**: 📋 待采集
`;

  writeFileSync(filePath, template.replace(/\\\\`/g, '`'), 'utf-8');
  console.log(`✅ 生成 CHECKLIST.md`);
  return filePath;
}

// 生成脱敏辅助脚本
function generateSanitizeScript() {
  const filePath = join(BASE_PATH, 'sanitize.sh');
  
  const template = `#!/bin/bash
# DeepSeek 样本脱敏脚本
# 用法：bash fixtures/deepseek/sanitize.sh

set -e

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
RAW_DIR="$BASE_DIR/raw"

echo "🔒 开始脱敏 DeepSeek 样本..."

# 脱敏 JSON 文件
echo "📄 脱敏 JSON 文件..."
for file in "$RAW_DIR"/*.json; do
  if [ -f "$file" ]; then
    echo "   处理：$(basename "$file")"
    jq '
      .conversationId = "[CONVERSATION_ID]" |
      .userId = "[USER_ID]" |
      .sessionId = "[SESSION_ID]" |
      (.messages // []) |= map(
        .id = "[MESSAGE_ID]" |
        if .content and (.content | type) == "string" then
          .content = "[MESSAGE_CONTENT]"
        elif .content and (.content | type) == "array" then
          .content |= map(if .msg then .msg = "[MESSAGE_CONTENT]" else . end)
        else .
        end
      ) |
      (.conversations // []) |= map(
        .conversationId = "[CONVERSATION_ID]" |
        .title = "[CONVERSATION_TITLE]"
      )
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  fi
done

# 脱敏 cURL 文件（如存在）
echo "📄 脱敏 cURL 文件..."
for file in "$RAW_DIR"/*.curl; do
  if [ -f "$file" ]; then
    echo "   处理：$(basename "$file")"
    sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' "$file"
    sed -i '' 's/Authorization: [^"]*/Authorization: [REDACTED]/g' "$file"
    sed -i '' 's/X-Token: [^"]*/X-Token: [REDACTED]/g' "$file"
    sed -i '' 's/X-API-Key: [^"]*/X-API-Key: [REDACTED]/g' "$file"
  fi
done

echo ""
echo "✅ 脱敏完成！"
echo ""
echo "📋 请手动检查以下内容："
echo "   1. 确认无真实对话内容泄露"
echo "   2. 确认无个人身份信息泄露"
echo "   3. 运行：git diff fixtures/deepseek/raw/"
echo ""
`;

  writeFileSync(filePath, template, 'utf-8');
  
  // 设置执行权限
  try {
    const { execSync } = require('child_process');
    execSync(`chmod +x "${filePath}"`);
  } catch (e) {
    // 忽略权限设置失败
  }
  
  console.log(`✅ 生成 sanitize.sh`);
  return filePath;
}

// 主函数
function main() {
  console.log('🔧 准备 DeepSeek 样本包目录结构...\n');

  // 创建基础目录
  console.log('📁 创建目录结构:');
  DIRECTORIES.forEach(dir => {
    const dirPath = join(BASE_PATH, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      console.log(`   ✅ 创建 ${dir}/`);
    } else {
      console.log(`   ℹ️  ${dir}/ 已存在`);
    }
  });

  console.log('');

  // 生成模板文件
  console.log('📄 生成模板文件:');
  generateSampleInfo();
  generateReadme();
  generateChecklist();
  generateSanitizeScript();

  console.log('');

  // 显示当前状态
  console.log('📦 当前样本包状态:\n');
  const files = {
    'raw/detail-sample-001.json': existsSync(join(RAW_PATH, 'detail-sample-001.json')),
    'raw/list-sample-001.json': existsSync(join(RAW_PATH, 'list-sample-001.json')),
    'raw/page-sample-001.html': existsSync(join(RAW_PATH, 'page-sample-001.html')),
    'raw/edge-sample-001.json': existsSync(join(RAW_PATH, 'edge-sample-001.json')),
    'raw/think-sample-001.json': existsSync(join(RAW_PATH, 'think-sample-001.json')),
    'raw/code-sample-001.json': existsSync(join(RAW_PATH, 'code-sample-001.json')),
    '.sample-info.json': existsSync(join(BASE_PATH, '.sample-info.json')),
    'screenshots/': existsSync(join(BASE_PATH, 'screenshots')),
    'logs/': existsSync(join(BASE_PATH, 'logs')),
  };

  Object.entries(files).forEach(([file, exists]) => {
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  });

  console.log('');
  console.log('📋 下一步操作:');
  console.log('   1. 阅读 fixtures/deepseek/CHECKLIST.md 了解采集步骤');
  console.log('   2. 访问 https://chat.deepseek.com 并登录');
  console.log('   3. 打开开发者工具 (F12) → Network 标签');
  console.log('   4. 按 CHECKLIST.md 指引采集样本文件');
  console.log('   5. 采集完成后运行 bash fixtures/deepseek/sanitize.sh 脱敏');
  console.log('   6. 脱敏后验证并提交 Git');
  console.log('');
  console.log('📖 相关文档:');
  console.log('   - docs/DEEPSEEK_SAMPLE_PACK.md - 样本包提交规范');
  console.log('   - docs/SAMPLE_CAPTURE_GUIDE.md - 样本采集通用指南');
  console.log('   - docs/DEEPSEEK_TEST_PLAN.md - DeepSeek 测试计划');
  console.log('');
  console.log('✨ 样本包结构准备完成！');
}

// 运行
main();
