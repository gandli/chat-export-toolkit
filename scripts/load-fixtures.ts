/**
 * Fixture 数据加载验证脚本
 * 
 * 用途：验证所有 fixture 文件可以正确加载并符合 schema
 * 
 * 使用方法：
 * bun run scripts/load-fixtures.ts
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', 'fixtures');
const edgeCasesDir = join(fixturesDir, 'edge-cases');

interface Conversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: string;
    content: { text: string; attachments?: any[] };
    timestamp: number;
    metadata?: any;
  }>;
  createdAt: number;
  updatedAt: number;
  metadata?: any;
}

function validateConversation(data: any, filePath: string): string[] {
  const errors: string[] = [];

  if (!data.id) errors.push('缺少 id 字段');
  if (!data.title) errors.push('缺少 title 字段');
  if (!Array.isArray(data.messages)) errors.push('messages 不是数组');
  if (typeof data.createdAt !== 'number') errors.push('createdAt 不是数字');
  if (typeof data.updatedAt !== 'number') errors.push('updatedAt 不是数字');

  if (Array.isArray(data.messages)) {
    data.messages.forEach((msg: any, idx: number) => {
      if (!msg.id) errors.push(`消息[${idx}] 缺少 id`);
      if (!msg.role) errors.push(`消息[${idx}] 缺少 role`);
      if (!msg.content) errors.push(`消息[${idx}] 缺少 content`);
      if (msg.content && typeof msg.content.text !== 'string') {
        errors.push(`消息[${idx}] content.text 不是字符串`);
      }
      if (typeof msg.timestamp !== 'number') {
        errors.push(`消息[${idx}] timestamp 不是数字`);
      }
    });
  }

  return errors;
}

function loadFixture(filePath: string): { data: any; errors: string[] } {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const errors = validateConversation(data, filePath);
    return { data, errors };
  } catch (error) {
    return {
      data: null,
      errors: [error instanceof Error ? error.message : '解析失败'],
    };
  }
}

async function loadFixtures() {
  console.log('🔍 开始 Fixture 数据验证...\n');
  console.log('═══════════════════════════════════════════');

  let total = 0;
  let passed = 0;
  let failed = 0;

  // 验证主 fixtures 目录
  console.log('📁 主 Fixtures 目录:\n');
  const mainFiles = readdirSync(fixturesDir).filter(
    (f) => f.endsWith('.json') && f !== 'README.md' && !f.startsWith('v1-')
  );
  
  // V1 格式文件单独说明
  const v1Files = readdirSync(fixturesDir).filter(
    (f) => f.startsWith('v1-') && f.endsWith('.json')
  );
  if (v1Files.length > 0) {
    console.log('ℹ️  V1 格式文件（跳过验证）:');
    v1Files.forEach(f => console.log(`   - ${f}`));
    console.log('');
  }

  for (const file of mainFiles) {
    const filePath = join(fixturesDir, file);
    const { data, errors } = loadFixture(filePath);
    total++;

    if (errors.length === 0) {
      console.log(`✅ ${file}`);
      console.log(`   ID: ${data.id}`);
      console.log(`   标题：${data.title}`);
      console.log(`   消息数：${data.messages.length}`);
      passed++;
    } else {
      console.log(`❌ ${file}`);
      errors.forEach((e) => console.log(`   - ${e}`));
      failed++;
    }
    console.log('');
  }

  // 验证 edge-cases 目录
  console.log('📁 Edge Cases 目录:\n');
  const edgeFiles = readdirSync(edgeCasesDir).filter((f) => f.endsWith('.json'));

  for (const file of edgeFiles) {
    const filePath = join(edgeCasesDir, file);
    const { data, errors } = loadFixture(filePath);
    total++;

    if (errors.length === 0) {
      console.log(`✅ ${file}`);
      console.log(`   ID: ${data.id}`);
      console.log(`   标题：${data.title}`);
      console.log(`   消息数：${data.messages.length}`);
      
      // 特殊统计
      if (data.messages.length === 0) {
        console.log(`   类型：空对话`);
      } else if (data.messages.length === 1) {
        console.log(`   类型：单条消息`);
      }
      
      const thinkCount = data.messages.filter(
        (m: any) => m.content?.text?.includes('[Think]')
      ).length;
      if (thinkCount > 0) {
        console.log(`   Think 块：${thinkCount} 条消息包含`);
      }
      
      const attachmentCount = data.messages.reduce(
        (acc: number, m: any) => acc + (m.content?.attachments?.length || 0),
        0
      );
      if (attachmentCount > 0) {
        console.log(`   附件：${attachmentCount} 个`);
      }
      
      passed++;
    } else {
      console.log(`❌ ${file}`);
      errors.forEach((e) => console.log(`   - ${e}`));
      failed++;
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════');
  console.log(`\n📊 验证结果：${total} 个文件，${passed} 通过，${failed} 失败\n`);

  if (failed > 0) {
    console.log('⚠️  部分 fixture 文件验证失败，请检查数据结构。\n');
    process.exit(1);
  } else {
    console.log('✅ 所有 fixture 文件验证通过！\n');
  }
}

loadFixtures().catch((error) => {
  console.error('❌ 验证失败:', error);
  process.exit(1);
});
