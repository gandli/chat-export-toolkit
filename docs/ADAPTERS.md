# Chat Export Toolkit V2 - 适配器开发指南

## 1. 什么是适配器

适配器是 Chat Export Toolkit 支持多站点的核心机制。每个 AI 对话网站需要一个对应的适配器，负责：

- 拦截该站点的 API 请求
- 解析站点特定的数据结构
- 转换为统一数据模型
- 提供统一的导出接口

---

## 2. 适配器接口

### 完整接口定义

```typescript
// src/types/adapter.ts

import { Conversation, ConversationMeta, ExportResult } from './conversation';

export type Capability = 'L1' | 'L2' | 'L3';

export interface Adapter {
  // 基本信息
  readonly name: string;              // 适配器名称（如 "腾讯元宝"）
  readonly domain: string | string[]; // 匹配的域名（如 "yuanbao.tencent.com"）
  readonly capabilities: Capability[]; // 支持的能力等级
  
  // 生命周期
  init(): Promise<void>;              // 初始化（可选）
  destroy(): void;                    // 清理资源（可选）
  
  // 数据获取
  getCurrentConversation(): Promise<Conversation | null>;
  getAllConversations(): Promise<ConversationMeta[]>;
  getConversationDetail(id: string): Promise<Conversation>;
  
  // 导出
  export(conversation: Conversation, format: 'md' | 'json' | 'docx'): Promise<ExportResult>;
  
  // 站点特定方法（可选）
  getApiEndpoints?(): Promise<ApiEndpoints>;
  refreshSession?(): Promise<void>;
}

export interface ApiEndpoints {
  detail: string;  // 会话详情 API
  list: string;    // 会话列表 API
}
```

### 最小实现（L1 能力）

如果只实现基础导出，至少需要：

```typescript
class MinimalAdapter implements Adapter {
  name = '示例站点';
  domain = 'example.com';
  capabilities = ['L1'];
  
  async getCurrentConversation(): Promise<Conversation | null> {
    // 返回当前页面的对话
  }
  
  async getAllConversations(): Promise<ConversationMeta[]> {
    // 返回空数组（L1 不要求批量导出）
    return [];
  }
  
  async getConversationDetail(id: string): Promise<Conversation> {
    throw new Error('L1 不支持获取历史对话');
  }
  
  async export(conv: Conversation, format: 'md' | 'json' | 'docx'): Promise<ExportResult> {
    // 调用统一导出器
  }
  
  init() { return Promise.resolve(); }
  destroy() {}
}
```

---

## 3. 开发步骤

### 步骤 1：分析目标站点

**任务**：了解站点的 API 结构和数据格式

**方法**：

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 刷新页面或发送消息
4. 查找对话相关的 API 请求

**关注点**：

- API 端点 URL 模式（如 `/api/conversation/detail`）
- 请求方法（GET/POST）
- 请求参数（如 `conversationId`）
- 响应结构（JSON 字段）
- 认证方式（Cookie/Token）

**示例**（腾讯元宝）：

```
请求 URL: POST /api/user/agent/conversation/v2/detail
请求参数: { "conversationId": "abc123" }
响应结构:
{
  "conversationId": "abc123",
  "sessionTitle": "会话标题",
  "convs": [
    {
      "speaker": "user",
      "index": 1,
      "speechesV2": [
        {
          "content": [
            { "type": "text", "msg": "用户消息内容" }
          ]
        }
      ]
    }
  ]
}
```

### 步骤 2：创建适配器目录

```bash
mkdir -p src/adapters/<site-name>
```

目录结构：

```
src/adapters/<site-name>/
├── adapter.ts      # 适配器主实现
├── parser.ts       # 数据解析器
├── api.ts          # API 端点定义（可选）
├── types.ts        # 站点特定类型（可选）
└── __fixtures__/   # 测试数据（可选）
    └── detail-response.json
```

### 步骤 3：实现 Parser

Parser 负责将站点特定数据结构转换为统一模型。

```typescript
// src/adapters/<site-name>/parser.ts

import { Conversation, Message, ConversationMeta } from '../../types';

export class SiteParser {
  // 解析单个对话详情
  parseDetail(raw: any): Conversation {
    return {
      id: raw.conversationId || raw.id,
      title: raw.sessionTitle || raw.title || '未命名会话',
      createdAt: raw.createTime ? this.parseTimestamp(raw.createTime) : undefined,
      messages: this.parseMessages(raw.convs || raw.messages || []),
      metadata: raw, // 保留原始数据
    };
  }
  
  // 解析对话列表
  parseList(raw: any): ConversationMeta[] {
    const items = raw.conversations || raw.data || raw.result || [];
    return items.map((item: any) => ({
      id: item.conversationId || item.id,
      title: item.title || item.sessionTitle || '未命名会话',
      createdAt: item.createTime ? this.parseTimestamp(item.createTime) : undefined,
    }));
  }
  
  // 解析消息列表
  private parseMessages(rawMessages: any[]): Message[] {
    return rawMessages.map((turn, index) => {
      const speaker = String(turn.speaker || '').toLowerCase();
      const role = speaker === 'ai' ? 'assistant' : speaker === 'user' ? 'user' : 'assistant';
      
      // 提取消息内容（根据站点结构调整）
      const content = this.extractContent(turn);
      
      return {
        id: turn.id || `${index}`,
        role,
        content,
        createdAt: turn.createTime ? this.parseTimestamp(turn.createTime) : undefined,
        metadata: {
          index: turn.index,
          speechesV2: turn.speechesV2, // 保留原始数据
        },
      };
    });
  }
  
  // 提取消息内容（根据站点结构调整）
  private extractContent(turn: any): string {
    const speeches = turn.speechesV2 || [];
    const blocks: string[] = [];
    
    for (const speech of speeches) {
      const content = speech.content || [];
      for (const block of content) {
        if (block.type === 'text') {
          blocks.push(block.msg || '');
        } else if (block.type === 'think') {
          blocks.push(`> [思考] ${block.title || ''}\n> ${block.content || ''}`);
        }
      }
    }
    
    return blocks.join('\n\n');
  }
  
  // 解析时间戳（处理不同格式）
  private parseTimestamp(ts: any): number {
    if (typeof ts === 'number') {
      // 毫秒或秒
      return ts < 1e12 ? ts * 1000 : ts;
    }
    return new Date(ts).getTime();
  }
}
```

### 步骤 4：实现 Adapter

```typescript
// src/adapters/<site-name>/adapter.ts

import { Adapter, Conversation, ConversationMeta, ExportResult } from '../../types';
import { SiteParser } from './parser';
import { MarkdownExporter, JsonExporter, DocxExporter } from '../../exporters';

export class SiteAdapter implements Adapter {
  readonly name = '示例站点';
  readonly domain = ['example.com', 'www.example.com'];
  readonly capabilities = ['L1', 'L2'];
  
  private parser = new SiteParser();
  private apiEndpoints: { detail?: string; list?: string } = {};
  
  async init(): Promise<void> {
    // 可选：动态发现 API 端点
    await this.discoverApiEndpoints();
  }
  
  destroy(): void {
    // 可选：清理资源
  }
  
  async getCurrentConversation(): Promise<Conversation | null> {
    // 方法 1：从拦截的 API 响应中获取（推荐）
    // 在拦截器中调用 handleResponse() 缓存当前对话
    
    // 方法 2：从页面 DOM 解析（降级方案）
    return this.parseCurrentFromDom();
  }
  
  async getAllConversations(): Promise<ConversationMeta[]> {
    if (!this.apiEndpoints.list) {
      throw new Error('列表 API 端点未配置');
    }
    
    const all: ConversationMeta[] = [];
    let page = 1;
    
    while (true) {
      const response = await fetch(this.apiEndpoints.list, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, pageSize: 50 }),
      });
      
      if (!response.ok) break;
      
      const json = await response.json();
      const metas = this.parser.parseList(json);
      
      if (metas.length === 0) break;
      
      all.push(...metas);
      page += 1;
      
      // 防止无限循环
      if (page > 100) break;
    }
    
    return all;
  }
  
  async getConversationDetail(id: string): Promise<Conversation> {
    if (!this.apiEndpoints.detail) {
      throw new Error('详情 API 端点未配置');
    }
    
    const response = await fetch(this.apiEndpoints.detail, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: id }),
    });
    
    if (!response.ok) {
      throw new Error(`获取对话详情失败：${response.status}`);
    }
    
    const json = await response.json();
    return this.parser.parseDetail(json);
  }
  
  async export(
    conversation: Conversation,
    format: 'md' | 'json' | 'docx'
  ): Promise<ExportResult> {
    let content: string | Blob;
    const filename = this.buildFilename(conversation, format);
    
    switch (format) {
      case 'md':
        content = await new MarkdownExporter().export(conversation);
        break;
      case 'json':
        content = await new JsonExporter().export(conversation);
        break;
      case 'docx':
        content = await new DocxExporter().export(conversation);
        break;
    }
    
    return {
      conversationId: conversation.id,
      format,
      content,
      filename,
      exportedAt: new Date().toISOString(),
    };
  }
  
  // 动态发现 API 端点（可选）
  private async discoverApiEndpoints(): Promise<void> {
    // 方法 1：从页面 JS 资源中提取
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    for (const script of scripts) {
      try {
        const response = await fetch(script.src);
        const text = await response.text();
        
        // 使用正则提取 API 端点
        const detailMatch = text.match(/["']\/api\/[^"']*conversation[^"']*detail["']/gi);
        const listMatch = text.match(/["']\/api\/[^"']*conversation[^"']*list["']/gi);
        
        if (detailMatch) {
          this.apiEndpoints.detail = detailMatch[0].replace(/["']/g, '');
        }
        if (listMatch) {
          this.apiEndpoints.list = listMatch[0].replace(/["']/g, '');
        }
      } catch {
        // 忽略错误
      }
    }
    
    // 方法 2：使用已知端点列表探测
    if (!this.apiEndpoints.detail) {
      this.apiEndpoints.detail = await this.probeDetailApi();
    }
    if (!this.apiEndpoints.list) {
      this.apiEndpoints.list = await this.probeListApi();
    }
  }
  
  // 探测详情 API（回退方案）
  private async probeDetailApi(): Promise<string> {
    const candidates = [
      '/api/conversation/v2/detail',
      '/api/conversation/v1/detail',
      '/api/conversation/detail',
    ];
    
    for (const endpoint of candidates) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: 'probe' }),
          signal: AbortSignal.timeout(3000),
        });
        
        // 404 表示端点不存在，其他状态表示可能存在
        if (response.status !== 404) {
          return endpoint;
        }
      } catch {
        continue;
      }
    }
    
    return candidates[0]; // 默认回退
  }
  
  // 探测列表 API（回退方案）
  private async probeListApi(): Promise<string> {
    const candidates = [
      '/api/conversation/v2/list',
      '/api/conversation/v1/list',
      '/api/conversation/list',
    ];
    
    for (const endpoint of candidates) {
      try {
        const response = await fetch(`${endpoint}?page=1&pageSize=1`, {
          signal: AbortSignal.timeout(3000),
        });
        
        if (response.status !== 404) {
          return endpoint;
        }
      } catch {
        continue;
      }
    }
    
    return candidates[0]; // 默认回退
  }
  
  // 从 DOM 解析当前对话（降级方案）
  private parseCurrentFromDom(): Conversation | null {
    // 根据站点 DOM 结构解析
    // 这是最后的手段，优先使用 API 拦截
    return null;
  }
  
  // 构建导出文件名
  private buildFilename(conv: Conversation, format: string): string {
    const safeTitle = conv.title.replace(/[\/\\?%*:|"<>]/g, '-');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return `${safeTitle}_${timestamp}.${format}`;
  }
}
```

### 步骤 5：注册适配器

在入口文件中注册新适配器：

```typescript
// src/index.ts

import { AdapterRegistry } from './core/adapter-registry';
import { YuanbaoAdapter } from './adapters/yuanbao/adapter';
import { KimiAdapter } from './adapters/kimi/adapter';
import { SiteAdapter } from './adapters/<site-name>/adapter';

// 创建注册表
const registry = new AdapterRegistry();

// 注册适配器
registry.register(new YuanbaoAdapter());
registry.register(new KimiAdapter());
registry.register(new SiteAdapter());

// 根据当前域名自动选择适配器
const currentAdapter = registry.match(window.location.hostname);
if (currentAdapter) {
  await currentAdapter.init();
  // 启动拦截器等
}
```

### 步骤 6：编写测试

```typescript
// src/adapters/<site-name>/parser.test.ts

import { describe, it, expect } from 'vitest';
import { SiteParser } from './parser';
import mockResponse from './__fixtures__/detail-response.json';

describe('SiteParser', () => {
  const parser = new SiteParser();
  
  it('should parse detail response', () => {
    const result = parser.parseDetail(mockResponse);
    
    expect(result.id).toBe('test-id');
    expect(result.title).toBe('测试会话');
    expect(result.messages).toHaveLength(4);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content).toContain('用户消息');
  });
  
  it('should parse list response', () => {
    const listMock = {
      conversations: [
        { id: '1', title: '会话 1', createTime: 1700000000000 },
        { id: '2', title: '会话 2', createTime: 1700000001000 },
      ],
    };
    
    const result = parser.parseList(listMock);
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });
});
```

### 步骤 7：测试验证

**手动测试清单**：

- [ ] 在目标站点打开开发者工具
- [ ] 确认拦截器捕获到 API 请求
- [ ] 单会话导出（MD/JSON/DOCX）
- [ ] 批量导出（ZIP）
- [ ] 导出文件内容正确
- [ ] UI 显示正常
- [ ] 无控制台错误

---

## 4. 站点适配清单

### 已实现

| 站点 | 适配器 | 能力 | 状态 |
|------|--------|------|------|
| 腾讯元宝 | `YuanbaoAdapter` | L2 | ✅ 完成 |

### 待实现（优先级）

| 站点 | 优先级 | 难度 | 备注 |
|------|--------|------|------|
| Kimi | 高 | 中 | 月之暗面 |
| 智谱清言 | 高 | 中 | 智谱 AI |
| 文心一言 | 中 | 中 | 百度 |
| 通义千问 | 中 | 中 | 阿里 |
| ChatGPT | 低 | 高 | 需要处理认证 |
| Claude | 低 | 高 | 需要处理认证 |

---

## 5. 常见问题

### Q: 如何找到站点的 API 端点？

A: 三种方法：

1. **开发者工具**：F12 → Network → 筛选 XHR/Fetch → 查找对话相关请求
2. **页面源码**：搜索 `/api/` 或 `conversation` 关键词
3. **动态探测**：实现 `probeDetailApi()` 方法自动探测

### Q: 站点使用 WebSocket 怎么办？

A: 拦截 WebSocket 消息：

```typescript
const originalWebSocket = window.WebSocket;
window.WebSocket = function (url, protocols) {
  const ws = new originalWebSocket(url, protocols);
  
  ws.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      // 处理对话数据
    } catch {
      // 非 JSON 数据
    }
  });
  
  return ws;
};
```

### Q: 站点有反爬机制怎么办？

A: 缓解措施：

- 添加请求延迟（`setTimeout`）
- 限制并发数（最多 5 个同时请求）
- 实现指数退避重试
- 使用 DOM 解析作为降级方案

### Q: 如何处理图片/附件？

A: L3 能力，建议：

1. 在 `Message.metadata.attachments` 中记录附件信息
2. 导出时下载附件并打包到 ZIP
3. Markdown 中使用相对路径引用附件

### Q: 适配器如何获取认证信息？

A: 原则：**不主动获取认证信息**

- 依赖浏览器的 Cookie 自动携带
- 不存储 Token 到本地
- 认证过期时提示用户重新登录

---

## 6. 最佳实践

### 代码组织

- 每个适配器独立目录，互不干扰
- Parser 和 Adapter 分离，便于测试
- 使用 TypeScript 严格模式

### 错误处理

- 所有网络请求添加 `try/catch`
- 提供友好的错误提示
- 实现降级方案（API 失败 → DOM 解析）

### 性能优化

- 批量导出限制并发数
- 大对话分块处理
- 使用缓存避免重复请求

### 测试

- 保存真实 API 响应作为测试数据
- 单元测试覆盖核心解析逻辑
- 手动测试每个站点

---

## 7. 提交新适配器

贡献新适配器的步骤：

1. Fork 仓库
2. 创建分支：`git checkout -b adapter/<site-name>`
3. 实现适配器（参考本文档）
4. 编写测试
5. 手动测试验证
6. 提交 PR，描述：
   - 站点名称
   - 支持的能力（L1/L2/L3）
   - 测试截图
   - 已知限制

---

## 8. 参考资源

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构文档
- [MIGRATION.md](./MIGRATION.md) - 迁移指南
- [统一数据模型](./ARCHITECTURE.md#3-统一数据模型)
- [src/adapters/yuanbao/](../src/adapters/yuanbao/) - 腾讯元宝适配器示例
