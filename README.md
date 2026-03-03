# Chat Export Toolkit

A growing toolkit for exporting chat histories from AI chat websites into LLM-friendly formats.

## Goals

- Export conversations from multiple AI chat platforms
- Produce clean, structured Markdown and JSON outputs
- Preserve code blocks, links, and optional reasoning traces
- Support batch export and resume/retry workflows

## Current Support

- Tencent Yuanbao (Tampermonkey userscript)

## Planned Platforms

- ChatGPT
- Claude
- Gemini
- Poe
- Kimi
- Others (PRs welcome)

## Output Format

Each export is designed to be ingestion-friendly for tools like OpenClaw and other LLM pipelines:

- Stable role tags (`User`, `Assistant`)
- Turn-based structure (`Turn N`)
- YAML metadata header
- Optional chunking for long messages
- Markdown + JSON dual output

## Structure

- `userscripts/` - Browser userscripts by platform
- `docs/` - Format specs and mapping notes (future)

## License

MIT
