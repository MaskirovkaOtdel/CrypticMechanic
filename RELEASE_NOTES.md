# Release Notes — CrypticMechanic v1.2.0

## Milestone Overview

**CrypticMechanic v1.2.0** elevates developer troubleshooting workflows with powerful local data management, enhanced model filtering, and an upgraded intelligence pipeline. This release empowers engineers to search through past error diagnostics instantly, organize logs by model, and cleanly export/import history backups without relying on external cloud storage.

---

## What's New in v1.2.0

### 1. Full-Text History Search & Multi-Criteria Filtering
- **Real-Time Log Search**: Instantly query your diagnostic history across error logs, AI solutions, and model names.
- **Dynamic Model Filter Chips**: Filter entries by model tier (`All`, `3 Flash`, `3 Pro`, `2.5 Flash`, etc.) with live result counts that adapt dynamically as you type.
- **Enhanced Empty States**: Clean feedback when filters yield zero matches, with quick one-click search clearing.

### 2. Portable Local JSON Backup & Restore
- **Export History as JSON**: Export your complete diagnostic history into a portable, timestamped JSON backup (`crypticmechanic-history-YYYY-MM-DD.json`) with one click.
- **Schema-Validated Import**: Restore past diagnostic sessions from JSON backups with automatic schema validation and deduplication against existing records.
- **Zero Cloud Dependence**: Full data sovereignty — your API keys, logs, and historical queries stay strictly on your local machine.

### 3. Upgraded Gemini 3 Intelligence Engine
- **Gemini 3 Integration**: Out-of-the-box support for Google's newest reasoning architectures (`gemini-3-flash` and `gemini-3-pro`).
- **Real-Time Token Streaming**: Immediate visual feedback with live token generation and streaming cursor indicators.

### 4. Polyglot Developer Presets & One-Click GitHub Issue Export
- **9 Polyglot Presets**: One-click reproduction samples across Kubernetes (OOMKilled), Go (runtime nil pointer), Rust (borrow checker), Spring Boot (bean creation), C++ (segmentation fault), and more.
- **One-Click GitHub Issue Export**: Format any diagnostic session into a ready-to-paste markdown bug report featuring collapsible error logs, system telemetry, and structured reproduction steps.
- **Interactive Checklists & Actionable Fixes**: Markdown checklists and copyable command blocks with real-time clipboard feedback.

---

## Upgrade Guide

No migration or configuration changes are required. Existing `localStorage` diagnostic histories are automatically preserved and compatible with the new search and filtering features.

To update:
```bash
git pull origin dev
npm install
npm run build
```
