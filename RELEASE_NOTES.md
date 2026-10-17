# Release Notes — CrypticMechanic

---

## CrypticMechanic v1.5.0

### Milestone Overview

**CrypticMechanic v1.5.0** delivers a major upgrade to the diagnostic intelligence pipeline, fully transitioning to a streamlined **Gemini 3** model architecture with `gemini-3.5-flash-lite` as the primary default. This release introduces automated local security hooks, seamless legacy default migration, fine-grained Thinking/Reasoning token budget controls, and comprehensive performance optimizations across terminal log processing and bundle execution.

---

### What's New in v1.5.0

#### 1. Streamlined Gemini 3 Model Catalogue & Verified Defaults
- **Curated Production Architecture**: Retains exclusively the latest verified model from each Google production tier, removing intermediate and deprecated endpoints:
  - `gemini-3.5-flash-lite` (**Default**): High-throughput, low-latency, and cost-effective engine for rapid daily error triage.
  - `gemini-3.8-flash`: High-performance diagnostic engine optimized for complex, subtle, and multi-file code defects.
  - `gemini-3.1-pro`: Premier deep-reasoning engine designed for massive stack traces and extensive architectural analysis.
  - `custom`: Dedicated input field supporting custom fine-tuned or experimental Gemini endpoints.
- **Dynamic Fallback Cascading**: Updated fallback waterfall prioritizing the latest Gemini 3 candidates when active endpoints return 404 or unavailable errors.

#### 2. Transparent Default Migration & Configuration Sanitization
- **Automatic Settings Migration**: Existing user configurations in `localStorage` referencing legacy (1.x, 2.x) or discontinued model identifiers are transparently migrated to `gemini-3.5-flash-lite` on initial application boot.
- **Cross-Provider Configuration Sanitization**: Local model strings (e.g. Ollama tags like `llama3:latest` or `deepseek-r1:8b`) inadvertently stored in cloud settings are sanitized and safely reset to defaults, preventing malformed cloud API dispatches.

#### 3. Thinking / Reasoning Level Selector
- **Granular Cognitive Budget Control**: Added an interactive segmented control in the Settings drawer to configure internal reasoning depth:
  - **Auto**: Dynamic runtime-adapted token budget (default).
  - **Low**: 1,024 reasoning tokens.
  - **Medium**: 4,096 reasoning tokens.
  - **High**: 8,192 reasoning tokens.
  - **Off**: 0 tokens (disables reasoning tokens for instant low-latency output).
- **Universal Provider Compatibility**: Fully wired into `@google/generative-ai` inference generation configs (`thinkingConfig: { thinkingBudget }`).

#### 4. Local Git Hooks & Pre-Stage Security Governance
- **Automated Local Hook Setup**: Implemented `.githooks/pre-commit` managed via `core.hooksPath = .githooks`.
- **Author Identity Validation**: Ensures commits match authorized repository maintainers (`MaskirovkaOtdel` / `thod.efstathiadis@gmail.com`).
- **Pre-Stage Leak Prevention**: Scans staged file diffs against sensitive patterns (`\.env`, `secret`, `credentials`, `license-key`, `id_rsa`, `\.pem`), immediately rejecting unauthorized stages.

#### 5. Terminal Log Processing & Performance Optimizations
- **Enhanced ANSI Stripper**: Strips 16/256/24-bit TrueColor sequences and OSC terminal control codes with zero memory leaks.
- **Noise Reduction & Frame Collapsing**: Automatically cleans container hashes, syslog timestamps, and collapses recursive stack trace repetitions, reducing token consumption while preserving critical root-cause context.
- **Optimized Bundles & PWA Shell**: Streamlined production asset bundles with offline service worker precaching.

---

## CrypticMechanic v1.4.1

### Milestone Overview

**CrypticMechanic v1.4.1** refines the AI engine architecture by streamlining the catalogue to strictly the latest model from each **Gemini 3** line, introducing an interactive **Thinking / Reasoning Level selector** for granular cognitive budget control across all models (including custom IDs), and modernizing project documentation.

---

### What's New in v1.4.1

#### 1. Streamlined Gemini 3 Lineup with 3.5 Flash Lite Default
- **Strict Latest-From-Each-Line Architecture**: Removed intermediate and deprecated model IDs (`gemini-3-flash`, `gemini-3.5-flash`, `gemini-3.5-pro`), retaining strictly the premier model from each Google production tier:
  - `gemini-3.5-flash-lite` (**Default**): Low consumption, high-throughput troubleshooting engine for fast daily log triage.
  - `gemini-3.8-flash`: In-depth analysis engine optimal for difficult, subtle, and multi-file code issues.
  - `gemini-3.1-pro`: High-capacity engine for massive stack traces, complex architectures, and full dependency graphs.
  - `custom`: Dedicated input for custom fine-tuned or experimental Gemini endpoints.
- **Updated Model Aliasing & Fallbacks**: Waterfall fallback chains updated to prioritize the latest models while safely migrating legacy identifiers.

#### 2. Thinking / Reasoning Level Selector
- **Configurable Reasoning Token Budget**: New segmented control in the Settings Panel allowing developers to tune the internal reasoning depth for their models:
  - **Auto**: Dynamic engine-adapted reasoning budget (default).
  - **Low**: 1,024 tokens.
  - **Medium**: 4,096 tokens.
  - **High**: 8,192 tokens.
  - **Off**: 0 tokens (disables thinking tokens for minimal latency and maximum speed).
- **Universal Provider Compatibility**: Fully wired through `@google/generative-ai` `thinkingConfig: { thinkingBudget }`, functioning identically for preset models and custom model IDs.

#### 3. Modernized Project Documentation
- **Comprehensive README Overhaul**: Complete documentation of Gemini 3 models, thinking level controls, terminal log cleaner, runtime detection heuristics, PWA offline capabilities, and containerized Docker workflows.

---

## CrypticMechanic v1.4.0

### Milestone Overview

**CrypticMechanic v1.4.0** establishes full architectural alignment with Google's next-generation **Gemini 3** family of models, introducing intelligent fallback chains, transparent legacy migration, cross-provider settings sanitization, and an official CrypticMechanic Pro capabilities preview.

---

### What's New in v1.4.0

#### 1. Verified Gemini 3 Model Selection & Gemini 3.8 Flash Default
- **Curated Gemini 3 Catalogue**: The model selection dropdown in Settings is strictly aligned with Google's production architectures, eliminating obsolete legacy identifiers and non-existent model strings.
- **Supported Models**:
  - `gemini-3.8-flash` (**Default**): Google's flagship GA workhorse model, optimized for speed, long-horizon coding diagnostics, and deep reasoning.
  - `gemini-3.5-flash-lite`: High-throughput, ultra-fast model designed for cost-sensitive and quick log triage.
  - `gemini-3-flash`: Preview model for rapid general diagnostics (`gemini-3-flash-preview`).
  - `gemini-3.1-pro`: Preview model for deep architectural debugging and intricate root-cause analysis (`gemini-3.1-pro-preview`).
  - `Custom Model ID`: Full flexibility to supply custom fine-tuned or newly published Gemini model identifiers.

#### 2. Transparent Default Migration & Cross-Provider Hygiene
- **One-Time Default Migration**: Existing installations storing legacy (1.x, 2.x) or deprecated model IDs in `localStorage` automatically migrate to the recommended `gemini-3.8-flash` default on startup without user intervention.
- **Cross-Provider Configuration Sanitization**: If local model strings (e.g., Ollama identifiers like `llama3:latest` or `deepseek-r1:8b`) are detected in Gemini settings, they are safely neutralized and defaulted to `gemini-3.8-flash`, preventing malformed cloud API requests.

#### 3. Resilient Gemini 3 Fallback Chains
- **Automated Fallback Cascading**: If an active API call encounters a 404, model not found, or unsupported model error (`isModelUnavailableError`), the diagnostic engine automatically waterfalls through adjacent verified Gemini 3 candidates (`gemini-3.8-flash` → `gemini-3.5-flash-lite-preview` → `gemini-3-flash-preview` → `gemini-3.1-pro-preview`) before surfacing an error.
- **Robust Model Resolution**: Model aliases cleanly resolve to their official Google API endpoints.
- **Comprehensive Unit Testing**: Validated by dedicated unit tests covering aliasing, fallback chains, error detection, and migration in `tests/model_resolution_and_fallback.test.mjs`.

#### 4. CrypticMechanic Pro Preview Card
- **Subtle Pro Showcase**: A non-intrusive information card in the Settings drawer highlighting advanced enterprise capabilities available in CrypticMechanic Pro.
- **Featured Pro Capabilities**:
  - Local offline AI models (Ollama, LM Studio) for zero-data leakage.
  - Active workspace source code context inspection (±10 lines around stack traces).
  - Automated secret and credential redactor before AI prompt dispatch.
  - Global desktop system tray and hotkey background daemon.
- **Direct Upgrade Link**: Convenient link to explore Pro features at `https://crypticmechanic.dev/pro`.

---

## CrypticMechanic v1.3.0

### Milestone Overview

**CrypticMechanic v1.3.0** focuses on input sanitization, terminal ergonomics, runtime heuristics, and offline availability. This release ensures that messy terminal logs, bloated ANSI escape sequences, and recursive stack traces are sanitized before sending to AI providers, saving tokens and improving diagnosis accuracy.

---

### What's New in v1.3.0

#### 1. Intelligent Terminal Log Cleaner
- **ANSI Control Sequence Stripping**: Comprehensive regex engine stripping 16-color, 256-color, 24-bit TrueColor, 8-bit C1 escape sequences, and OSC terminal title manipulation codes (`stripAnsiCodes`).
- **Terminal Noise Reduction**: Automatically detects and purges timestamp headers (ISO-8601, UTC, syslog), Docker 64-character container hashes (`docker://<hash>`), container ID URL parameters, and leading bracketed container IDs (`cleanLogNoise`).
- **Stack Frame Repetition Collapsing**: Collapses deep recursive loops and duplicate stack trace frames into structured summaries (`... [repeated N times]`), dramatically reducing prompt token usage while preserving error context (`collapseRepetitiveFrames`).
- **Live Token Savings Feedback**: Visual token savings indicator provides real-time feedback on character count and estimated token reductions directly beneath the log input.
- **Adversarial Test Suite**: 46 adversarial unit tests verifying ANSI stripping, edge cases, null handling, and noise reduction in `tests/adversarial_log_formatter.test.mjs`.

#### 2. Polyglot Runtime Auto-Detection
- **Real-Time Log Heuristics**: Dynamic pattern-matching engine (`detectLogRuntime`) inspecting pasted logs to identify the source runtime:
  - Python Tracebacks (`Traceback (most recent call last):`)
  - Node.js / JavaScript Exceptions (`at Object.<anonymous>`, `TypeError`, `ReferenceError`)
  - Go Panics (`panic: runtime error`, `goroutine 1 [running]:`)
  - Rust Panics (`thread 'main' panicked at`, `RUST_BACKTRACE=1`)
  - Java / JVM Exceptions (`Exception in thread "main"`, `at com.example...`)
  - Kubernetes Orchestrator (`OOMKilled`, `CrashLoopBackOff`, `ImagePullBackOff`)
  - Docker Engine (`container exited with code`, `dockerd:`)
- **Contextual Runtime Badge**: UI badge dynamically displays the detected runtime (e.g., `[Python Traceback]`, `[Go Panic]`, `[Node.js]`), giving developers instant visual confirmation.

#### 3. PWA Offline Shell Caching
- **Vite PWA Plugin Integration**: Built with `vite-plugin-pwa` to provide full Progressive Web App support.
- **Service Worker Precaching**: Automatically generates `sw.js`, `registerSW.js`, and `manifest.webmanifest`, precaching the application shell, stylesheets, icons, and bundles.
- **Offline Reliability & Installability**: Launch CrypticMechanic without an active network connection, and install as a standalone desktop or mobile web app.

---

## CrypticMechanic v1.2.0

### Milestone Overview

**CrypticMechanic v1.2.0** elevates developer troubleshooting workflows with powerful local data management, enhanced model filtering, and an upgraded intelligence pipeline. This release empowers engineers to search through past error diagnostics instantly, organize logs by model, and cleanly export/import history backups without relying on external cloud storage.

---

### What's New in v1.2.0

#### 1. Full-Text History Search & Multi-Criteria Filtering
- **Real-Time Log Search**: Instantly query your diagnostic history across error logs, AI solutions, and model names.
- **Dynamic Model Filter Chips**: Filter entries by model tier (`All`, `3 Flash`, `3 Pro`, `2.5 Flash`, etc.) with live result counts that adapt dynamically as you type.
- **Enhanced Empty States**: Clean feedback when filters yield zero matches, with quick one-click search clearing.

#### 2. Portable Local JSON Backup & Restore
- **Export History as JSON**: Export your complete diagnostic history into a portable, timestamped JSON backup (`crypticmechanic-history-YYYY-MM-DD.json`) with one click.
- **Schema-Validated Import**: Restore past diagnostic sessions from JSON backups with automatic schema validation and deduplication against existing records.
- **Zero Cloud Dependence**: Full data sovereignty — your API keys, logs, and historical queries stay strictly on your local machine.

#### 3. Upgraded Gemini 3 Intelligence Engine
- **Gemini 3 Integration**: Out-of-the-box support for Google's newest reasoning architectures (`gemini-3-flash` and `gemini-3-pro`).
- **Real-Time Token Streaming**: Immediate visual feedback with live token generation and streaming cursor indicators.

#### 4. Polyglot Developer Presets & One-Click GitHub Issue Export
- **9 Polyglot Presets**: One-click reproduction samples across Kubernetes (OOMKilled), Go (runtime nil pointer), Rust (borrow checker), Spring Boot (bean creation), C++ (segmentation fault), and more.
- **One-Click GitHub Issue Export**: Format any diagnostic session into a ready-to-paste markdown bug report featuring collapsible error logs, system telemetry, and structured reproduction steps.
- **Interactive Checklists & Actionable Fixes**: Markdown checklists and copyable command blocks with real-time clipboard feedback.

---

## Upgrade Guide

No breaking configuration changes are required when upgrading from earlier releases. Existing `localStorage` diagnostic histories and settings are automatically preserved and migrated.

To update:
```bash
git pull origin dev
npm install
npm run build
```
