/**
 * 真实环境验证准备检查脚本
 * 
 * 用途：快速检查是否已准备好进行 Tampermonkey 实测
 * 输出：准备状态报告和下一步建议
 * 
 * 使用方法：
 * bun run scripts/validate-live-ready.ts
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const docsDir = join(rootDir, 'docs');
const fixturesDir = join(rootDir, 'fixtures');

interface CheckResult {
  category: string;
  name: string;
  passed: boolean;
  details?: string;
  suggestion?: string;
}

function runCheck(category: string, name: string, fn: () => boolean, suggestion?: string): CheckResult {
  try {
    const passed = fn();
    return {
      category,
      name,
      passed,
      suggestion: passed ? undefined : suggestion,
    };
  } catch (error) {
    return {
      category,
      name,
      passed: false,
      suggestion: suggestion || `检查失败：${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

function checkBuild(): CheckResult[] {
  const results: CheckResult[] = [];
  
  // 检查 userscript
  const userScriptPath = join(rootDir, 'userscripts', 'chat-export.v2.user.js');
  const userScriptExists = existsSync(userScriptPath);
  results.push({
    category: 'build',
    name: 'Userscript 已生成',
    passed: userScriptExists,
    suggestion: userScriptExists ? undefined : '运行：bun run build',
  });
  
  // 检查测试页
  const testPagePath = join(rootDir, 'test-integration.html');
  results.push({
    category: 'build',
    name: '集成测试页存在',
    passed: existsSync(testPagePath),
    suggestion: existsSync(testPagePath) ? undefined : '确认 test-integration.html 存在于仓库根目录',
  });
  
  // 检查构建产物大小
  if (userScriptExists) {
    const stats = readFileSync(userScriptPath).length;
    const sizeKB = Math.round(stats / 1024 * 100) / 100;
    results.push({
      category: 'build',
      name: 'Userscript 大小',
      passed: sizeKB < 500,
      details: `${sizeKB} KB`,
      suggestion: sizeKB >= 500 ? '文件过大，考虑优化构建配置' : undefined,
    });
  }
  
  return results;
}

function checkDocs(): CheckResult[] {
  const results: CheckResult[] = [];
  
  const requiredDocs = [
    { file: 'REAL_WORLD_VALIDATION.md', name: '真实环境验证计划' },
    { file: 'YUANBAO_LIVE_VALIDATION.md', name: 'Yuanbao 实测指南' },
    { file: 'SAMPLE_CAPTURE_GUIDE.md', name: '样本采集指南' },
    { file: 'RELEASE_CHECKLIST.md', name: '发布检查清单' },
  ];
  
  for (const { file, name } of requiredDocs) {
    results.push(runCheck(
      'docs',
      `文档：${name}`,
      () => existsSync(join(docsDir, file)),
      `确认 docs/${file} 存在`
    ));
  }
  
  return results;
}

function checkFixtures(): CheckResult[] {
  const results: CheckResult[] = [];
  
  // 检查 fixtures 目录
  results.push(runCheck(
    'fixtures',
    'Fixtures 目录存在',
    () => existsSync(fixturesDir),
    '确认 fixtures 目录存在'
  ));
  
  // 检查 edge-cases
  results.push(runCheck(
    'fixtures',
    '边界情况数据存在',
    () => existsSync(join(fixturesDir, 'edge-cases')),
    '确认 fixtures/edge-cases 目录存在'
  ));
  
  // 检查 yuanbao-live 样本
  const yuanbaoLiveDir = join(fixturesDir, 'yuanbao-live');
  results.push(runCheck(
    'fixtures',
    'Yuanbao 样本目录存在',
    () => existsSync(yuanbaoLiveDir),
    '运行：bun run scripts/capture-yuanbao-samples.ts'
  ));
  
  // 检查必需样本文件
  if (existsSync(yuanbaoLiveDir)) {
    const requiredSamples = [
      'detail-response.json',
      'list-response.json',
    ];
    
    for (const sample of requiredSamples) {
      const samplePath = join(yuanbaoLiveDir, sample);
      // 检查是否存在 sample 或 sample 文件
      const exists = existsSync(samplePath) || 
                     existsSync(samplePath.replace('.json', '.sample.json'));
      results.push(runCheck(
        'fixtures',
        `样本：${sample}`,
        () => exists,
        `采集样本并保存到 fixtures/yuanbao-live/${sample}`
      ));
    }
  }
  
  return results;
}

function checkScripts(): CheckResult[] {
  const results: CheckResult[] = [];
  
  const requiredScripts = [
    { file: 'verify-build.ts', name: '构建验证' },
    { file: 'load-fixtures.ts', name: 'Fixture 加载' },
    { file: 'capture-yuanbao-samples.ts', name: 'Yuanbao 样本采集' },
    { file: 'validate-yuanbao-samples.ts', name: 'Yuanbao 样本验证' },
    { file: 'diagnose-yuanbao.ts', name: 'Yuanbao 诊断' },
    { file: 'validate-export.ts', name: '导出验证' },
  ];
  
  for (const { file, name } of requiredScripts) {
    const scriptPath = join(rootDir, 'scripts', file);
    results.push(runCheck(
      'scripts',
      `脚本：${name}`,
      () => existsSync(scriptPath),
      `确认 scripts/${file} 存在`
    ));
  }
  
  return results;
}

function checkEnv(): CheckResult[] {
  const results: CheckResult[] = [];
  
  // 检查 Node.js
  results.push(runCheck(
    'env',
    'Node.js 可用',
    () => {
      try {
        execSync('node -v', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    '安装 Node.js v20+'
  ));
  
  // 检查 Bun
  results.push(runCheck(
    'env',
    'Bun 可用',
    () => {
      try {
        execSync('bun -v', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    '安装 Bun v1.0+'
  ));
  
  return results;
}

function printResults(results: CheckResult[]) {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     真实环境验证准备检查                              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // 按类别分组
  const grouped: Record<string, { name: string; items: CheckResult[] }> = {
    env: { name: '🖥️  环境检查', items: [] },
    build: { name: '📦 构建检查', items: [] },
    docs: { name: '📚 文档检查', items: [] },
    fixtures: { name: '📁 测试数据', items: [] },
    scripts: { name: '🔧 辅助脚本', items: [] },
  };

  for (const result of results) {
    const cat = result.category || 'env';
    if (grouped[cat]) {
      grouped[cat].items.push(result);
    }
  }

  let totalPassed = 0;
  let totalFailed = 0;

  for (const [key, category] of Object.entries(grouped)) {
    if (category.items.length === 0) continue;

    console.log(`${category.name}`);
    console.log('───────────────────────────────────────────────────────');

    for (const item of category.items) {
      const status = item.passed ? '✅' : '❌';
      console.log(`${status} ${item.name}`);
      
      if (item.details) {
        console.log(`   📊 ${item.details}`);
      }
      
      if (!item.passed && item.suggestion) {
        console.log(`   💡 ${item.suggestion}`);
      }
      
      console.log('');

      if (item.passed) {
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
    console.log('   1. 安装 Tampermonkey 扩展:\n');
    console.log('      Chrome: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo\n');
    console.log('   2. 加载 Userscript:\n');
    console.log('      open userscripts/chat-export.v2.user.js\n');
    console.log('   3. 访问 Yuanbao 页面:\n');
    console.log('      https://yuanbao.tencent.com\n');
    console.log('   4. 打开开发者工具 (F12) 查看日志\n');
    console.log('   5. 执行导出测试并验证下载文件\n');
    console.log('   6. 采集样本 (如需要):\n');
    console.log('      bun run scripts/capture-yuanbao-samples.ts\n');
  } else {
    console.log('⚠️  部分检查未通过，请先解决上述问题。\n');
    
    const buildFailed = results.filter(r => r.category === 'build' && !r.passed).length > 0;
    if (buildFailed) {
      console.log('💡 建议先运行构建命令:\n');
      console.log('   bun install && bun run typecheck && bun run build\n');
    }
  }

  console.log('═══════════════════════════════════════════════════════\n');

  // 返回退出码
  return totalFailed === 0 ? 0 : 1;
}

async function main() {
  const results: CheckResult[] = [
    ...checkEnv(),
    ...checkBuild(),
    ...checkDocs(),
    ...checkFixtures(),
    ...checkScripts(),
  ];

  const exitCode = printResults(results);
  process.exit(exitCode);
}

main().catch((error) => {
  console.error('❌ 检查失败:', error);
  process.exit(1);
});
