# 测试目录说明

## 目录结构

```
tests/
├── unit/              # 单元测试
│   └── ui-components.test.ts
├── contracts/         # 契约测试
│   └── schema-contracts.test.ts
├── golden/            # Golden 测试
│   ├── json/
│   │   └── with-metadata.json
│   └── json-exporter.test.ts
├── integration/       # 集成测试
│   └── export-flow.test.ts
└── helpers/           # 测试辅助工具
    └── factories.ts
```

## 各目录职责

### unit/ - 单元测试

测试单个函数、类或模块的内部逻辑。

**现有测试：**
- `ui-components.test.ts` - UI 组件测试（从 src/ 移入）

**添加新测试：**
```bash
# 创建新的单元测试文件
touch tests/unit/normalizers/chatgpt.test.ts
```

### contracts/ - 契约测试

验证数据格式、接口签名、schema 兼容性。

**现有测试：**
- `schema-contracts.test.ts` - Conversation/Message schema 验证

**添加新测试：**
```bash
# 创建适配器契约测试
touch tests/contracts/yuanbao-adapter.test.ts
```

### golden/ - Golden 测试

对比预期输出，防止回归。

**现有测试：**
- `json-exporter.test.ts` - JSON 导出器输出验证
- `json/with-metadata.json` - Golden 文件

**添加新测试：**
```bash
# 创建 Markdown 导出器 golden 测试
touch tests/golden/markdown-exporter.test.ts

# 创建 golden 文件目录
mkdir -p tests/golden/markdown
```

**更新 golden 文件：**
当预期输出变更时，手动更新对应的 golden 文件。

### integration/ - 集成测试

测试模块间协作和端到端流程。

**现有测试：**
- `export-flow.test.ts` - 完整导出流程测试

**添加新测试：**
```bash
# 创建适配器到导出器的集成测试
touch tests/integration/adapter-to-exporter.test.ts
```

### helpers/ - 测试辅助

测试工厂函数、mock 数据生成器等。

**现有工具：**
- `factories.ts` - 测试数据工厂

## 运行测试

```bash
# 运行所有测试
bun test

# 运行特定类型测试
bun test:unit          # 单元测试
bun test:contracts     # 契约测试
bun test:integration   # 集成测试

# 运行单个测试文件
bun vitest run tests/unit/ui-components.test.ts

# 监视模式
bun test:watch

# 生成覆盖率
bun test:coverage
```

## 添加新测试的步骤

1. **确定测试类型**
   - 单元测试 → `tests/unit/`
   - 契约测试 → `tests/contracts/`
   - Golden 测试 → `tests/golden/`
   - 集成测试 → `tests/integration/`

2. **创建测试文件**
   ```bash
   touch tests/unit/模块名.test.ts
   ```

3. **编写测试**
   ```typescript
   import { describe, it, expect } from 'vitest';
   
   describe('模块名', () => {
     it('应该...', () => {
       // Arrange
       // Act
       // Assert
     });
   });
   ```

4. **运行验证**
   ```bash
   bun vitest run tests/unit/模块名.test.ts
   ```

## 测试数据

测试数据放在 `fixtures/` 目录：

```
fixtures/
├── samples/           # 各平台示例数据
├── edge-cases/        # 边界情况数据
└── *.json             # 通用测试数据
```

Golden 文件放在 `tests/golden/` 目录。

## 测试规范

- 使用中文描述测试行为
- 每个测试只验证一个行为
- 使用 `createMessage()` / `createConversation()` 工厂函数创建测试数据
- Golden 测试需要人工确认输出后更新文件
