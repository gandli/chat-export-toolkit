#!/usr/bin/env bun
/**
 * validate-deepseek-samples.ts
 * 
 * 验证 DeepSeek 样本文件的完整性和格式
 * 
 * 用法:
 *   bun run scripts/validate-deepseek-samples.ts
 * 
 * 功能:
 *   1. 检查必需文件是否存在
 *   2. 验证 JSON 格式
 *   3. 检查必需字段
 *   4. 检查敏感信息
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const BASE_PATH = join(process.cwd(), 'fixtures', 'deepseek');
const RAW_PATH = join(BASE_PATH, 'raw');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// 检查文件是否存在
function checkFileExists(filePath: string, required: boolean = true): boolean {
  const exists = existsSync(filePath);
  if (exists) {
    log(`   ✅ ${filePath.replace(BASE_PATH + '/', '')}`, colors.green);
  } else {
    const marker = required ? '❌' : '⚠️';
    const color = required ? colors.red : colors.yellow;
    log(`   ${marker} ${filePath.replace(BASE_PATH + '/', '')}`, color);
  }
  return exists;
}

// 验证 JSON 格式
function validateJsonFormat(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    JSON.parse(content);
    log(`   ✅ ${filePath.replace(BASE_PATH + '/', '')} - JSON 格式正确`, colors.green);
    return true;
  } catch (e) {
    log(`   ❌ ${filePath.replace(BASE_PATH + '/', '')} - JSON 格式错误: ${(e as Error).message}`, colors.red);
    return false;
  }
}

// 检查必需字段
function checkRequiredFields(filePath: string, fields: string[]): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    let allFieldsPresent = true;
    for (const field of fields) {
      const keys = field.split('.');
      let obj = data;
      let present = true;
      
      for (const key of keys) {
        if (obj[key] === undefined) {
          present = false;
          break;
        }
        obj = obj[key];
      }
      
      if (!present) {
        log(`   ⚠️  ${filePath.replace(BASE_PATH + '/', '')} - 缺少字段: ${field}`, colors.yellow);
        allFieldsPresent = false;
      }
    }
    
    if (allFieldsPresent) {
      log(`   ✅ ${filePath.replace(BASE_PATH + '/', '')} - 必需字段完整`, colors.green);
    }
    return allFieldsPresent;
  } catch (e) {
    log(`   ❌ ${filePath.replace(BASE_PATH + '/', '')} - 无法解析: ${(e as Error).message}`, colors.red);
    return false;
  }
}

// 检查敏感信息
function checkSensitiveInfo(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const sensitivePatterns = [
      /Cookie:\s*[^\[\]]+?(?!\[REDACTED\])/i,
      /Authorization:\s*[^\[\]]+?(?!\[REDACTED\])/i,
      /Bearer\s+[A-Za-z0-9\-_]+/i,
      /api[_-]?key:\s*[^\[\]]+?(?!\[REDACTED\])/i,
      /secret:\s*[^\[\]]+?(?!\[REDACTED\])/i,
    ];
    
    let foundSensitive = false;
    for (const pattern of sensitivePatterns) {
      if (pattern.test(content)) {
        log(`   ⚠️  ${filePath.replace(BASE_PATH + '/', '')} - 可能包含敏感信息 (${pattern.source})`, colors.yellow);
        foundSensitive = true;
      }
    }
    
    if (!foundSensitive) {
      log(`   ✅ ${filePath.replace(BASE_PATH + '/', '')} - 未检测到敏感信息`, colors.green);
    }
    return !foundSensitive;
  } catch (e) {
    return false;
  }
}

// 主函数
function main() {
  log('\n🔍 验证 DeepSeek 样本文件...\n', colors.cyan);
  
  const results = {
    required: { total: 0, pass: 0 },
    json: { total: 0, pass: 0 },
    fields: { total: 0, pass: 0 },
    sensitive: { total: 0, pass: 0 },
  };
  
  // 1. 检查必需文件
  log('📁 检查必需文件:', colors.blue);
  
  const requiredFiles = [
    { path: 'raw/detail-sample-001.json', required: true },
    { path: 'raw/list-sample-001.json', required: true },
    { path: 'raw/page-sample-001.html', required: true },
    { path: '.sample-info.json', required: true },
    { path: 'raw/edge-sample-001.json', required: false },
    { path: 'raw/think-sample-001.json', required: false },
    { path: 'raw/code-sample-001.json', required: false },
  ];
  
  for (const file of requiredFiles) {
    const filePath = join(BASE_PATH, file.path);
    if (checkFileExists(filePath, file.required)) {
      results.required.pass++;
    }
    results.required.total++;
  }
  
  log('');
  
  // 2. 验证 JSON 格式
  log('📄 验证 JSON 格式:', colors.blue);
  
  const jsonFiles = [
    'raw/detail-sample-001.json',
    'raw/list-sample-001.json',
    'raw/edge-sample-001.json',
    'raw/think-sample-001.json',
    'raw/code-sample-001.json',
    '.sample-info.json',
  ];
  
  for (const file of jsonFiles) {
    const filePath = join(BASE_PATH, file);
    if (existsSync(filePath)) {
      if (validateJsonFormat(filePath)) {
        results.json.pass++;
      }
      results.json.total++;
    } else {
      log(`   ⚠️  ${file} - 文件不存在，跳过`, colors.yellow);
    }
  }
  
  log('');
  
  // 3. 检查必需字段
  log('🔑 检查必需字段:', colors.blue);
  
  const detailFields = ['conversationId', 'messages', 'title'];
  const listFields = ['conversations'];
  
  const detailPath = join(RAW_PATH, 'detail-sample-001.json');
  const listPath = join(RAW_PATH, 'list-sample-001.json');
  
  if (existsSync(detailPath)) {
    if (checkRequiredFields(detailPath, detailFields)) {
      results.fields.pass++;
    }
    results.fields.total++;
  } else {
    log(`   ⚠️  detail-sample-001.json - 文件不存在，跳过`, colors.yellow);
  }
  
  if (existsSync(listPath)) {
    if (checkRequiredFields(listPath, listFields)) {
      results.fields.pass++;
    }
    results.fields.total++;
  } else {
    log(`   ⚠️  list-sample-001.json - 文件不存在，跳过`, colors.yellow);
  }
  
  log('');
  
  // 4. 检查敏感信息
  log('🔒 检查敏感信息:', colors.blue);
  
  const filesToCheck = [
    'raw/detail-sample-001.json',
    'raw/list-sample-001.json',
    'raw/edge-sample-001.json',
    'raw/think-sample-001.json',
    'raw/code-sample-001.json',
  ];
  
  for (const file of filesToCheck) {
    const filePath = join(BASE_PATH, file);
    if (existsSync(filePath)) {
      if (checkSensitiveInfo(filePath)) {
        results.sensitive.pass++;
      }
      results.sensitive.total++;
    }
  }
  
  log('');
  
  // 总结
  log('📊 验证总结:', colors.cyan);
  log(`   必需文件：${results.required.pass}/${results.required.total}`, results.required.pass === results.required.total ? colors.green : colors.red);
  log(`   JSON 格式：${results.json.pass}/${results.json.total}`, results.json.pass === results.json.total ? colors.green : colors.yellow);
  log(`   必需字段：${results.fields.pass}/${results.fields.total}`, results.fields.pass === results.fields.total ? colors.green : colors.yellow);
  log(`   敏感信息：${results.sensitive.pass}/${results.sensitive.total}`, results.sensitive.pass === results.sensitive.total ? colors.green : colors.yellow);
  
  log('');
  
  const allPassed = 
    results.required.pass === results.required.total &&
    results.json.pass === results.json.total &&
    results.fields.pass === results.fields.total &&
    results.sensitive.pass === results.sensitive.total;
  
  if (allPassed) {
    log('✅ 所有验证通过！', colors.green);
    process.exit(0);
  } else {
    log('⚠️  部分验证未通过，请检查上述输出', colors.yellow);
    log('');
    log('📋 下一步操作:', colors.blue);
    log('   1. 如果缺少必需文件，请按照 CHECKLIST.md 采集样本');
    log('   2. 如果 JSON 格式错误，请使用 jq 格式化文件');
    log('   3. 如果缺少必需字段，请检查 API 响应结构');
    log('   4. 如果发现敏感信息，请运行 bash fixtures/deepseek/sanitize.sh 脱敏');
    log('');
    process.exit(1);
  }
}

// 运行
main();
