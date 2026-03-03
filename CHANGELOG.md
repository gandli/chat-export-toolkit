# Changelog

All notable changes to this project will be documented in this file.

The project adheres to [Semantic Versioning](https://semver.org/).

## [0.5.1] - 2026-03-04

### Optimized

- **Major UI/UX Upgrade**:
  - Introduced a new brand color palette (Green, Black, Gray, White).
  - Refactored the styling system using CSS variables for better maintainability.
  - Added a scale-up animation (`pop-in`) for the main panel.
  - Redesigned Toast notifications with a frosted glass effect.
  - Enhanced micro-interactions for segmented controllers and buttons.
- **Documentation Improvements**:
  - Added `CHANGELOG.md`.
  - Added `docs/PRD.md`.
  - Optimized `README.md`.

## [0.5.0] - 2026-03-03

### Added

- **Multi-format Export**: Support for exporting current or all conversations to Markdown, JSON, and DOCX formats.
- **Batch Export**: Support for full historical conversation fetching and packaging into a ZIP file.
- **Quick Copy**: One-click copying of the current conversation to the clipboard.
- **Background Acceleration**: Automatic silent fetching and caching of conversation lists upon page load.
- **Cross-platform Compatibility**: Adapted to various Yuanbao API response formats and DOM fallbacks.

## [0.1.0] - 2026-02-xx

### Initial

- Core logic for packet capturing and conversation-to-Markdown conversion implemented.
