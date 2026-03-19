#!/usr/bin/env bun

/**
 * prepare-release-alpha.ts
 * 
 * 汇总 Alpha 发布前信息：版本、测试、产物、文档
 * 
 * 用法:
 *   bun run scripts/prepare-release-alpha.ts [version]
 * 
 * 示例:
 *   bun run scripts/prepare-release-alpha.ts v0.7.0-alpha.1
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// 颜色输出
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title: string) {
  console.log("");
  log(colors.bold + colors.cyan, `═ ${title} ${"═".repeat(60 - title.length)}`);
}

function check(cmd: string): { success: boolean; output: string } {
  try {
    const output = execSync(cmd, { cwd: ROOT, encoding: "utf-8", stdio: "pipe" });
    return { success: true, output: output.trim() };
  } catch (e: any) {
    return { success: false, output: e.message?.trim() || "Unknown error" };
  }
}

function fileExists(path: string): boolean {
  return existsSync(join(ROOT, path));
}

function readJson(path: string): any {
  try {
    const content = readFileSync(join(ROOT, path), "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function getGitInfo() {
  const branch = check("git rev-parse --abbrev-ref HEAD");
  const commit = check("git rev-parse --short HEAD");
  const status = check("git status --porcelain");
  
  return {
    branch: branch.success ? branch.output : "unknown",
    commit: commit.success ? commit.output : "unknown",
    hasUncommittedChanges: status.success && status.output.length > 0,
  };
}

function getTestSummary() {
  const result = check("bun test 2>&1 | tail -20");
  if (!result.success) {
    return { passed: 0, failed: 0, total: 0, output: "测试执行失败" };
  }
  
  const output = result.output;
  const passMatch = output.match(/(\d+)\s+pass/);
  const failMatch = output.match(/(\d+)\s+fail/);
  
  const passed = passMatch ? parseInt(passMatch[1]) : 0;
  const failed = failMatch ? parseInt(failMatch[1]) : 0;
  
  return {
    passed,
    failed,
    total: passed + failed,
    output,
  };
}

function getBuildInfo() {
  const userscriptPath = join(ROOT, "userscripts", "chat-export.v2.user.js");
  
  if (!existsSync(userscriptPath)) {
    return { exists: false, size: 0 };
  }
  
  const stats = check(`stat -f%z "${userscriptPath}"`);
  const size = stats.success ? parseInt(stats.output) : 0;
  
  return {
    exists: true,
    size,
    sizeFormatted: (size / 1024).toFixed(2) + " KB",
  };
}

function checkDocument(paths: string[]) {
  const results: Record<string, boolean> = {};
  for (const path of paths) {
    results[path] = fileExists(path);
  }
  return results;
}

function generateReport(version: string) {
  const gitInfo = getGitInfo();
  const testSummary = getTestSummary();
  const buildInfo = getBuildInfo();
  const packageJson = readJson("package.json");
  
  const docs = checkDocument([
    "README.md",
    "CHANGELOG.md",
    "docs/ARCHITECTURE.md",
    "docs/ADAPTERS.md",
    "docs/ALPHA_STATUS.md",
    "docs/RELEASE_CHECKLIST.md",
    "docs/YUANBAO_ALPHA_READINESS.md",
    "RELEASE_NOTES_v0.7.0-alpha.1.md",
  ]);
  
  const report = {
    version,
    timestamp: new Date().toISOString(),
    git: gitInfo,
    package: packageJson,
    build: buildInfo,
    tests: testSummary,
    docs,
  };
  
  return report;
}

function printReport(report: ReturnType<typeof generateReport>) {
  section("📦 版本信息");
  log(colors.bold, `版本号：${colors.magenta}${report.version}${colors.reset}`);
  log(colors.bold, `发布时间：${colors.cyan}${report.timestamp}${colors.reset}`);
  log(colors.bold, `package.json 版本：${colors.yellow}${report.package?.version || "N/A"}${colors.reset}`);
  
  section("🔀 Git 状态");
  log(colors.bold, `分支：${colors.cyan}${report.git.branch}${colors.reset}`);
  log(colors.bold, `Commit: ${colors.cyan}${report.git.commit}${colors.reset}`);
  
  if (report.git.hasUncommittedChanges) {
    log(colors.yellow, "⚠️  存在未提交的变更");
  } else {
    log(colors.green, "✅ 工作区干净");
  }
  
  section("🏗️  构建状态");
  if (report.build.exists) {
    log(colors.green, `✅ 构建产物存在：${report.build.sizeFormatted}`);
  } else {
    log(colors.red, "❌ 构建产物不存在，请运行：bun run build");
  }
  
  section("🧪 测试状态");
  const passRate = report.tests.total > 0 
    ? ((report.tests.passed / report.tests.total) * 100).toFixed(1) 
    : 0;
  
  log(colors.bold, `通过：${colors.green}${report.tests.passed}${colors.reset}`);
  log(colors.bold, `失败：${colors.red}${report.tests.failed}${colors.reset}`);
  log(colors.bold, `总计：${report.tests.total}`);
  log(colors.bold, `通过率：${colors.cyan}${passRate}%${colors.reset}`);
  
  section("📚 文档完整性");
  const docEntries = Object.entries(report.docs);
  let allDocsExist = true;
  
  for (const [path, exists] of docEntries) {
    const icon = exists ? colors.green + "✅" : colors.red + "❌";
    log(colors.bold, `${icon} ${path}${colors.reset}`);
    if (!exists) allDocsExist = false;
  }
  
  section("📋 发布就绪评估");
  
  const checks = [
    { name: "构建产物", pass: report.build.exists },
    { name: "测试通过率 > 80%", pass: report.tests.total > 0 && (report.tests.passed / report.tests.total) >= 0.8 },
    { name: "核心文档完整", pass: allDocsExist },
    { name: "工作区干净", pass: !report.git.hasUncommittedChanges },
  ];
  
  let allPass = true;
  for (const check of checks) {
    const icon = check.pass ? colors.green + "✅" : colors.red + "❌";
    log(colors.bold, `${icon} ${check.name}${colors.reset}`);
    if (!check.pass) allPass = false;
  }
  
  console.log("");
  if (allPass) {
    log(colors.green + colors.bold, "🎉 发布就绪！所有检查通过");
  } else {
    log(colors.yellow + colors.bold, "⚠️  存在未通过的检查项，请处理后再发布");
  }
  
  console.log("");
}

function generateMarkdown(report: ReturnType<typeof generateReport>): string {
  const passRate = report.tests.total > 0 
    ? ((report.tests.passed / report.tests.total) * 100).toFixed(1) 
    : 0;
  
  const allDocsExist = Object.values(report.docs).every(v => v);
  
  return `# 发布前检查报告

**版本**: ${report.version}  
**生成时间**: ${report.timestamp}

---

## Git 状态

- **分支**: \`${report.git.branch}\`
- **Commit**: \`${report.git.commit}\`
- **未提交变更**: ${report.git.hasUncommittedChanges ? "⚠️ 存在" : "✅ 无"}

---

## 构建状态

${report.build.exists 
  ? `✅ 构建产物存在：**${report.build.sizeFormatted}**` 
  : "❌ 构建产物不存在"}

---

## 测试状态

| 指标 | 数值 |
|------|------|
| 通过 | ${report.tests.passed} |
| 失败 | ${report.tests.failed} |
| 总计 | ${report.tests.total} |
| 通过率 | ${passRate}% |

---

## 文档完整性

${Object.entries(report.docs)
  .map(([path, exists]) => exists ? `✅ ${path}` : `❌ ${path}`)
  .join("\n")}

---

## 发布就绪评估

| 检查项 | 状态 |
|--------|------|
| 构建产物 | ${report.build.exists ? "✅" : "❌"} |
| 测试通过率 > 80% | ${(report.tests.total > 0 && (report.tests.passed / report.tests.total) >= 0.8) ? "✅" : "❌"} |
| 核心文档完整 | ${allDocsExist ? "✅" : "❌"} |
| 工作区干净 | ${!report.git.hasUncommittedChanges ? "✅" : "❌"} |

---

## 建议操作

${report.git.hasUncommittedChanges 
  ? "1. 提交或暂存未提交的变更\n2. 重新运行此脚本" 
  : "✅ 可以 proceed 发布流程"}
`;
}

// 主函数
async function main() {
  const version = process.argv[2] || "v0.7.0-alpha.1";
  
  log(colors.bold + colors.blue, "╔═══════════════════════════════════════════════════════════╗");
  log(colors.bold + colors.blue, "║         Alpha 发布前信息汇总                              ║");
  log(colors.bold + colors.blue, "╚═══════════════════════════════════════════════════════════╝");
  
  const report = generateReport(version);
  printReport(report);
  
  // 生成 Markdown 报告
  const markdown = generateMarkdown(report);
  const outputPath = join(ROOT, "RELEASE_REPORT.md");
  writeFileSync(outputPath, markdown, "utf-8");
  
  log(colors.cyan, `📄 详细报告已保存至：${outputPath}`);
  console.log("");
}

main().catch(console.error);
