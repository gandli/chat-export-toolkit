/**
 * Store 实现
 * 提供数据持久化能力
 */

import type { IStore } from './interfaces';
import type { StoreKey, StoreValue, StoreQueryOptions } from '../types';

/**
 * 浏览器存储实现（使用 localStorage/IndexedDB）
 */
export class BrowserStore implements IStore {
  private prefix = 'chat-export:';

  /**
   * 检查存储是否可用
   */
  isAvailable(): boolean {
    try {
      return typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  /**
   * 存储数据
   */
  async set<T extends StoreValue>(key: StoreKey, value: T): Promise<void> {
    const fullKey = this.prefix + key;
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(fullKey, serialized);
      console.log(`[Store] Set ${fullKey}`);
    } catch (error) {
      console.error(`[Store] Failed to set ${fullKey}:`, error);
      throw error;
    }
  }

  /**
   * 读取数据
   */
  async get<T extends StoreValue>(key: StoreKey): Promise<T | null> {
    const fullKey = this.prefix + key;
    try {
      const serialized = localStorage.getItem(fullKey);
      if (!serialized) return null;
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error(`[Store] Failed to get ${fullKey}:`, error);
      return null;
    }
  }

  /**
   * 删除数据
   */
  async delete(key: StoreKey): Promise<void> {
    const fullKey = this.prefix + key;
    try {
      localStorage.removeItem(fullKey);
      console.log(`[Store] Deleted ${fullKey}`);
    } catch (error) {
      console.error(`[Store] Failed to delete ${fullKey}:`, error);
      throw error;
    }
  }

  /**
   * 查询数据
   */
  async query<T extends StoreValue>(
    pattern: string,
    options?: StoreQueryOptions
  ): Promise<T[]> {
    const results: T[] = [];
    const regex = new RegExp(`^${this.prefix}${pattern.replace(/\*/g, '.*')}$`);

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && regex.test(key)) {
          const value = await this.get(key.replace(this.prefix, '') as StoreKey);
          if (value) {
            results.push(value as T);
          }
        }
      }

      // 排序
      if (options?.sortBy) {
        const sortKey = options.sortBy;
        const order = options.sortOrder === 'desc' ? -1 : 1;
        results.sort((a, b) => {
          const aVal = (a as any)[sortKey] || 0;
          const bVal = (b as any)[sortKey] || 0;
          return (aVal - bVal) * order;
        });
      }

      // 分页
      if (options?.offset) {
        results.splice(0, options.offset);
      }
      if (options?.limit) {
        results.splice(options.limit);
      }

      return results;
    } catch (error) {
      console.error(`[Store] Failed to query ${pattern}:`, error);
      return [];
    }
  }

  /**
   * 清空存储
   */
  async clear(): Promise<void> {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      console.log(`[Store] Cleared all data with prefix ${this.prefix}`);
    } catch (error) {
      console.error(`[Store] Failed to clear:`, error);
      throw error;
    }
  }
}

/**
 * 内存存储实现（用于测试或临时存储）
 */
export class MemoryStore implements IStore {
  private store = new Map<string, StoreValue>();

  isAvailable(): boolean {
    return true;
  }

  async set<T extends StoreValue>(key: StoreKey, value: T): Promise<void> {
    this.store.set(key, value);
    console.log(`[MemoryStore] Set ${key}`);
  }

  async get<T extends StoreValue>(key: StoreKey): Promise<T | null> {
    return (this.store.get(key) as T) || null;
  }

  async delete(key: StoreKey): Promise<void> {
    this.store.delete(key);
    console.log(`[MemoryStore] Deleted ${key}`);
  }

  async query<T extends StoreValue>(
    pattern: string,
    options?: StoreQueryOptions
  ): Promise<T[]> {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    const results: T[] = [];

    for (const [key, value] of this.store.entries()) {
      if (regex.test(key)) {
        results.push(value as T);
      }
    }

    // 排序和分页逻辑与 BrowserStore 类似
    if (options?.sortBy) {
      const sortKey = options.sortBy;
      const order = options.sortOrder === 'desc' ? -1 : 1;
      results.sort((a, b) => {
        const aVal = (a as any)[sortKey] || 0;
        const bVal = (b as any)[sortKey] || 0;
        return (aVal - bVal) * order;
      });
    }

    if (options?.offset) results.splice(0, options.offset);
    if (options?.limit) results.splice(options.limit);

    return results;
  }

  async clear(): Promise<void> {
    this.store.clear();
    console.log('[MemoryStore] Cleared all data');
  }
}

/**
 * 创建默认存储实例
 */
export function createStore(): IStore {
  return typeof localStorage !== 'undefined' ? new BrowserStore() : new MemoryStore();
}
