/**
 * Yuanbao 诊断报告生成脚本
 * 
 * 用途：收集环境信息、检查构建产物、生成诊断报告
 * 
 * 使用方法：
 * bun run scripts/diagnose-yuanbao.ts
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

interface DiagnosticReport {
  timestamp: string;
  environment: Record<string, string>;
  buildStatus: {
    userscript: boolean;
    testPage: boolean;
    fixtures: boolean;
  };
  fileChecks: Array<{
    name: string;
    exists: boolean;
    size?: number;
  }>;
  warnings: string[];
  recommendations: string[];
}

function runCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return 'N/A';
  }
}

function checkFile(filePath: string): { exists: boolean; size?: number } {
  if (!existsSync(filePath)) {
    return { exists: false };
  }
  const stats = readFileSync(filePath, 'utf-8');
  return {
    exists: true,
    size: stats.length,
  };
}

async function generateDiagnosis(): Promise<DiagnosticReport> {
  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    environment: {},
    buildStatus: {
      userscript: false,
      testPage: false,
      fixtures: false,
    },
    fileChecks: [],
    warnings: [],
    recommendations: [],
  };

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Yuanbao 诊断工具                                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('🔍 正在收集环境信息...\n');

  // 环境信息
  report.environment = {
    'Node.js': runCommand('node -v'),
    'Bun': runCommand('bun -v'),
    'OS': runCommand('uname -a'),
    'PWD': process.cwd(),
  };

  console.log('📌 环境信息:');
  for (const [key, value] of Object.entries(report.environment)) {
    console.log(`   ${key}: ${value}`);
  }
  console.log('');

  // 检查构建产物
  console.log('📦 检查构建产物:\n');

  const userscriptCheck = checkFile(join(rootDir, 'userscripts', 'chat-export.v2.user.js'));
  report.fileChecks.push({
    name: 'userscripts/chat-export.v2.user.js',
    ...userscriptCheck,
  });
  report.buildStatus.userscript = userscriptCheck.exists;

  if (userscriptCheck.exists) {
    console.log(`✅ userscript: ${Math.round(userscriptCheck.size! / 1024)} KB`);
  } else {
    console.log('❌ userscript: 不存在');
    report.warnings.push('userscript 未生成，请运行 bun run build');
    report.recommendations.push('运行 bun run build 生成 userscript');
  }

  const testPageCheck = checkFile(join(rootDir, 'test-integration.html'));
  report.fileChecks.push({
    name: 'test-integration.html',
    ...testPageCheck,
  });
  report.buildStatus.testPage = testPageCheck.exists;

  if (testPageCheck.exists) {
    console.log(`✅ test-integration.html: ${Math.round(testPageCheck.size! / 1024)} KB`);
  } else {
    console.log('❌ test-integration.html: 不存在');
  }

  // 检查 fixtures
  const fixturesDir = join(rootDir, 'fixtures');
  const fixturesExist = existsSync(fixturesDir);
  report.buildStatus.fixtures = fixturesExist;

  if (fixturesExist) {
    const fixtureFiles = readdirSync(fixturesDir).filter(f => f.endsWith('.json'));
    console.log(`✅ fixtures/: ${fixtureFiles.length} 个 JSON 文件`);

    const edgeCasesDir = join(fixturesDir, 'edge-cases');
    if (existsSync(edgeCasesDir)) {
      const edgeFiles = readdirSync(edgeCasesDir).filter(f => f.endsWith('.json'));
      console.log(`   └─ edge-cases/: ${edgeFiles.length} 个边界测试文件`);
    } else {
      console.log('   └─ edge-cases/: 不存在');
      report.warnings.push('缺少 edge-cases 目录');
    }
  } else {
    console.log('❌ fixtures/: 不存在');
  }

  const yuanbaoLiveDir = join(fixturesDir, 'yuanbao-live');
  if (existsSync(yuanbaoLiveDir)) {
    const liveFiles = readdirSync(yuanbaoLiveDir);
    console.log(`✅ yuanbao-live/: ${liveFiles.length} 个文件 (真实样本)`);
  } else {
    console.log('ℹ️  yuanbao-live/: 不存在 (可使用 capture-yuanbao-samples.ts 采集)');
  }

  console.log('');

  // 检查文档
  console.log('📚 检查文档:\n');

  const docs = [
    'docs/YUANBAO_LIVE_VALIDATION.md',
    'docs/E2E_VALIDATION.md',
    'docs/ADAPTERS.md',
    'YUANBAO_ADAPTER_SUMMARY.md',
  ];

  for (const doc of docs) {
    const docCheck = checkFile(join(rootDir, doc));
    report.fileChecks.push({
      name: doc,
      ...docCheck,
    });
    if (docCheck.exists) {
      console.log(`✅ ${doc}`);
    } else {
      console.log(`❌ ${doc}`);
      report.warnings.push(`缺少文档：${doc}`);
    }
  }

  console.log('');

  // 检查源代码
  console.log('📝 检查源代码:\n');

  const sourceFiles = [
    'src/adapters/yuanbao.ts',
    'src/normalizers/yuanbao.ts',
    'src/adapters/yuanbao-types.ts',
  ];

  for (const src of sourceFiles) {
    const srcCheck = checkFile(join(rootDir, src));
    report.fileChecks.push({
      name: src,
      ...srcCheck,
    });
    if (srcCheck.exists) {
      console.log(`✅ ${src}`);
    } else {
      console.log(`❌ ${src}`);
      report.warnings.push(`缺少源代码：${src}`);
    }
  }

  console.log('');

  // 生成建议
  console.log('💡 建议:\n');

  if (report.recommendations.length === 0) {
    if (report.buildStatus.userscript && report.buildStatus.testPage) {
      report.recommendations.push('环境已就绪，可以开始验证');
      report.recommendations.push('运行 bun run scripts/serve-test.ts 启动测试服务器');
      report.recommendations.push('访问 http://localhost:3000/test-integration.html');
    }
  }

  for (const rec of report.recommendations) {
    console.log(`   • ${rec}`);
  }

  console.log('');

  // 生成报告文件
  const reportPath = join(rootDir, 'output', 'diagnosis-report.json');
  const outputDir = join(rootDir, 'output');
  if (!existsSync(outputDir)) {
    execSync(`mkdir -p ${outputDir}`);
  }

  readFileSync(join(rootDir, 'package.json'), 'utf-8');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 诊断报告已保存：${reportPath}\n`);

  // 总结
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 诊断总结:\n');

  const totalChecks = report.fileChecks.length;
  const passedChecks = report.fileChecks.filter(f => f.exists).length;

  console.log(`   文件检查：${passedChecks}/${totalChecks} 通过`);
  console.log(`   警告数量：${report.warnings.length}`);
  console.log(`   建议数量：${report.recommendations.length}`);

  if (report.warnings.length > 0) {
    console.log('\n⚠️  警告:');
    report.warnings.forEach(w => console.log(`   - ${w}`));
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  if (report.buildStatus.userscript && report.buildStatus.testPage && report.warnings.length === 0) {
    console.log('✅ 环境检查通过！可以开始 Yuanbao 验证。\n');
  } else {
    console.log('⚠️  部分检查未通过，请先解决上述问题。\n');
  }

  return report;
}

// 辅助函数
function writeFileSync(path: string, content: string) {
  const { writeFileSync: fsWriteFileSync } = require('fs');
  fsWriteFileSync(path, content);
}

generateDiagnosis().catch((error) => {
  console.error('❌ 诊断失败:', error);
  process.exit(1);
});
