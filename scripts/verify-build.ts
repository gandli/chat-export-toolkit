/**
 * 构建验证脚本
 * 
 * 用途：验证构建产物完整性和基本结构
 * 
 * 使用方法：
 * bun run scripts/verify-build.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

interface BuildCheck {
  name: string;
  check: () => boolean | string;
  description: string;
}

const checks: BuildCheck[] = [
  {
    name: 'Userscript 存在',
    description: '检查 userscript 文件是否生成',
    check: () => {
      const path = join(rootDir, 'userscripts', 'chat-export.v2.user.js');
      return existsSync(path) ? '✅' : '❌';
    },
  },
  {
    name: 'Userscript 大小',
    description: '检查 userscript 文件大小是否合理 (>10KB)',
    check: () => {
      const path = join(rootDir, 'userscripts', 'chat-export.v2.user.js');
      if (!existsSync(path)) return '❌ 文件不存在';
      const stats = readFileSync(path, 'utf-8');
      const sizeKB = Math.round(stats.length / 1024);
      return sizeKB > 10 ? `✅ ${sizeKB} KB` : `⚠️ ${sizeKB} KB (偏小)`;
    },
  },
  {
    name: 'Userscript 元数据',
    description: '检查 userscript header 是否完整',
    check: () => {
      const path = join(rootDir, 'userscripts', 'chat-export.v2.user.js');
      if (!existsSync(path)) return '❌ 文件不存在';
      const content = readFileSync(path, 'utf-8');
      const hasGrant = content.includes('@grant');
      const hasMatch = content.includes('@match');
      const hasVersion = content.includes('@version');
      return hasGrant && hasMatch && hasVersion ? '✅ 完整' : '❌ 缺少元数据';
    },
  },
  {
    name: '测试页存在',
    description: '检查集成测试页是否存在',
    check: () => {
      const path = join(rootDir, 'test-integration.html');
      return existsSync(path) ? '✅' : '❌';
    },
  },
  {
    name: '测试页引用',
    description: '检查测试页是否正确引用 userscript',
    check: () => {
      const path = join(rootDir, 'test-integration.html');
      if (!existsSync(path)) return '❌ 文件不存在';
      const content = readFileSync(path, 'utf-8');
      return content.includes('chat-export.v2.user.js') ? '✅ 正确' : '❌ 引用错误';
    },
  },
  {
    name: 'Fixtures 目录',
    description: '检查 fixtures 目录结构',
    check: () => {
      const path = join(rootDir, 'fixtures');
      if (!existsSync(path)) return '❌ 目录不存在';
      const edgeCasesPath = join(path, 'edge-cases');
      return existsSync(edgeCasesPath) ? '✅ 包含 edge-cases' : '⚠️ 缺少 edge-cases';
    },
  },
  {
    name: '文档完整',
    description: '检查 E2E 验证文档是否存在',
    check: () => {
      const path = join(rootDir, 'docs', 'E2E_VALIDATION.md');
      return existsSync(path) ? '✅' : '❌';
    },
  },
];

async function verifyBuild() {
  console.log('🔍 开始构建验证...\n');
  console.log('═══════════════════════════════════════════');

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    const result = check.check();
    const status = typeof result === 'string' ? result : (result ? '✅' : '❌');
    const detail = typeof result === 'string' ? '' : (result ? '通过' : '失败');
    
    console.log(`${status} ${check.name}`);
    console.log(`   ${check.description}`);
    if (detail) console.log(`   ${detail}`);
    console.log('');

    if (status.startsWith('✅')) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('═══════════════════════════════════════════');
  console.log(`\n📊 验证结果：${passed} 通过，${failed} 失败\n`);

  if (failed > 0) {
    console.log('⚠️  部分检查未通过，请检查构建流程。\n');
    process.exit(1);
  } else {
    console.log('✅ 所有检查通过！构建产物完整。\n');
  }
}

verifyBuild().catch((error) => {
  console.error('❌ 验证失败:', error);
  process.exit(1);
});
