#!/bin/bash
# DeepSeek 样本脱敏脚本
# 用法：bash fixtures/deepseek/sanitize.sh

set -e

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
RAW_DIR="$BASE_DIR/raw"

echo "🔒 开始脱敏 DeepSeek 样本..."

# 脱敏 JSON 文件
echo "📄 脱敏 JSON 文件..."
for file in "$RAW_DIR"/*.json; do
  if [ -f "$file" ]; then
    echo "   处理：$(basename "$file")"
    jq '
      .conversationId = "[CONVERSATION_ID]" |
      .userId = "[USER_ID]" |
      .sessionId = "[SESSION_ID]" |
      (.messages // []) |= map(
        .id = "[MESSAGE_ID]" |
        if .content and (.content | type) == "string" then
          .content = "[MESSAGE_CONTENT]"
        elif .content and (.content | type) == "array" then
          .content |= map(if .msg then .msg = "[MESSAGE_CONTENT]" else . end)
        else .
        end
      ) |
      (.conversations // []) |= map(
        .conversationId = "[CONVERSATION_ID]" |
        .title = "[CONVERSATION_TITLE]"
      )
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  fi
done

# 脱敏 cURL 文件（如存在）
echo "📄 脱敏 cURL 文件..."
for file in "$RAW_DIR"/*.curl; do
  if [ -f "$file" ]; then
    echo "   处理：$(basename "$file")"
    sed -i '' 's/Cookie: [^"]*/Cookie: [REDACTED]/g' "$file"
    sed -i '' 's/Authorization: [^"]*/Authorization: [REDACTED]/g' "$file"
    sed -i '' 's/X-Token: [^"]*/X-Token: [REDACTED]/g' "$file"
    sed -i '' 's/X-API-Key: [^"]*/X-API-Key: [REDACTED]/g' "$file"
  fi
done

echo ""
echo "✅ 脱敏完成！"
echo ""
echo "📋 请手动检查以下内容："
echo "   1. 确认无真实对话内容泄露"
echo "   2. 确认无个人身份信息泄露"
echo "   3. 运行：git diff fixtures/deepseek/raw/"
echo ""
