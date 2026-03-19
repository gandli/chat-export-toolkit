/**
 * Yuanbao 导出文件验证脚本
 * 
 * 用途：验证导出的 JSON/Markdown 文件是否符合预期格式
 * 
 * 使用方法：
 * bun run scripts/validate-export.ts --file ./output/test-export.json
 * bun run scripts/validate-export.ts --file ./output/test-export.md
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

interface ValidateOptions {
  filePath: string;
  format: 'json' | 'markdown';
}

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  info: Record<string, any>;
}

function parseArgs(): Partial<ValidateOptions> {
  const args = process.argv.slice(2);
  const options: Partial<ValidateOptions> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      options.filePath = args[i + 1];
      i++;
    } else if (args[i] === '--format' && args[i + 1]) {
      options.format = args[i + 1] as 'json' | 'markdown';
      i++;
    }
  }

  return options;
}

function validateJson(filePath: string): ValidationResult {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    info: {},
  };

  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // 必需字段检查
    const requiredFields = ['id', 'title', 'messages', 'createdAt', 'updatedAt'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        result.errors.push(`缺少必需字段：${field}`);
        result.success = false;
      }
    }

    // messages 数组检查
    if (Array.isArray(data.messages)) {
      result.info.messageCount = data.messages.length;

      if (data.messages.length === 0) {
        result.warnings.push('消息数组为空');
      }

      // 检查每条消息的结构
      data.messages.forEach((msg: any, idx: number) => {
        if (!msg.id) {
          result.errors.push(`消息[${idx}] 缺少 id 字段`);
          result.success = false;
        }
        if (!msg.role) {
          result.errors.push(`消息[${idx}] 缺少 role 字段`);
          result.success = false;
        } else if (!['user', 'assistant'].includes(msg.role)) {
          result.warnings.push(`消息[${idx}] role 值异常：${msg.role}`);
        }
        if (!msg.content) {
          result.errors.push(`消息[${idx}] 缺少 content 字段`);
          result.success = false;
        } else if (typeof msg.content.text !== 'string') {
          result.errors.push(`消息[${idx}] content.text 不是字符串`);
          result.success = false;
        }
        if (typeof msg.timestamp !== 'number') {
          result.warnings.push(`消息[${idx}] timestamp 不是数字`);
        }
      });
    } else {
      result.errors.push('messages 不是数组');
      result.success = false;
    }

    // metadata 检查
    if (data.metadata) {
      result.info.platform = data.metadata.platform;
      if (data.metadata.platform !== 'yuanbao') {
        result.warnings.push(`平台标识异常：${data.metadata.platform} (期望：yuanbao)`);
      }
    } else {
      result.warnings.push('缺少 metadata 字段');
    }

    // 统计信息
    result.info.fileSize = Math.round(content.length / 1024 * 100) / 100 + ' KB';
    result.info.conversationId = data.id;
    result.info.conversationTitle = data.title;

  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : '解析失败');
  }

  return result;
}

function validateMarkdown(filePath: string): ValidationResult {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    info: {},
  };

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // 检查标题
    const titleMatch = content.match(/^# (.+)$/m);
    if (!titleMatch) {
      result.errors.push('缺少主标题 (# 标题)');
      result.success = false;
    } else {
      result.info.conversationTitle = titleMatch[1];
    }

    // 检查元数据
    const hasExportTime = content.includes('**导出时间**:') || content.includes('导出时间:');
    const hasPlatform = content.includes('**平台**:') || content.includes('平台:');
    const hasMessageCount = content.includes('**消息数**:') || content.includes('消息数:');

    if (!hasExportTime) {
      result.warnings.push('缺少导出时间');
    }
    if (!hasPlatform) {
      result.warnings.push('缺少平台信息');
    }
    if (!hasMessageCount) {
      result.warnings.push('缺少消息数');
    }

    // 检查消息格式
    const messageHeaders = content.match(/### 第 \d+ 轮 - (用户 | 助手|user|assistant)/g);
    if (!messageHeaders || messageHeaders.length === 0) {
      result.errors.push('未找到消息标题 (### 第 N 轮 - 角色)');
      result.success = false;
    } else {
      result.info.messageCount = messageHeaders.length;
    }

    // 检查分隔线
    const separatorCount = (content.match(/---/g) || []).length;
    if (separatorCount < messageHeaders?.length || 0) {
      result.warnings.push('分隔线数量不足');
    }

    // 检查 think 块格式 (如果存在)
    if (content.includes('思考过程') || content.includes('Think')) {
      const thinkBlocks = content.match(/> \*\*思考过程:\*\*/g) || content.match(/> \[Think\]/g);
      if (!thinkBlocks) {
        result.warnings.push('包含 think 内容但格式不规范');
      }
    }

    // 检查是否有 HTML 残留
    if (content.includes('<div>') || content.includes('<span>') || content.includes('</')) {
      result.warnings.push('检测到 HTML 标签残留');
    }

    // 统计信息
    result.info.fileSize = Math.round(content.length / 1024 * 100) / 100 + ' KB';
    result.info.lineCount = lines.length;

  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : '读取失败');
  }

  return result;
}

function printResult(result: ValidationResult, format: string) {
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📄 验证结果 (${format.toUpperCase()})\n`);

  // 基本信息
  console.log('📊 文件信息:');
  for (const [key, value] of Object.entries(result.info)) {
    console.log(`   ${key}: ${value}`);
  }
  console.log('');

  // 错误
  if (result.errors.length > 0) {
    console.log('❌ 错误:');
    result.errors.forEach(e => console.log(`   - ${e}`));
    console.log('');
  }

  // 警告
  if (result.warnings.length > 0) {
    console.log('⚠️  警告:');
    result.warnings.forEach(w => console.log(`   - ${w}`));
    console.log('');
  }

  // 总结
  console.log('═══════════════════════════════════════════════════════');
  if (result.success) {
    console.log('✅ 验证通过！\n');
  } else {
    console.log('❌ 验证失败！\n');
    process.exit(1);
  }
}

async function validateExport() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Yuanbao 导出文件验证工具                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const options = parseArgs() as ValidateOptions;

  if (!options.filePath) {
    console.log('❌ 错误：请指定文件路径\n');
    console.log('使用方法:');
    console.log('  bun run scripts/validate-export.ts --file ./output/test-export.json');
    console.log('  bun run scripts/validate-export.ts --file ./output/test-export.md\n');
    process.exit(1);
  }

  if (!existsSync(options.filePath)) {
    console.log(`❌ 错误：文件不存在：${options.filePath}\n`);
    process.exit(1);
  }

  // 自动检测格式
  const ext = extname(options.filePath).toLowerCase();
  let format = options.format;
  if (!format) {
    if (ext === '.json') {
      format = 'json';
    } else if (ext === '.md') {
      format = 'markdown';
    } else {
      console.log(`❌ 错误：无法识别文件格式：${ext}\n`);
      console.log('请使用 --format 参数指定格式 (json 或 markdown)\n');
      process.exit(1);
    }
  }

  console.log(`📁 文件：${options.filePath}`);
  console.log(`📝 格式：${format}\n`);

  let result: ValidationResult;
  if (format === 'json') {
    result = validateJson(options.filePath);
  } else {
    result = validateMarkdown(options.filePath);
  }

  printResult(result, format);
}

validateExport().catch((error) => {
  console.error('❌ 验证失败:', error);
  process.exit(1);
});
