#!/usr/bin/env bun
/**
 * prepare-yuanbao-sample-pack.ts
 * 
 * 生成 Yuanbao 样本包目录结构和元数据模板
 * 
 * 用法:
 *   bun run scripts/prepare-yuanbao-sample-pack.ts
 * 
 * 功能:
 *   1. 创建标准目录结构
 *   2. 生成 .sample-info.json 模板
 *   3. 更新 README.md（如不存在）
 *   4. 生成采集检查清单
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

// 基础路径
const BASE_PATH = join(process.cwd(), 'fixtures', 'yuanbao-live');
const DOCS_PATH = join(process.cwd(), 'docs');

// 目录结构
const DIRECTORIES = [
  'screenshots',
  'html-snapshots',
  'logs',
];

// 生成 .sample-info.json 模板
function generateSampleInfo() {
  const template = {
    platform: 'yuanbao',
    capturedAt: new Date().toISOString(),
    capturedBy: process.env.USER || 'unknown',
    environment: {
      browser: 'Chrome/Edge (请填写版本号)',
      os: 'macOS/Windows/Linux (请填写版本)',
      userAgent: 'Mozilla/5.0 ... (请填写完整 User-Agent)',
    },
    apiVersion: 'v2',
    endpoints: {
      detail: '/api/user/agent/conversation/v2/detail',
      list: '/api/user/agent/conversation/v2/list',
    },
    sanitized: false,
    validated: false,
    notes: '请填写样本特点，如：包含 think 块、代码块、图片等',
    checklist: {
      detailResponse: false,
      listResponse: false,
      detailRequest: false,
      listRequest: false,
      screenshots: false,
      htmlSnapshots: false,
      sanitized: false,
      validated: false,
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

  const template = `# Yuanbao 真实页面样本

此目录包含从腾讯元宝真实页面采集的 API 请求和响应样本。

> **样本包规范**: 参见 [\`docs/YUANBAO_SAMPLE_PACK.md\`](../docs/YUANBAO_SAMPLE_PACK.md)

## 快速开始

### 采集样本

\`\`\`bash
# 1. 访问 https://yuanbao.tencent.com 并登录
# 2. 打开开发者工具 (F12)
# 3. 运行采集脚本
bun run scripts/capture-yuanbao-samples.ts
# 4. 按提示执行控制台代码
\`\`\`

### 验证样本

\`\`\`bash
# 验证样本文件完整性
bun run scripts/validate-yuanbao-samples.ts

# 生成样本包结构
bun run scripts/prepare-yuanbao-sample-pack.ts
\`\`\`

## 文件说明

| 文件 | 说明 | 必需 | 状态 |
|------|------|------|------|
| \`detail-response.json\` | 对话详情 API 响应样本 | ✅ | ${existsSync(join(BASE_PATH, 'detail-response.json')) ? '✅' : '❌'} |
| \`list-response.json\` | 对话列表 API 响应样本 | ✅ | ${existsSync(join(BASE_PATH, 'list-response.json')) ? '✅' : '❌'} |
| \`detail-request.curl\` | 对话详情 API 请求 (cURL 格式) | ⚠️ | ${existsSync(join(BASE_PATH, 'detail-request.sample.curl')) ? '✅' : '❌'} |
| \`list-request.curl\` | 对话列表 API 请求 (cURL 格式) | ⚠️ | ${existsSync(join(BASE_PATH, 'list-request.sample.curl')) ? '✅' : '❌'} |
| \`screenshots/\` | 页面截图目录 | ⚠️ | ${existsSync(join(BASE_PATH, 'screenshots')) ? '✅' : '❌'} |
| \`html-snapshots/\` | HTML 快照目录 | ⚠️ | ${existsSync(join(BASE_PATH, 'html-snapshots')) ? '✅' : '❌'} |
| \`.sample-info.json\` | 样本元数据 | ⚠️ | ${existsSync(join(BASE_PATH, '.sample-info.json')) ? '✅' : '❌'} |

## 样本结构

### detail-response.json

\`\`\`json
{
  "conversationId": "[CONVERSATION_ID]",
  "sessionTitle": "[会话标题]",
  "convs": [
    {
      "speaker": "user|ai",
      "index": 1,
      "speechesV2": [
        {
          "content": [
            { "type": "text", "msg": "[消息内容]" },
            { "type": "think", "title": "思考", "content": "[思考内容]" }
          ]
        }
      ],
      "createTime": 1710840000000
    }
  ],
  "createTime": 1710840000000,
  "updateTime": 1710840000000
}
\`\`\`

### list-response.json

\`\`\`json
{
  "code": 0,
  "msg": "success",
  "conversations": [
    {
      "conversationId": "[CONVERSATION_ID]",
      "title": "[会话标题]",
      "createTime": 1710840000000,
      "updateTime": 1710840000000,
      "messageCount": 10
    }
  ],
  "hasMore": true,
  "nextCursor": "cursor_xxx"
}
\`\`\`

## 采集步骤

### 1. 准备环境

1. 打开 Chrome/Edge 浏览器
2. 访问 https://yuanbao.tencent.com
3. 登录账号
4. 打开开发者工具 (F12)
5. 切换到 Network 标签
6. 勾选 "Preserve log" (保留日志)

### 2. 采集详情请求

1. 在筛选框输入：\`detail\` 或 \`conversation\`
2. 找到一个 \`POST\` 请求，URL 包含 \`/api/user/agent/conversation/v2/detail\`
3. 右键 → Copy → Copy as cURL
4. 保存为 \`detail-request.curl\`
5. 再次右键 → Copy response
6. 保存为 \`detail-response.json\`

### 3. 采集列表请求

1. 在筛选框输入：\`list\` 或 \`conversation\`
2. 找到一个 \`POST\` 请求，URL 包含 \`/api/user/agent/conversation/v2/list\`
3. 右键 → Copy → Copy as cURL
4. 保存为 \`list-request.curl\`
5. 再次右键 → Copy response
6. 保存为 \`list-response.json\`

### 4. 脱敏处理

**重要**: 提交前必须移除以下敏感信息：

\`\`\`bash
# 编辑 cURL 文件，移除或替换：
# - Cookie 字段
# - Authorization header
# - 任何 token

# 示例 (使用 sed):
sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' detail-request.curl
sed -i '' 's/Authorization: [^"]*/Authorization: [REDACTED]/g' detail-request.curl
\`\`\`

## 脱敏检查清单

提交前请确认：

- [ ] Cookie 字段已移除或替换为 \`[REDACTED]\`
- [ ] Authorization header 已移除或替换为 \`[REDACTED]\`
- [ ] 用户 ID 已替换为 \`[USER_ID]\`
- [ ] 对话 ID 已替换为 \`[CONVERSATION_ID]\`
- [ ] 真实对话内容已替换为占位符
- [ ] JSON 格式正确（可通过 \`jq '.'\` 验证）
- [ ] 运行验证脚本通过

## 验证命令

\`\`\`bash
# 验证 JSON 格式
jq '.' detail-response.json > /dev/null && echo "✅ detail-response.json 格式正确"
jq '.' list-response.json > /dev/null && echo "✅ list-response.json 格式正确"

# 检查必需字段
jq -e '.conversationId and .convs' detail-response.json > /dev/null && echo "✅ detail-response.json 包含必需字段"
jq -e '.conversations' list-response.json > /dev/null && echo "✅ list-response.json 包含必需字段"

# 运行验证脚本
bun run scripts/validate-yuanbao-samples.ts
\`\`\`

## 相关文档

- [YUANBAO_SAMPLE_PACK.md](../docs/YUANBAO_SAMPLE_PACK.md) - 样本包提交规范
- [SAMPLE_CAPTURE_GUIDE.md](../docs/SAMPLE_CAPTURE_GUIDE.md) - 样本采集通用指南
- [YUANBAO_LIVE_VALIDATION.md](../docs/YUANBAO_LIVE_VALIDATION.md) - 真实页面验证指南

---

**采集时间**: ${new Date().toISOString().split('T')[0]}  
**维护者**: Chat Export Toolkit Team  
**版本**: V2.0.0-alpha
`;

  writeFileSync(filePath, template, 'utf-8');
  console.log(`✅ 生成 README.md`);
  return filePath;
}

// 生成采集检查清单
function generateChecklist() {
  const filePath = join(BASE_PATH, 'CHECKLIST.md');
  
  const template = `# Yuanbao 样本采集检查清单

## 采集前准备

- [ ] 已登录 Yuanbao 账号
- [ ] 浏览器开发者工具已打开 (F12)
- [ ] Network 标签已切换到 XHR/Fetch
- [ ] "Preserve log" 已勾选
- [ ] 筛选条件设置为：\`yuanbao\` 或 \`conversation\`

## 文件采集

### 详情请求和响应

- [ ] 找到 detail API 请求 (URL 包含 \`/api/user/agent/conversation/v2/detail\`)
- [ ] 已复制 cURL 命令 → \`detail-request.curl\`
- [ ] 已复制响应 JSON → \`detail-response.json\`
- [ ] 响应包含 \`conversationId\` 字段
- [ ] 响应包含 \`convs\` 数组（至少 1 条消息）

### 列表请求和响应

- [ ] 找到 list API 请求 (URL 包含 \`/api/user/agent/conversation/v2/list\`)
- [ ] 已复制 cURL 命令 → \`list-request.curl\`
- [ ] 已复制响应 JSON → \`list-response.json\`
- [ ] 响应包含 \`conversations\` 数组（至少 1 个会话）

### 截图（推荐）

- [ ] 详情页截图 → \`screenshots/detail-page.png\`
- [ ] 列表页截图 → \`screenshots/list-page.png\`
- [ ] 截图清晰显示 URL 栏

### HTML 快照（可选）

- [ ] 详情页 HTML → \`html-snapshots/detail-page.html\`
- [ ] 列表页 HTML → \`html-snapshots/list-page.html\`

## 脱敏处理

- [ ] Cookie 字段已替换为 \`[REDACTED]\`
- [ ] Authorization header 已替换为 \`[REDACTED]\`
- [ ] 其他 token 已移除或替换
- [ ] 用户 ID 已替换为 \`[USER_ID]\`
- [ ] 对话 ID 已替换为 \`[CONVERSATION_ID]\`
- [ ] 真实对话内容已替换为占位符
- [ ] 个人身份信息已移除

## 格式验证

- [ ] JSON 文件可通过 \`jq '.'\` 验证
- [ ] 使用 2 空格缩进
- [ ] 无语法错误
- [ ] 文件名符合规范

## 自动化验证

\`\`\`bash
# 运行验证脚本
bun run scripts/validate-yuanbao-samples.ts

# 检查 JSON 格式
jq '.' detail-response.json > /dev/null
jq '.' list-response.json > /dev/null

# 检查敏感信息
grep -E "Cookie:|Authorization:" *.curl | grep -v "\\[REDACTED\\]"
\`\`\`

- [ ] 验证脚本全部通过
- [ ] 无敏感信息泄露
- [ ] 所有必需文件存在

## 元数据

- [ ] 已创建 \`.sample-info.json\`
- [ ] 填写采集时间
- [ ] 填写浏览器版本
- [ ] 填写操作系统
- [ ] 填写样本特点

## 提交前检查

- [ ] 运行 \`git diff\` 确认无敏感信息
- [ ] 更新 \`README.md\` 的采集时间
- [ ] 编写清晰的 commit message
- [ ] 通知维护者审查

---

**采集日期**: ${new Date().toISOString().split('T')[0]}  
**采集者**: ${process.env.USER || 'unknown'}
`;

  writeFileSync(filePath, template, 'utf-8');
  console.log(`✅ 生成 CHECKLIST.md`);
  return filePath;
}

// 主函数
function main() {
  console.log('🔧 准备 Yuanbao 样本包目录结构...\n');

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

  console.log('');

  // 显示当前状态
  console.log('📦 当前样本包状态:\n');
  const files = {
    'detail-response.json': existsSync(join(BASE_PATH, 'detail-response.json')),
    'list-response.json': existsSync(join(BASE_PATH, 'detail-response.json')),
    'detail-request.curl': existsSync(join(BASE_PATH, 'detail-request.sample.curl')),
    'list-request.curl': existsSync(join(BASE_PATH, 'list-request.sample.curl')),
    '.sample-info.json': existsSync(join(BASE_PATH, '.sample-info.json')),
    'screenshots/': existsSync(join(BASE_PATH, 'screenshots')),
    'html-snapshots/': existsSync(join(BASE_PATH, 'html-snapshots')),
  };

  Object.entries(files).forEach(([file, exists]) => {
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  });

  console.log('');
  console.log('📋 下一步操作:');
  console.log('   1. 按照 CHECKLIST.md 采集样本文件');
  console.log('   2. 运行 bun run scripts/capture-yuanbao-samples.ts 获取采集说明');
  console.log('   3. 采集完成后运行 bun run scripts/validate-yuanbao-samples.ts 验证');
  console.log('   4. 脱敏后提交 Git');
  console.log('');
  console.log('✨ 样本包结构准备完成！');
}

// 运行
main();
