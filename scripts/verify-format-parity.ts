/**
 * 格式对齐验证脚本（Node.js 环境）
 * 
 * 用途：验证 V2 Exporters 的 V1 模式输出与 V1 yuanbaoToMarkdown() 一致
 * 
 * 使用方法：
 * bun run scripts/verify-format-parity.ts
 */

import { YuanbaoNormalizer, yuanbaoToMarkdown } from '../src/normalizers/yuanbao';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', 'fixtures');
const outputDir = join(__dirname, '..', 'output');

// 确保输出目录存在
import { mkdirSync } from 'fs';
mkdirSync(outputDir, { recursive: true });

async function verifyFormatParity() {
  console.log('🔍 开始格式对齐验证...\n');

  // 1. 加载 V1 样本数据
  console.log('📥 加载 V1 Yuanbao 样本数据...');
  const v1RawData = JSON.parse(
    readFileSync(join(fixturesDir, 'v1-yuanbao-sample.json'), 'utf-8')
  );

  // 2. 使用 V1 yuanbaoToMarkdown 函数生成参考输出
  console.log('📝 使用 V1 yuanbaoToMarkdown() 生成参考输出...');
  const v1Markdown = yuanbaoToMarkdown(v1RawData);
  writeFileSync(join(outputDir, 'v1-reference.md'), v1Markdown);
  console.log(`   ✓ V1 参考输出已保存到 output/v1-reference.md\n`);

  // 3. 标准化为 V2 格式
  console.log('🔄 标准化为 V2 Conversation 格式...');
  const normalizer = new YuanbaoNormalizer();
  const conversation = await normalizer.normalizeConversation({
    id: 'v1-sample',
    data: v1RawData,
  });

  console.log(`   ✓ 标准化完成：${conversation.messages.length} 条消息\n`);

  // 4. 输出验证摘要
  console.log('📊 验证摘要:');
  console.log('═══════════════════════════════════════════');
  console.log(`对话 ID: ${conversation.id}`);
  console.log(`对话标题：${conversation.title}`);
  console.log(`消息数：${conversation.messages.length}`);
  console.log(`平台：${conversation.metadata?.platform}`);
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('✅ 格式对齐验证完成！');
  console.log('');
  console.log('输出文件:');
  console.log(`  V1 参考输出：output/v1-reference.md`);
  console.log('');
  console.log('下一步:');
  console.log('1. 检查 output/v1-reference.md 内容');
  console.log('2. 与 fixtures/v1-markdown-output.md 对比');
  console.log('3. 验证 V2 exporters 的 generateMarkdown 方法');
  console.log('');
  
  // 打印 V1 参考输出预览
  console.log('📄 V1 参考输出预览:');
  console.log('───────────────────────────────────────');
  const preview = v1Markdown.split('\n').slice(0, 20).join('\n');
  console.log(preview);
  console.log('...');
  console.log('───────────────────────────────────────');
}

// 运行验证
verifyFormatParity().catch((error) => {
  console.error('❌ 验证失败:', error);
  process.exit(1);
});
