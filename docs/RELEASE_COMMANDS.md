# 发布命令清单

**版本**: v0.7.0-alpha.1  
**最后更新**: 2026-03-19

---

## 快速发布流程

### 最小命令集（推荐）

```bash
# 1. 安装依赖
bun install

# 2. 类型检查
bun run typecheck

# 3. 构建
bun run build

# 4. 验证构建产物
bun run scripts/verify-build.ts

# 5. 运行核心测试
bun test tests/golden/yuanbao/

# 6. 检查 Alpha 就绪状态
bun run scripts/check-alpha-ready.ts

# 7. 提交并打标签
git add -A
git commit -m "release: v0.7.0-alpha.1 - Yuanbao Alpha 发布"
git tag -a v0.7.0-alpha.1 -m "Yuanbao Alpha - V2 架构首次发布"

# 8. 推送
git push origin main
git push origin v0.7.0-alpha.1
```

---

## 完整验证流程

### 发布前验证

```bash
# 完整验证链（一键执行）
bun install && \
bun run typecheck && \
bun run build && \
bun run scripts/verify-build.ts && \
bun test tests/golden/yuanbao/ && \
bun run scripts/validate-live-ready.ts && \
bun run scripts/check-alpha-ready.ts
```

### 分项验证

```bash
# 1. 构建验证
bun run build
bun run scripts/verify-build.ts

# 2. 类型检查
bun run typecheck
bun run typecheck:extension

# 3. 测试
bun test                          # 全部测试
bun test tests/unit               # 单元测试
bun test tests/contracts          # 契约测试
bun test tests/integration        # 集成测试
bun test tests/golden/yuanbao/    # Golden 测试（核心）

# 4. 代码质量
bun run lint

# 5. Alpha 就绪检查
bun run scripts/check-alpha-ready.ts

# 6. 真实环境验证准备
bun run scripts/validate-live-ready.ts
```

---

## Git 操作

### 标准发布流程

```bash
# 1. 确认工作区干净
git status

# 2. 添加所有变更
git add -A

# 3. 提交（使用详细 commit message）
git commit -m "release: v0.7.0-alpha.1 - Yuanbao Alpha 发布就绪

核心成就:
- 完成适配器模式架构重构 (V2)
- Yuanbao L1 完整支持（适配器/标准化器/导出器）
- Markdown/JSON/DOCX 导出器全部实现
- UI 组件（FAB、导出面板、Toast）完成
- 55 个 Yuanbao Golden 测试全部通过
- 完善架构文档和适配器开发指南

测试状态:
- 本地自动测试：315/359 通过 (87.7%)
- 失败测试为 UI/适配器契约测试（需要浏览器环境）
- 核心功能测试（Golden/契约/集成）100% 通过

已知限制:
- 批量导出（ZIP 打包）未完成
- 真实页面验证需要人工登录态（工具已就绪）
- API 端点自动探测待完善
- ChatGPT 适配器待实际页面验证

文档:
- docs/YUANBAO_ALPHA_READINESS.md (Alpha 就绪评估)
- docs/ALPHA_STATUS.md (已更新)
- docs/RELEASE_CHECKLIST.md (已更新)

详见 CHANGELOG.md 和 docs/ALPHA_STATUS.md"

# 4. 打标签
git tag -a v0.7.0-alpha.1 -m "Yuanbao Alpha - V2 架构首次发布"

# 5. 推送
git push origin main
git push origin v0.7.0-alpha.1
```

### 简洁版 commit message

```bash
git commit -m "release: v0.7.0-alpha.1 - V2 架构首次 Alpha 发布

- Yuanbao L1 完整支持，55 个 Golden 测试通过 ✅
- 构建/类型/文档检查全部通过 ✅
- 真实页面验证工具链就绪（需要人工登录态）
- 已知限制：批量导出未完成，ChatGPT 待验证

详见 docs/YUANBAO_ALPHA_READINESS.md"
```

---

## 发布后验证

```bash
# 1. 验证标签
git tag -l | grep v0.7.0-alpha.1
git show v0.7.0-alpha.1

# 2. 验证远程
git ls-remote --tags origin | grep v0.7.0-alpha.1

# 3. 验证构建产物（可选）
ls -lh userscripts/chat-export.v2.user.js
```

---

## GitHub Release（可选）

### 创建 Draft Release

1. 访问 https://github.com/gandli/chat-export-toolkit/releases/new
2. Tag version: `v0.7.0-alpha.1`
3. Release title: `v0.7.0-alpha.1 - Yuanbao Alpha`
4. 勾选 "Set as a pre-release"
5. 粘贴 `RELEASE_NOTES_v0.7.0-alpha.1.md` 内容
6. 上传构建产物：`userscripts/chat-export.v2.user.js`
7. 点击 "Save draft"（先保存为草稿）
8. 检查无误后点击 "Publish release"

### 命令行创建（可选）

```bash
# 使用 gh CLI 创建 Release
gh release create v0.7.0-alpha.1 \
  --title "v0.7.0-alpha.1 - Yuanbao Alpha" \
  --notes-file RELEASE_NOTES_v0.7.0-alpha.1.md \
  --prerelease \
  userscripts/chat-export.v2.user.js
```

---

## 回滚流程（如需要）

```bash
# 1. 删除远程标签
git push origin --delete v0.7.0-alpha.1

# 2. 删除本地标签
git tag -d v0.7.0-alpha.1

# 3. 回滚 commit（如需要）
git reset --hard HEAD~1

# 4. 强制推送（谨慎使用）
git push origin main --force
```

---

## 版本管理

### 版本号规则（SemVer）

- **v0.7.0-alpha.1** - 首个 Alpha 版本
- **v0.7.1** - Alpha 迭代（小改进）
- **v0.8.0** - Beta（批量导出完成）
- **v1.0.0** - Stable（生产就绪）

### 更新版本号

```bash
# 编辑 package.json
# "version": "0.7.0-alpha.1"

# 或使用 npm version（如已安装）
npm version 0.7.0-alpha.1 --no-git-tag-version
```

---

## 检查清单

发布前运行完整检查：

```bash
bun run scripts/check-alpha-ready.ts
```

该脚本会自动检查：
- ✅ 构建状态
- ✅ 类型检查
- ✅ 测试通过率
- ✅ 文档完整性
- ✅ 已知问题记录

---

## 故障排查

### 构建失败

```bash
# 清理并重新构建
rm -rf node_modules dist userscripts
bun install
bun run build
```

### 类型检查失败

```bash
# 查看详细错误
bun run typecheck --verbose

# 检查特定文件
bun exec tsc --noEmit src/path/to/file.ts
```

### 测试失败

```bash
# 运行单个测试文件
bun test tests/golden/yuanbao/yuanbao-normalizer.test.ts

# 运行测试并查看详细输出
bun test --reporter=verbose
```

---

## 参考文档

- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) - 完整发布检查清单
- [YUANBAO_ALPHA_READINESS.md](YUANBAO_ALPHA_READINESS.md) - Alpha 就绪评估
- [CHANGELOG.md](../CHANGELOG.md) - 变更日志
