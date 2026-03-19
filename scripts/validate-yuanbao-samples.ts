/**
 * Yuanbao 样本验证脚本
 * 
 * 用途：验证 yuanbao-live 目录中的样本文件完整性和格式
 * 
 * 使用方法：
 * bun run scripts/validate-yuanbao-samples.ts
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const samplesDir = join(rootDir, 'fixtures', 'yuanbao-live');

interface ValidationCheck {
  name: string;
  check: () => { pass: boolean; message?: string };
  required: boolean;
}

function checkSensitivity(content: string): { pass: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // 检查敏感信息
  const sensitivePatterns = [
    { pattern: /Cookie:\s*[^\s]+/i, name: 'Cookie' },
    { pattern: /Authorization:\s*[^\s]+/i, name: 'Authorization' },
    { pattern: /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/i, name: 'JWT Token' },
    { pattern: /session_id[=:]\s*[^\s&]+/i, name: 'Session ID' },
    { pattern: /token[=:]\s*[^\s&]+/i, name: 'Token' },
  ];

  for (const { pattern, name } of sensitivePatterns) {
    if (pattern.test(content)) {
      issues.push(`检测到敏感信息：${name}`);
    }
  }

  return {
    pass: issues.length === 0,
    issues,
  };
}

function validateJsonFile(filePath: string, requiredFields: string[]): { pass: boolean; errors: string[]; info: Record<string, any> } {
  const errors: string[] = [];
  const info: Record<string, any> = {};

  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // 检查必需字段
    for (const field of requiredFields) {
      if (!(field in data)) {
        errors.push(`缺少必需字段：${field}`);
      }
    }

    // 敏感性检查
    const sensitivity = checkSensitivity(content);
    if (!sensitivity.pass) {
      errors.push(...sensitivity.issues);
    }

    // 文件信息
    info.fileSize = Math.round(content.length / 1024 * 100) / 100 + ' KB';
    info.fieldCount = Object.keys(data).length;

    return { pass: errors.length === 0, errors, info };
  } catch (error) {
    return {
      pass: false,
      errors: [error instanceof Error ? error.message : '解析失败'],
      info: {},
    };
  }
}

function validateCurlFile(filePath: string): { pass: boolean; errors: string[]; info: Record<string, any> } {
  const errors: string[] = [];
  const info: Record<string, any> = {};

  try {
    const content = readFileSync(filePath, 'utf-8');

    // 检查是否是有效的 cURL 命令
    if (!content.includes('curl ')) {
      errors.push('不是有效的 cURL 命令');
    }

    // 检查是否包含 URL
    const urlMatch = content.match(/https?:\/\/[^\s'"]+/);
    if (!urlMatch) {
      errors.push('未找到 URL');
    } else {
      info.url = urlMatch[0];
    }

    // 敏感性检查
    const sensitivity = checkSensitivity(content);
    if (!sensitivity.pass) {
      errors.push(...sensitivity.issues);
    }

    // 文件信息
    info.fileSize = Math.round(content.length / 1024 * 100) / 100 + ' KB';

    return { pass: errors.length === 0, errors, info };
  } catch (error) {
    return {
      pass: false,
      errors: [error instanceof Error ? error.message : '读取失败'],
      info: {},
    };
  }
}

async function validateSamples() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Yuanbao 样本验证工具                              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // 检查目录是否存在
  if (!existsSync(samplesDir)) {
    console.log('❌ 样本目录不存在:', samplesDir);
    console.log('\n💡 提示：运行以下命令采集样本:');
    console.log('   bun run scripts/capture-yuanbao-samples.ts\n');
    process.exit(1);
  }

  console.log(`📁 样本目录：${samplesDir}\n`);

  const files = readdirSync(samplesDir);
  
  if (files.length === 0) {
    console.log('⚠️  样本目录为空');
    console.log('\n💡 提示：运行以下命令采集样本:');
    console.log('   bun run scripts/capture-yuanbao-samples.ts\n');
    process.exit(0);
  }

  console.log(`📄 发现 ${files.length} 个文件\n`);
  console.log('═══════════════════════════════════════════════════════\n');

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;

  // 验证每个文件
  for (const file of files) {
    if (file === 'README.md' || file === 'capture-log.txt') {
      continue; // 跳过文档和日志
    }
    
    if (file.includes('.sample.')) {
      console.log(`ℹ️  跳过示例文件：${file} (仅供参考格式)\n`);
      continue; // 跳过示例文件
    }

    const filePath = join(samplesDir, file);
    console.log(`📝 验证：${file}`);

    let result: { pass: boolean; errors: string[]; info: Record<string, any> };

    if (file.endsWith('.json')) {
      // JSON 文件验证
      const requiredFields = file.includes('detail') 
        ? ['conversationId', 'convs']
        : file.includes('list')
        ? ['conversations']
        : [];

      result = validateJsonFile(filePath, requiredFields);
      
      if (result.pass) {
        console.log(`   ✅ JSON 格式正确`);
        console.log(`   📊 大小：${result.info.fileSize}`);
        
        if (file.includes('detail')) {
          console.log(`   📋 包含 conversationId 和 convs 字段`);
        } else if (file.includes('list')) {
          console.log(`   📋 包含 conversations 数组`);
        }
      } else {
        console.log(`   ❌ 验证失败`);
        result.errors.forEach(e => console.log(`      - ${e}`));
      }
    } else if (file.endsWith('.curl')) {
      // cURL 文件验证
      result = validateCurlFile(filePath);
      
      if (result.pass) {
        console.log(`   ✅ cURL 格式正确`);
        console.log(`   📊 大小：${result.info.fileSize}`);
        if (result.info.url) {
          console.log(`   🔗 URL: ${result.info.url}`);
        }
      } else {
        console.log(`   ❌ 验证失败`);
        result.errors.forEach(e => console.log(`      - ${e}`));
      }
    } else {
      console.log(`   ℹ️  跳过未知格式`);
      continue;
    }

    totalChecks++;
    if (result.pass) {
      passedChecks++;
    } else {
      failedChecks++;
    }

    console.log('');
  }

  // 总结
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\n📊 验证结果：${passedChecks}/${totalChecks} 通过`);

  if (failedChecks > 0) {
    console.log(`\n⚠️  ${failedChecks} 个文件验证失败\n`);
  } else if (totalChecks > 0) {
    console.log('\n✅ 所有样本文件验证通过！\n');
  } else {
    console.log('\nℹ️  没有找到样本文件\n');
  }

  // 检查必需文件
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📋 必需文件检查:\n');

  const requiredFiles = [
    { name: 'detail-response.json', desc: '对话详情响应样本' },
    { name: 'list-response.json', desc: '对话列表响应样本' },
  ];

  for (const { name, desc } of requiredFiles) {
    const exists = existsSync(join(samplesDir, name));
    if (exists) {
      console.log(`✅ ${name} - ${desc}`);
    } else {
      console.log(`❌ ${name} - ${desc} (缺失)`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  // 退出码
  if (failedChecks > 0) {
    process.exit(1);
  }
}

validateSamples().catch((error) => {
  console.error('❌ 验证失败:', error);
  process.exit(1);
});
