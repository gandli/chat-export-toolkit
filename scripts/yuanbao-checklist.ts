/**
 * Yuanbao 验证快速检查清单
 * 
 * 用途：提供交互式验证清单，帮助用户逐步完成验证
 * 
 * 使用方法：
 * bun run scripts/yuanbao-checklist.ts
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

interface ChecklistItem {
  id: string;
  category: 'env' | 'build' | 'docs' | 'live';
  title: string;
  description: string;
  command?: string;
  check: () => boolean;
}

const checklist: ChecklistItem[] = [
  // 环境检查
  {
    id: 'env-1',
    category: 'env',
    title: 'Node.js 已安装',
    description: '检查 Node.js 是否可用',
    command: 'node -v',
    check: () => {
      try {
        execSync('node -v', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    id: 'env-2',
    category: 'env',
    title: 'Bun 已安装',
    description: '检查 Bun 是否可用',
    command: 'bun -v',
    check: () => {
      try {
        execSync('bun -v', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
  },
  
  // 构建检查
  {
    id: 'build-1',
    category: 'build',
    title: 'Userscript 已生成',
    description: '检查 userscripts/chat-export.v2.user.js 是否存在',
    check: () => existsSync(join(rootDir, 'userscripts', 'chat-export.v2.user.js')),
  },
  {
    id: 'build-2',
    category: 'build',
    title: '测试页存在',
    description: '检查 test-integration.html 是否存在',
    check: () => existsSync(join(rootDir, 'test-integration.html')),
  },
  {
    id: 'build-3',
    category: 'build',
    title: 'Fixtures 目录完整',
    description: '检查 fixtures 和 edge-cases 目录',
    check: () => {
      const fixtures = existsSync(join(rootDir, 'fixtures'));
      const edgeCases = existsSync(join(rootDir, 'fixtures', 'edge-cases'));
      return fixtures && edgeCases;
    },
  },
  
  // 文档检查
  {
    id: 'docs-1',
    category: 'docs',
    title: 'Yuanbao 验证指南',
    description: '检查 docs/YUANBAO_LIVE_VALIDATION.md',
    check: () => existsSync(join(rootDir, 'docs', 'YUANBAO_LIVE_VALIDATION.md')),
  },
  {
    id: 'docs-2',
    category: 'docs',
    title: 'E2E 验证指南',
    description: '检查 docs/E2E_VALIDATION.md',
    check: () => existsSync(join(rootDir, 'docs', 'E2E_VALIDATION.md')),
  },
  {
    id: 'docs-3',
    category: 'docs',
    title: '适配器开发指南',
    description: '检查 docs/ADAPTERS.md',
    check: () => existsSync(join(rootDir, 'docs', 'ADAPTERS.md')),
  },
  
  // 真实页面验证准备
  {
    id: 'live-1',
    category: 'live',
    title: '样本采集脚本',
    description: '检查 scripts/capture-yuanbao-samples.ts',
    check: () => existsSync(join(rootDir, 'scripts', 'capture-yuanbao-samples.ts')),
  },
  {
    id: 'live-2',
    category: 'live',
    title: '导出验证脚本',
    description: '检查 scripts/validate-export.ts',
    check: () => existsSync(join(rootDir, 'scripts', 'validate-export.ts')),
  },
  {
    id: 'live-3',
    category: 'live',
    title: '诊断脚本',
    description: '检查 scripts/diagnose-yuanbao.ts',
    check: () => existsSync(join(rootDir, 'scripts', 'diagnose-yuanbao.ts')),
  },
  {
    id: 'live-4',
    category: 'live',
    title: '样本验证脚本',
    description: '检查 scripts/validate-yuanbao-samples.ts',
    check: () => existsSync(join(rootDir, 'scripts', 'validate-yuanbao-samples.ts')),
  },
];

function printChecklist() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Yuanbao 验证检查清单                              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const categories = {
    env: { name: '🖥️  环境检查', items: [] as ChecklistItem[] },
    build: { name: '📦 构建检查', items: [] as ChecklistItem[] },
    docs: { name: '📚 文档检查', items: [] as ChecklistItem[] },
    live: { name: '🔗 真实页面验证', items: [] as ChecklistItem[] },
  };

  for (const item of checklist) {
    categories[item.category].items.push(item);
  }

  let totalPassed = 0;
  let totalFailed = 0;

  for (const [key, category] of Object.entries(categories)) {
    if (category.items.length === 0) continue;

    console.log(`${category.name}`);
    console.log('───────────────────────────────────────────────────────');

    for (const item of category.items) {
      const passed = item.check();
      const status = passed ? '✅' : '❌';
      
      console.log(`${status} ${item.title}`);
      console.log(`   ${item.description}`);
      
      if (item.command && !passed) {
        console.log(`   💡 运行：${item.command}`);
      }
      
      console.log('');

      if (passed) {
        totalPassed++;
      } else {
        totalFailed++;
      }
    }

    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log(`\n📊 检查结果：${totalPassed} 通过，${totalFailed} 失败\n`);

  if (totalFailed === 0) {
    console.log('✅ 所有检查通过！环境已就绪。\n');
    console.log('📝 下一步:\n');
    console.log('   本地测试:');
    console.log('   1. bun run scripts/serve-test.ts');
    console.log('   2. 访问 http://localhost:3000/test-integration.html\n');
    console.log('   真实页面验证:');
    console.log('   1. 访问 https://yuanbao.tencent.com');
    console.log('   2. bun run scripts/capture-yuanbao-samples.ts');
    console.log('   3. 按提示采集样本\n');
  } else {
    console.log('⚠️  部分检查未通过，请先解决上述问题。\n');
    
    if (totalFailed > 0 && checklist.filter(i => i.category === 'build').some(i => !i.check())) {
      console.log('💡 建议运行构建命令:\n');
      console.log('   bun install && bun run typecheck && bun run build\n');
    }
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

printChecklist();
