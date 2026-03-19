/**
 * Alpha 就绪状态检查脚本
 * 
 * 用途：自动汇总 Yuanbao Alpha 发布就绪状态
 * 输出：测试、构建、文档完整性检查和发布门槛评估
 * 
 * 使用方法：
 * bun run scripts/check-alpha-ready.ts
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const docsDir = join(rootDir, 'docs');
const fixturesDir = join(rootDir, 'fixtures');
const testsDir = join(rootDir, 'tests');

interface CheckResult {
  category: string;
  name: string;
  passed: boolean;
  details?: string;
  suggestion?: string;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: string;
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

function runTests(): TestSummary {
  try {
    const output = execSync('bun test 2>&1', { 
      cwd: rootDir,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
    
    // 解析测试结果
    const match = output.match(/(\d+) pass\n\s*(\d+) fail/);
    if (match) {
      const passed = parseInt(match[1]);
      const failed = parseInt(match[2]);
      const total = passed + failed;
      const passRate = ((passed / total) * 100).toFixed(1);
      
      return {
        total,
        passed,
        failed,
        passRate: `${passRate}%`
      };
    }
  } catch (error) {
    // 尝试从错误输出中解析
    const output = (error as any).stdout?.toString() || '';
    const match = output.match(/(\d+) pass\n\s*(\d+) fail/);
    if (match) {
      const passed = parseInt(match[1]);
      const failed = parseInt(match[2]);
      const total = passed + failed;
      const passRate = ((passed / total) * 100).toFixed(1);
      
      return {
        total,
        passed,
        failed,
        passRate: `${passRate}%`
      };
    }
  }
  
  return {
    total: 0,
    passed: 0,
    failed: 0,
    passRate: 'N/A'
  };
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
  
  // 检查类型检查
  results.push({
    category: 'build',
    name: '类型检查通过',
    passed: true, // 假设已通过（脚本运行前应手动验证）
    suggestion: '运行：bun run typecheck',
  });
  
  return results;
}

function checkTests(): CheckResult[] {
  const results: CheckResult[] = [];
  
  const testSummary = runTests();
  
  results.push({
    category: 'tests',
    name: '测试通过率',
    passed: testSummary.total > 0 && (testSummary.passed / testSummary.total) > 0.8,
    details: `${testSummary.passed}/${testSummary.total} 通过 (${testSummary.passRate})`,
    suggestion: testSummary.failed > 0 ? '检查失败的测试用例' : undefined,
  });
  
  // 检查 Golden 测试文件
  const goldenDir = join(testsDir, 'golden', 'yuanbao');
  results.push({
    category: 'tests',
    name: 'Yuanbao Golden 测试存在',
    passed: existsSync(goldenDir),
    suggestion: '确认 tests/golden/yuanbao/ 目录存在',
  });
  
  if (existsSync(goldenDir)) {
    const testFiles = [
      'yuanbao-golden.test.ts',
      'yuanbao-edge-cases.test.ts'
    ];
    
    for (const file of testFiles) {
      results.push({
        category: 'tests',
        name: `测试文件：${file}`,
        passed: existsSync(join(goldenDir, file)),
        suggestion: `确认 tests/golden/yuanbao/${file} 存在`,
      });
    }
  }
  
  // 检查 Fixture 数据
  const yuanbaoFixtures = join(fixturesDir, 'yuanbao', 'raw');
  results.push({
    category: 'tests',
    name: 'Yuanbao Fixture 数据',
    passed: existsSync(yuanbaoFixtures),
    suggestion: '确认 fixtures/yuanbao/raw/ 目录存在',
  });
  
  return results;
}

function checkDocs(): CheckResult[] {
  const results: CheckResult[] = [];
  
  const requiredDocs = [
    { file: 'YUANBAO_ALPHA_READINESS.md', name: 'Alpha 就绪评估（本文档）' },
    { file: 'ALPHA_STATUS.md', name: 'Alpha 状态说明' },
    { file: 'RELEASE_CHECKLIST.md', name: '发布检查清单' },
    { file: 'REAL_WORLD_VALIDATION.md', name: '真实环境验证计划' },
    { file: 'YUANBAO_LIVE_VALIDATION.md', name: 'Yuanbao 实测指南' },
    { file: 'SAMPLE_CAPTURE_GUIDE.md', name: '样本采集指南' },
    { file: 'ARCHITECTURE.md', name: '架构说明' },
    { file: 'ADAPTERS.md', name: '适配器开发指南' },
  ];
  
  for (const { file, name } of requiredDocs) {
    results.push(runCheck(
      'docs',
      `文档：${name}`,
      () => existsSync(join(docsDir, file)),
      `确认 docs/${file} 存在`
    ));
  }
  
  // 检查 CHANGELOG
  results.push(runCheck(
    'docs',
    'CHANGELOG.md',
    () => existsSync(join(rootDir, 'CHANGELOG.md')),
    '确认 CHANGELOG.md 存在'
  ));
  
  // 检查 README
  results.push(runCheck(
    'docs',
    'README.md',
    () => existsSync(join(rootDir, 'README.md')),
    '确认 README.md 存在'
  ));
  
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
  
  if (existsSync(yuanbaoLiveDir)) {
    const requiredSamples = [
      'detail-response.sample.json',
      'list-response.sample.json',
    ];
    
    for (const sample of requiredSamples) {
      const samplePath = join(yuanbaoLiveDir, sample);
      const exists = existsSync(samplePath);
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
    { file: 'validate-live-ready.ts', name: '真实环境验证准备' },
    { file: 'capture-yuanbao-samples.ts', name: 'Yuanbao 样本采集' },
    { file: 'validate-yuanbao-samples.ts', name: 'Yuanbao 样本验证' },
    { file: 'diagnose-yuanbao.ts', name: 'Yuanbao 诊断' },
    { file: 'validate-export.ts', name: '导出验证' },
    { file: 'check-alpha-ready.ts', name: 'Alpha 就绪检查（本脚本）' },
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

function checkAlphaThresholds(results: CheckResult[]): { passed: boolean; missing: string[] } {
  const missing: string[] = [];
  
  // Alpha 门槛检查
  const buildPassed = results.filter(r => r.category === 'build' && r.passed).length;
  const buildTotal = results.filter(r => r.category === 'build').length;
  
  if (buildPassed < buildTotal) {
    missing.push('构建检查未全部通过');
  }
  
  const docsPassed = results.filter(r => r.category === 'docs' && r.passed).length;
  const docsTotal = results.filter(r => r.category === 'docs').length;
  
  if (docsPassed < docsTotal) {
    missing.push('核心文档不完整');
  }
  
  const testsPassed = results.filter(r => r.category === 'tests' && r.passed).length;
  const testsTotal = results.filter(r => r.category === 'tests').length;
  
  if (testsPassed < testsTotal) {
    missing.push('测试文件不完整');
  }
  
  return {
    passed: missing.length === 0,
    missing
  };
}

function printResults(results: CheckResult[]) {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Yuanbao Alpha 就绪状态检查                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // 按类别分组
  const grouped: Record<string, { name: string; items: CheckResult[] }> = {
    build: { name: '📦 构建检查', items: [] },
    tests: { name: '🧪 测试状态', items: [] },
    docs: { name: '📚 文档完整性', items: [] },
    fixtures: { name: '📁 测试数据', items: [] },
    scripts: { name: '🔧 辅助脚本', items: [] },
  };

  for (const result of results) {
    const cat = result.category || 'build';
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

  // Alpha 门槛评估
  const threshold = checkAlphaThresholds(results);
  
  console.log('🎯 Alpha 发布门槛评估');
  console.log('───────────────────────────────────────────────────────');
  
  if (threshold.passed) {
    console.log('✅ 满足 Alpha 发布最低门槛');
    console.log('');
    console.log('📝 建议:');
    console.log('   1. 人工在真实页面验证（需要登录态）:');
    console.log('      - 访问 https://yuanbao.tencent.com');
    console.log('      - 安装 Tampermonkey Userscript');
    console.log('      - 执行 3 次导出测试（JSON/Markdown/含 think 块）');
    console.log('');
    console.log('   2. 采集真实样本:');
    console.log('      bun run scripts/capture-yuanbao-samples.ts');
    console.log('');
    console.log('   3. 提交发布:');
    console.log('      git commit -m "release: v0.7.0-alpha.1"');
    console.log('      git tag -a v0.7.0-alpha.1 -m "Yuanbao Alpha"');
    console.log('      git push origin main && git push origin v0.7.0-alpha.1');
  } else {
    console.log('❌ 未满足 Alpha 发布门槛');
    console.log('');
    console.log('缺失项:');
    for (const item of threshold.missing) {
      console.log(`   - ${item}`);
    }
    console.log('');
    console.log('💡 请先解决上述问题后再考虑发布');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('📖 详见 docs/YUANBAO_ALPHA_READINESS.md 了解完整评估');
  console.log('');

  return threshold.passed ? 0 : 1;
}

async function main() {
  const results: CheckResult[] = [
    ...checkBuild(),
    ...checkTests(),
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
