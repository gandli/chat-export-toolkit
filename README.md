# Chat Export Toolkit

A Tampermonkey userscript for exporting **Tencent Yuanbao** (腾讯元宝) conversations into structured, ingestion-friendly files.

## Features

- **Multiple Export Formats** - Markdown, JSON, and DOCX
- **Flexible Scope** - Export single conversation or all conversations at once
- **Quick Copy** - Copy current conversation to clipboard (MD/JSON)
- **Progress Tracking** - Real-time progress bar for bulk exports
- **Reliable API Handling** - Multiple fallback strategies for full-history export

## Export Actions

| Scope | Actions | Formats |
|-------|---------|---------|
| **Current Conversation** | Save, Copy | MD, JSON, DOCX |
| **All Conversations** | Export | MD, JSON, DOCX |

> **Note:** Copy action for current conversation supports MD and JSON only.

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Open `userscripts/chat-export.user.js` from this repository
3. Click "Raw" to install the script
4. Visit [Tencent Yuanbao](https://yuanbao.tencent.com/) and look for the export button

## How It Works

**All Conversations Export** automatically:
1. Fetches conversation list via API (with pagination support)
2. Retrieves each conversation's detailed content
3. Merges and exports as your chosen format

The script uses in-memory caching for performance and supports multiple API shapes (GET/POST + DOM fallback) to ensure reliability.

## Design Philosophy

This toolkit focuses exclusively on **export functionality**. Non-essential features like style toggles, extra menu commands, and complex UI are intentionally omitted to keep the script lightweight and maintainable.

## Files

```
userscripts/
└── chat-export.user.js    # Main Tampermonkey userscript
```

## License

MIT