/**
 * Yuanbao 样本采集辅助脚本
 * 
 * 用途：帮助用户从真实 Yuanbao 页面采集 API 请求和响应样本
 * 
 * 使用方法：
 * bun run scripts/capture-yuanbao-samples.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outputDir = join(rootDir, 'fixtures', 'yuanbao-live');

// 确保输出目录存在
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
  console.log(`📁 创建目录：${outputDir}`);
}

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     Yuanbao 样本采集工具                              ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('📋 采集步骤:\n');

console.log('1️⃣  打开腾讯元宝页面');
console.log('   🔗 https://yuanbao.tencent.com\n');

console.log('2️⃣  打开开发者工具 (F12)');
console.log('   - 切换到 Console 标签\n');

console.log('3️⃣  复制并执行以下代码:\n');

const captureScript = `
(async function captureYuanbaoSamples() {
  const samples = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    conversations: [],
    requests: [],
  };

  console.log('🔍 开始采集 Yuanbao 样本...');

  // 1. 采集当前对话数据
  if (window.testToolkit?.store?.state?.currentConversation) {
    samples.conversations.push({
      type: 'current',
      data: window.testToolkit.store.state.currentConversation,
      capturedAt: Date.now(),
    });
    console.log('✅ 已捕获当前对话数据');
  } else {
    console.log('⚠️  未找到缓存的对话数据');
  }

  // 2. 采集拦截的请求
  if (window.testToolkit?.interceptor?.capturedUrls) {
    samples.requests = window.testToolkit.interceptor.capturedUrls;
    console.log(\`✅ 已捕获 \${samples.requests.length} 个请求 URL\`);
  }

  // 3. 采集最近的响应
  if (window.testToolkit?.store?.state?.lastInterceptedResponse) {
    samples.lastResponse = window.testToolkit.store.state.lastInterceptedResponse;
    console.log('✅ 已捕获最近的 API 响应');
  }

  // 4. 导出样本
  const blob = new Blob([JSON.stringify(samples, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = \`yuanbao-samples-\${Date.now()}.json\`;
  a.click();
  URL.revokeObjectURL(url);

  console.log('📥 样本文件已下载');
  console.log('📁 请将文件移动到：fixtures/yuanbao-live/\\n');

  // 5. 生成 cURL 命令说明
  console.log('═══════════════════════════════════════════════════════');
  console.log('📝 手动采集 cURL 命令步骤:');
  console.log('');
  console.log('1. 在 Network 标签找到 detail 请求');
  console.log('2. 右键 → Copy → Copy as cURL');
  console.log('3. 保存为：fixtures/yuanbao-live/detail-request.curl');
  console.log('');
  console.log('4. 右键 → Copy response');
  console.log('5. 保存为：fixtures/yuanbao-live/detail-response.json');
  console.log('');
  console.log('6. 对 list 请求重复上述步骤');
  console.log('═══════════════════════════════════════════════════════\\n');

  return samples;
})();
`;

  console.log('```javascript');
console.log(captureScript);
console.log('```\n');

console.log('4️⃣  将下载的样本文件移动到：');
console.log(`   📁 ${outputDir}/\n`);

console.log('5️⃣  手动采集 cURL 命令 (可选但推荐):');
console.log('   - 在 Network 标签找到 API 请求');
console.log('   - 右键 → Copy → Copy as cURL');
console.log('   - 保存为 detail-request.curl 和 list-request.curl\n');

console.log('6️⃣  运行验证:');
console.log('   bun run scripts/validate-yuanbao-samples.ts\n');

console.log('═══════════════════════════════════════════════════════\n');

// 生成 README 文件
const readmeContent = `# Yuanbao 真实页面样本

此目录包含从腾讯元宝真实页面采集的 API 请求和响应样本。

## 文件说明

| 文件 | 说明 |
|------|------|
| \`detail-request.curl\` | 对话详情 API 请求 (cURL 格式) |
| \`detail-response.json\` | 对话详情 API 响应样本 |
| \`list-request.curl\` | 对话列表 API 请求 (cURL 格式) |
| \`list-response.json\` | 对话列表 API 响应样本 |
| \`yuanbao-samples-*.json\` | 自动采集的综合样本 |
| \`capture-log.txt\` | 采集日志 |

## 采集方法

### 自动采集

\`\`\`bash
# 在 Yuanbao 页面控制台执行采集脚本
# (详见 scripts/capture-yuanbao-samples.ts 输出)
\`\`\`

### 手动采集

1. 打开 https://yuanbao.tencent.com
2. 打开开发者工具 (F12) → Network 标签
3. 筛选：yuanbao OR conversation OR api
4. 找到详情请求 (detail)
   - 右键 → Copy → Copy as cURL → 保存为 detail-request.curl
   - 右键 → Copy response → 保存为 detail-response.json
5. 找到列表请求 (list)
   - 右键 → Copy → Copy as cURL → 保存为 list-request.curl
   - 右键 → Copy response → 保存为 list-response.json

## 验证样本

\`\`\`bash
bun run scripts/validate-yuanbao-samples.ts
\`\`\`

## 注意事项

- ⚠️  **敏感信息**: 提交前请移除 Cookie、Authorization 等认证信息
- ⚠️  **时效性**: API 响应可能随时间变化，请标注采集时间
- ⚠️  **隐私**: 不要包含个人对话内容，使用脱敏数据

## 样本结构

### detail-response.json

\`\`\`json
{
  "conversationId": "xxx",
  "sessionTitle": "会话标题",
  "convs": [
    {
      "speaker": "user|ai",
      "index": 1,
      "speechesV2": [
        {
          "content": [
            { "type": "text", "msg": "消息内容" }
          ]
        }
      ]
    }
  ]
}
\`\`\`

### list-response.json

\`\`\`json
{
  "conversations": [
    {
      "conversationId": "xxx",
      "title": "会话标题",
      "createTime": 1710840000000
    }
  ]
}
\`\`\`

---

**采集时间**: ${new Date().toISOString()}  
**维护者**: Chat Export Toolkit Team
`;

writeFileSync(join(outputDir, 'README.md'), readmeContent);
console.log(`✅ 已生成 ${outputDir}/README.md\n`);

console.log('提示：样本文件请脱敏后再提交到版本控制系统！\n');
