/**
 * 通用工具函数
 */

/**
 * 生成唯一 ID
 */
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 格式化时间戳为可读日期
 */
export function formatDate(timestamp: number, locale: string = 'zh-CN'): string {
  return new Date(timestamp).toLocaleString(locale);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 安全地解析 JSON
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 等待指定毫秒
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 重试执行函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[retry] Attempt ${i + 1} failed:`, lastError.message);
      if (i < maxRetries - 1) {
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * 检查是否为空值
 */
export function isNullOrEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

/**
 * 获取对象嵌套属性（安全访问）
 */
export function getNestedProperty<T>(obj: Record<string, any>, path: string): T | undefined {
  return path.split('.').reduce<any>((current, key) => current?.[key], obj);
}
