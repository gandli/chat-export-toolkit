#!/usr/bin/env bun
/**
 * check-evidence-collection.ts
 * 
 * 检查 Yuanbao 真机实测证据收集完整性
 * 
 * 用法:
 *   bun run scripts/check-evidence-collection.ts
 * 
 * 功能:
 *   1. 检查必需的证据文件是否存在
 *   2. 检查文件内容是否有效
 *   3. 检查敏感信息是否已脱敏
 *   4. 生成收集报告
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// 基础路径
const BASE_PATH = join(process.cwd(), 'fixtures', 'yuanbao-live');

// 颜色定义
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const NC = '\x1b[0m'; // No Color

// 检查项定义
interface CheckItem {
  name: string;
  path: string;
  required: boolean;
  checkContent?: (content: string, path: string) => { pass: boolean; message: string };
  checkFile?: (path: string) => { pass: boolean; message: string };
}

const CHECK_ITEMS: CheckItem[] = [
  // 截图证据
  {
    name: '控制台初始化日志截图',
    path: 'screenshots/console-init.png',
    required: true,
  },
  {
    name: 'FAB 按钮截图',
    path: 'screenshots/fab-button.png',
    required: true,
  },
  {
    name: '导出面板截图',
    path: 'screenshots/export-panel.png',
    required: true,
  },
  {
    name: 'Network 请求截图',
    path: 'screenshots/network-requests.png',
    required: true,
  },
  {
    name: '导出成功提示截图',
    path: 'screenshots/export-success.png',
    required: false,
  },
  
  // 导出文件
  {
    name: 'JSON 导出文件',
    path: 'exports/',
    required: true,
    checkFile: (path) => {
      if (!existsSync(path)) {
        return { pass: false, message: '目录不存在' };
      }
      const files = readdirSync(path).filter(f => f.endsWith('.json'));
      if (files.length === 0) {
        return { pass: false, message: '目录中没有 JSON 文件' };
      }
      return { pass: true, message: `找到 ${files.length} 个 JSON 文件` };
    },
  },
  {
    name: 'Markdown 导出文件',
    path: 'exports/',
    required: false,
    checkFile: (path) => {
      if (!existsSync(path)) {
        return { pass: false, message: '目录不存在' };
      }
      const files = readdirSync(path).filter(f => f.endsWith('.md'));
      if (files.length === 0) {
        return { pass: true, message: '目录中没有 Markdown 文件（可选）' };
      }
      return { pass: true, message: `找到 ${files.length} 个 Markdown 文件` };
    },
  },
  
  // API 样本 - cURL
  {
    name: '详情请求 cURL',
    path: 'detail-request.sample.curl',
    required: true,
    checkContent: (content) => {
      // 检查是否包含脱敏标记
      const hasRedacted = /\[REDACTED|请替换 | 请移除/i.test(content);
      if (hasRedacted) {
        return { pass: true, message: '敏感信息已脱敏或使用占位符' };
      }
      // 如果没有脱敏标记，检查是否有真实长度的 Cookie 值
      const hasRealCookie = /Cookie:\s*[^'\n]{20,}/i.test(content);
      if (hasRealCookie) {
        return { pass: false, message: '⚠️ 发现未脱敏的敏感信息（Cookie 或 Authorization）' };
      }
      return { pass: true, message: '敏感信息已脱敏或使用占位符' };
    },
  },
  {
    name: '列表请求 cURL',
    path: 'list-request.sample.curl',
    required: true,
    checkContent: (content) => {
      const hasRedacted = /\[REDACTED|请替换 | 请移除/i.test(content);
      if (hasRedacted) {
        return { pass: true, message: '敏感信息已脱敏或使用占位符' };
      }
      const hasRealCookie = /Cookie:\s*[^'\n]{20,}/i.test(content);
      if (hasRealCookie) {
        return { pass: false, message: '⚠️ 发现未脱敏的敏感信息（Cookie 或 Authorization）' };
      }
      return { pass: true, message: '敏感信息已脱敏或使用占位符' };
    },
  },
  
  // API 样本 - JSON
  {
    name: '详情响应 JSON',
    path: 'detail-response.json',
    required: true,
    checkContent: (content, path) => {
      try {
        const data = JSON.parse(content);
        
        // 检查必需字段
        if (!data.conversationId && !data.id) {
          return { pass: false, message: '缺少 conversationId 或 id 字段' };
        }
        if (!data.convs && !data.messages) {
          return { pass: false, message: '缺少 convs 或 messages 数组' };
        }
        
        // 检查是否脱敏
        const contentStr = JSON.stringify(data);
        if (contentStr.includes('user_') && !contentStr.includes('[USER_ID]')) {
          return { pass: false, message: '⚠️ 可能包含未脱敏的用户 ID' };
        }
        
        return { pass: true, message: '结构正确，字段完整' };
      } catch (e) {
        return { pass: false, message: `JSON 解析失败：${e}` };
      }
    },
  },
  {
    name: '列表响应 JSON',
    path: 'list-response.json',
    required: true,
    checkContent: (content, path) => {
      try {
        const data = JSON.parse(content);
        
        // 检查必需字段
        if (!data.conversations) {
          return { pass: false, message: '缺少 conversations 数组' };
        }
        if (!Array.isArray(data.conversations)) {
          return { pass: false, message: 'conversations 不是数组' };
        }
        
        return { pass: true, message: '结构正确，字段完整' };
      } catch (e) {
        return { pass: false, message: `JSON 解析失败：${e}` };
      }
    },
  },
  
  // 日志文件
  {
    name: '控制台日志文本',
    path: 'logs/console-log.txt',
    required: false,
  },
  
  // 元数据
  {
    name: '样本元数据',
    path: '.sample-info.json',
    required: false,
    checkContent: (content) => {
      try {
        const data = JSON.parse(content);
        
        if (!data.capturedAt) {
          return { pass: false, message: '缺少 capturedAt 字段' };
        }
        if (!data.environment) {
          return { pass: false, message: '缺少 environment 字段' };
        }
        
        return { pass: true, message: '元数据完整' };
      } catch (e) {
        return { pass: false, message: `JSON 解析失败：${e}` };
      }
    },
  },
];

// 打印函数
function printHeader(text: string) {
  console.log(`${BLUE}========================================${NC}`);
  console.log(`${BLUE}${text}${NC}`);
  console.log(`${BLUE}========================================${NC}`);
}

function printSuccess(text: string) {
  console.log(`${GREEN}✅ ${text}${NC}`);
}

function printError(text: string) {
  console.log(`${RED}❌ ${text}${NC}`);
}

function printWarning(text: string) {
  console.log(`${YELLOW}⚠️  ${text}${NC}`);
}

function printInfo(text: string) {
  console.log(`ℹ️  ${text}`);
}

// 主函数
function main() {
  printHeader('Yuanbao 真机实测证据收集检查');
  console.log('');
  
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  let warningChecks = 0;
  
  const results: Array<{
    name: string;
    required: boolean;
    pass: boolean;
    message: string;
  }> = [];
  
  // 执行检查
  for (const item of CHECK_ITEMS) {
    totalChecks++;
    const fullPath = join(BASE_PATH, item.path);
    
    let checkResult: { pass: boolean; message: string };
    
    // 检查文件/目录是否存在
    if (!existsSync(fullPath)) {
      if (item.required) {
        checkResult = { pass: false, message: '文件不存在（必需）' };
      } else {
        checkResult = { pass: true, message: '文件不存在（可选）' };
      }
    } else {
      // 文件存在，执行内容检查
      if (item.checkContent) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          checkResult = item.checkContent(content, fullPath);
        } catch (e) {
          checkResult = { pass: false, message: `读取失败：${e}` };
        }
      } else if (item.checkFile) {
        checkResult = item.checkFile(fullPath);
      } else {
        checkResult = { pass: true, message: '文件存在' };
      }
    }
    
    results.push({
      name: item.name,
      required: item.required,
      pass: checkResult.pass,
      message: checkResult.message,
    });
    
    if (checkResult.pass) {
      passedChecks++;
    } else {
      if (item.required) {
        failedChecks++;
      } else {
        warningChecks++;
      }
    }
  }
  
  // 打印结果
  console.log('📋 检查结果:\n');
  
  for (const result of results) {
    const icon = result.pass ? '✅' : (result.required ? '❌' : '⚠️');
    const required = result.required ? '必需' : '可选';
    console.log(`${icon} ${result.name} (${required})`);
    if (!result.pass || result.message !== '文件存在') {
      console.log(`   ${result.message}`);
    }
  }
  
  console.log('');
  printHeader('汇总');
  console.log('');
  console.log(`总检查项：${totalChecks}`);
  console.log(`${GREEN}通过：${passedChecks}${NC}`);
  if (failedChecks > 0) {
    console.log(`${RED}失败：${failedChecks}${NC}`);
  }
  if (warningChecks > 0) {
    console.log(`${YELLOW}可选未收集：${warningChecks}${NC}`);
  }
  
  console.log('');
  
  // 生成报告
  if (failedChecks === 0) {
    printSuccess('证据收集完整！可以提交测试结果。');
    console.log('');
    console.log('下一步操作:');
    console.log('  1. 填写测试结果记录：fixtures/yuanbao-live/RESULT_TEMPLATE.md');
    console.log('  2. 打包证据文件：');
    console.log('     cd fixtures/yuanbao-live');
    console.log('     zip -r yuanbao-evidence-$(date +%Y%m%d).zip screenshots/ exports/ logs/ *.json *.curl');
    console.log('  3. 提交到 Git 或发送给维护者');
  } else {
    printError(`发现 ${failedChecks} 个必需证据缺失或无效！`);
    console.log('');
    console.log('请补充以下证据:');
    results
      .filter(r => !r.pass && r.required)
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.message}`);
      });
    console.log('');
    console.log('参考文档：docs/YUANBAO_LIVE_EXECUTION_PACK.md');
    process.exit(1);
  }
  
  console.log('');
}

// 运行
main();
