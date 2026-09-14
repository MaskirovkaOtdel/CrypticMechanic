# CrypticMechanic: Dual-Track Roadmap & Architectural Boundary Specification

> **Document Version**: 1.0.0  
> **Status**: Approved Architecture Specification  
> **Target Products**: CrypticMechanic (Public Community Preview) & CrypticMechanic-Pro (Local Premium Edition)  
> **Author**: Architecture & Roadmap Working Group  
> **Date**: September 2026  

---

## Executive Summary

**CrypticMechanic** is an intelligent developer diagnostic workstation engineered to demystify complex stack traces, compiler errors, build failures, and runtime crashes into actionable root-cause analyses and surgical fixes.

To balance broad community adoption with the rigorous compliance demands of enterprise organizations, CrypticMechanic is split into a **dual-track product architecture**:
1. **Public Community Preview (Open-Core)**: A fast, free, installable Progressive Web Application (PWA) and web utility hosted publicly on GitHub. It operates on a Bring-Your-Own-Key (BYOK) cloud model powered by Google Gemini 3 and 2.5 models with zero server-side telemetry.
2. **Local Premium Edition (Pro)**: A local-first, air-gapped diagnostic workstation designed for proprietary codebases, air-gapped networks, and privacy-sensitive development teams. It enables local offline inference (Ollama, LM Studio, LocalAI), source-code context inspection, global desktop hotkey automation, and side-by-side multi-model comparative diagnostics.

This document establishes the feature breakdown, architectural boundary specifications, Git merge non-interference protocols, 4-phase development roadmap, and commercialization model.

---

## 1. Track Specifications

### 1.1 Public Community Preview (Open-Core)

The Public Community Preview serves as the foundational open-source distribution. It focuses on zero-friction onboarding, high-velocity error resolution, and community collaboration.

- **Distribution & License**:
  - Open source under the permissive **MIT License**.
  - Hosted in the public GitHub repository (`CrypticMechanic`).
  - Distributed as a hosted web application, installable PWA (Progressive Web Application), and lightweight portable Electron wrapper.
- **Intelligence Engine**:
  - Cloud-based inference via **Google Gemini API** (`@google/generative-ai`).
  - Supported models: Gemini 3 Flash (default), Gemini 3 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash Lite, Gemini 2.5 Pro, and custom model endpoints.
  - **BYOK (Bring Your Own Key)** architecture: Users supply their personal Google AI Studio API key.
- **Input & Diagnostic Workflows**:
  - Manual clipboard paste into a Monaco-inspired, syntax-highlighted error input console.
  - Built-in sample presets for quick demonstrations (e.g., React Hydration mismatch, Python IndexError, Rust Lifetime E0597, Docker OOMKilled).
  - Drag-and-drop log ingestion supporting standard log files (`.log`, `.txt`, `.json`, `.trace`) up to 5MB.
- **User Experience & Presentation**:
  - Real-time chunked token streaming with Markdown formatting, syntax highlighting, and copyable diff snippets.
  - Diagnostic history stored locally in browser `localStorage` (up to 50 recent sessions) with export to Markdown.
  - Four curated terminal themes: *Midnight Terminal* (default dark), *Cyberpunk Neon*, *Paper Light*, and *Solarized Dark*.
- **Privacy & Telemetry Guarantee**:
  - **Zero Telemetry**: No Google Analytics, no Mixpanel, no Sentry, no tracking beacons.
  - **Client-Side Direct Egress**: Requests travel directly from the client's browser to `generativelanguage.googleapis.com`. No intermediate proxy or relay server ever sees or stores the code.
  - **Local Persistence Only**: API keys and preferences are stored strictly in client-side `localStorage`.

### 1.2 Local Premium Edition (Pro)

The Local Premium Edition is engineered for enterprise software engineers, defense contractors, financial institutions, and security-conscious developers who are prohibited from transmitting source code or logs across the public internet.

- **Distribution & License**:
  - Proprietary commercial license for extended modules; core remains MIT compatible.
  - Maintained in a downstream private repository (`CrypticMechanic-Pro`) tracking the public upstream.
  - Distributed as signed standalone desktop executables (Windows `.exe`/installer, macOS `.dmg`/Universal Binary, Linux `.AppImage`/`.deb`).
- **Offline Local AI Engine (Phase 1 Priority)**:
  - Native integration with **Ollama** (`http://localhost:11434`) and OpenAI-compatible local endpoints (LM Studio, LocalAI, vLLM).
  - Dynamic local model enumeration via `/api/tags` with automatic RAM/VRAM resource profiling.
  - Recommended local models: Llama 3.2 (3B), Qwen 2.5 Coder (7B/14B), DeepSeek R1 (8B/14B), CodeLlama (7B).
  - Automatic offline health probing and fallback alerts with remediation commands (e.g., `ollama serve`, `ollama pull <model>`).
- **Air-Gapped Zero-Data Leakage Architecture**:
  - **100% Loopback Network Enforcement**: Pro engine strictly validates that the configured AI endpoint resolves to `localhost`, `127.0.0.1`, or explicit RFC 1918 private intranet subnets.
  - External network calls are strictly prohibited during local analysis; verified via automated socket inspection.
  - All prompt assembly, tokenization, inference, and response decoding occur in local machine memory and GPU VRAM.
- **Deep Source Context Inspection (Phase 2)**:
  - Intelligent stack trace parser that identifies referenced project files, function scopes, and line numbers.
  - Direct local file system reader that inspects surrounding lines of source code (±15 lines around fault site) to feed rich context into the local LLM.
- **Desktop Workflow Ergonomics (Phase 2)**:
  - Background system tray daemon with low memory footprint (<40MB idle).
  - Global system hotkey (e.g., `Ctrl+Shift+E` / `Cmd+Shift+E`) to capture highlighted error text or active clipboard, invoke local diagnostic, and display a floating HUD.
- **Automated Secret & PII Scrubbing (Phase 2)**:
  - Pre-inference regex and entropy redaction engine that automatically masks AWS keys (`AKIA...`), JWT tokens, database passwords, and internal IP addresses before sending prompts to any model.
- **Multi-Model Comparative Diagnostics (Phase 3)**:
  - Parallel dual-stream inference comparing two distinct models simultaneously (e.g., Qwen 2.5 Coder vs DeepSeek R1, or Local Ollama vs Cloud Gemini 3 Pro).
  - Side-by-side difference view highlighting consensus, divergent root-cause hypotheses, and alternative fix strategies.
- **Team Diagnostic Playbooks (Phase 3)**:
  - Organization-wide custom prompt rules, system error dictionaries, and vetted resolution playbooks.
  - Exportable encrypted bundles for air-gapped team deployment.

---

## 2. Comparative Feature Matrix

| Functional Category | Capability / Feature | Public Community Preview | Local Premium Edition (Pro) |
| :--- | :--- | :---: | :---: |
| **Licensing & Access** | License Type | Permissive Open Source (MIT) | Commercial Proprietary Extensions |
| | Repository Access | Public GitHub Repository | Downstream Private Repository |
| | Commercial Enterprise Support | Community-based (Discussions/Issues) | Dedicated SLA & Security Updates |
| **AI Inference Engines** | Cloud Gemini 3 Flash / 3 Pro / 2.5 | ✅ Yes (BYOK User API Key) | ✅ Yes (Optional Cloud Fallback) |
| | Local Offline LLMs (Ollama) | ❌ Not Included | ✅ **Full Support (Phase 1)** |
| | OpenAI-Compatible Local Endpoints | ❌ Not Included | ✅ Full Support (LM Studio, LocalAI) |
| | Dynamic Local Model Discovery | ❌ Not Included | ✅ Auto-detect via `/api/tags` |
| | Streaming Token Generation | ✅ Yes (NDJSON / SSE) | ✅ Yes (Local & Cloud Streams) |
| **Security & Privacy** | Air-Gapped Zero-Data Leakage | ❌ No (Logs sent to Google Cloud) | ✅ **100% Air-Gapped Guaranteed** |
| | Telemetry & Analytics Tracking | ❌ Zero Telemetry | ✅ Zero Telemetry |
| | Enforced Loopback Endpoint Gate | ❌ Not Applicable | ✅ Yes (Localhost Validation) |
| | Automated Secret & PII Redactor | ❌ Not Included | ✅ Yes (Phase 2 Priority) |
| **Log Ingestion & Context** | Manual Paste Console | ✅ Yes | ✅ Yes |
| | Curated Preset Error Library | ✅ Yes (Standard Presets) | ✅ Yes (Standard + Extended) |
| | Drag-and-Drop Log Upload (≤5MB) | ✅ Yes | ✅ Yes (Unlimited File Size) |
| | Source Context File Inspector | ❌ Not Included | ✅ Yes (Phase 2: ±15 lines code read) |
| | Terminal Pipe / CLI Invocation | ❌ Not Included | ✅ Yes (Phase 2: `cm --pipe`) |
| **Desktop & Operating System** | Progressive Web App (PWA) | ✅ Installable Web App | ✅ Supported |
| | Standalone Desktop Executable | ✅ Basic Window Wrapper | ✅ Native Desktop Daemon |
| | Global System Hotkey & Tray | ❌ Not Included | ✅ Yes (Phase 2: `Ctrl+Shift+E`) |
| | Floating Quick-Diagnostic HUD | ❌ Not Included | ✅ Yes (Phase 2) |
| **Analysis & Collaboration** | Markdown & Code Syntax Output | ✅ Yes | ✅ Yes |
| | One-Click Fix Copy & Git Patch | ✅ Yes | ✅ Yes |
| | Local History Journal | ✅ 50 Sessions (localStorage) | ✅ Unlimited SQLite Database |
| | Multi-Model Comparative Stream | ❌ Not Included | ✅ **Yes (Phase 3: Side-by-Side)** |
| | Team Diagnostic Playbooks | ❌ Not Included | ✅ Yes (Phase 3: Import/Export) |

---

## 3. Architectural Boundary Specifications

### 3.1 Repository Topology & Non-Invasive Extension Strategy

To guarantee that the Public Community Preview can receive frequent open-source contributions while `CrypticMechanic-Pro` maintains proprietary additions, the architecture strictly enforces a **Zero-Merge-Conflict Repository Topology**:

```
[Public Upstream Repo: CrypticMechanic]
  ├── src/
  │    ├── lib/
  │    │    ├── providers/
  │    │    │    ├── AIProvider.js         <-- Abstract Provider Interface Contract
  │    │    │    └── providerRegistry.js   <-- Dynamic Provider Registry Singleton
  │    │    └── extensionRegistry.js       <-- Vite Dynamic Glob Extension Auto-Loader
  │    └── extensions/
  │         └── .gitkeep                   <-- Empty in Public (Matches 0 extensions)
  └── package.json                         <-- Standard dependencies only

                 │
                 │ git pull upstream / git merge upstream/dev
                 ▼

[Private Downstream Repo: CrypticMechanic-Pro]
  ├── src/
  │    ├── extensions/
  │    │    ├── ollama/                    <-- Proprietary Extension (Ollama Provider)
  │    │    │    ├── OllamaProvider.js
  │    │    │    ├── OllamaSettings.jsx
  │    │    │    └── index.js
  │    │    └── context-inspector/         <-- Proprietary Extension (Phase 2)
  │    │         └── index.js
  └── .git/config                          <-- upstream configured with pushurl=DISABLE_PUSH
```

#### The Zero-Merge-Conflict Invariant
1. **Never edit core files downstream**: Developers working on `CrypticMechanic-Pro` must **never** modify upstream files (e.g., `src/App.jsx`, `src/components/SettingsPanel.jsx`, or `src/lib/gemini.js`) to inject Pro functionality.
2. **Dynamic Extension Discovery via Vite Globbing**:
   In `src/lib/extensionRegistry.js`, the application loads extensions dynamically at startup:
   ```javascript
   const extensionModules = import.meta.glob('../extensions/*/index.{js,jsx}', { eager: true });
   ```
   - In the **Public Community Preview**, `src/extensions/` contains only `.gitkeep`. The glob matches zero files. The bundle remains clean, containing only MIT code.
   - In the **Local Premium Edition**, extensions placed inside `src/extensions/<name>/` register their providers, settings panes, and UI hooks via a standardized registration callback:
     ```javascript
     export function register({ registerProvider, registerSettingsPanel, registerUIHook }) {
       registerProvider(new OllamaProvider());
       registerSettingsPanel(OllamaSettings);
     }
     ```
3. **Upstream Merges Always Clean**: Because upstream commits never introduce or edit files inside `src/extensions/<feature>/`, executing `git merge upstream/dev` inside `CrypticMechanic-Pro` yields automatic fast-forwards or clean recursive merges with **zero file-level conflicts**.
4. **Git Remote Push Barrier**:
   The downstream repository `.git/config` enforces `pushurl = DISABLE_PUSH` for the upstream remote:
   ```ini
   [remote "upstream"]
     url = c:\\Users\\User\\Desktop\\CrypticMechanic
     fetch = +refs/heads/*:refs/remotes/upstream/*
     pushurl = DISABLE_PUSH
   ```
   This physically blocks accidental pushes of proprietary IP or extensions into the public repository.

---

### 3.2 Data Flow & Air-Gapped Network Topology

The following diagram contrasts the data paths of the Public Community Preview versus the Local Premium Edition:

```
========================================================================================
PUBLIC COMMUNITY PREVIEW (Cloud BYOK Flow)
========================================================================================
 [User Log / Trace]
         │
         ▼
 [CrypticMechanic Client (Browser / PWA)]
         │
         │  HTTPS Egress (Direct to Cloud)
         ▼
 [Google Cloud: generativelanguage.googleapis.com]
         │
         │  Gemini 3 Flash / 2.5 Inference
         ▼
 [Streaming Tokens Back to Client]

========================================================================================
LOCAL PREMIUM EDITION (Air-Gapped Offline Loopback Flow)
========================================================================================
 [Proprietary Code / Stack Trace]
         │
         ▼
 [CrypticMechanic Pro Client]
         │
         ├───► [Local PII / Secret Redactor] (Strips AWS keys, tokens, auth headers)
         │
         ├───► [Local Source Context Inspector] (Reads local ±15 lines via local filesystem)
         │
         │  HTTP / Localhost Only (No Internet Egress)
         ▼
 [Local Ollama / LM Studio Daemon (http://localhost:11434)]
         │
         │  GPU VRAM / CPU RAM Execution (Llama 3.2 / Qwen 2.5 / DeepSeek R1)
         ▼
 [Zero-Egress Streaming NDJSON via Loopback]
         │
         ▼
 [Rendered Diagnosis & Surgical Patch in Pro Client]
```

#### Air-Gapped Guarantees
- **Strict Loopback Address Validation**: The Pro engine evaluates endpoint URLs with strict regular expressions:
  ```javascript
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))(:\d+)?(\/.*)?$/i.test(endpoint);
  ```
  Any attempt to point a "local" provider at an external public hostname generates an immediate security error and halts transmission.
- **Zero Third-Party Assets at Runtime**: All fonts, icons, styling rules, and scripts are bundled statically at compile time; zero CDNs or remote font fetches are initiated.

---

### 3.3 The Unified `AIProvider` Contract

All AI inference engines implement the abstract `AIProvider` base class located at `src/lib/providers/AIProvider.js`:

```javascript
/**
 * Abstract base class for all CrypticMechanic AI Providers.
 */
export class AIProvider {
  /**
   * @param {Object} meta
   * @param {string} meta.id Unique provider identifier ('gemini', 'ollama', etc.)
   * @param {string} meta.name Human-readable provider title
   * @param {'cloud' | 'local'} meta.type Deployment classification
   * @param {Object} meta.capabilities Feature flags
   */
  constructor({ id, name, type, capabilities }) {
    if (new.target === AIProvider) {
      throw new TypeError('Cannot instantiate abstract AIProvider directly.');
    }
    this.id = id;
    this.name = name;
    this.type = type;
    this.capabilities = Object.freeze({
      requiresApiKey: false,
      configurableEndpoint: false,
      streaming: true,
      localOffline: false,
      modelListing: false,
      ...capabilities,
    });
  }

  /**
   * Primary streaming diagnostic method.
   * @param {Object} params
   * @param {string} params.logs Raw error or stack trace
   * @param {Object} params.settings User preferences and provider config
   * @param {(accumulated: string, delta: string) => void} params.onChunk Stream chunk handler
   * @param {AbortSignal} [params.signal] Cancellation signal
   * @returns {Promise<string>} Accumulated diagnostic markdown
   */
  async streamAnalyze({ logs, settings, onChunk, signal }) {
    throw new Error('streamAnalyze() must be implemented by subclass.');
  }

  /**
   * Probe provider availability.
   * @param {Object} config
   * @returns {Promise<{ ok: boolean, message: string, details?: any }>}
   */
  async testConnection(config = {}) {
    return { ok: true, message: 'Ready' };
  }

  /**
   * Discover available models.
   * @param {Object} config
   * @returns {Promise<Array<{ id: string, name: string, description?: string }>>}
   */
  async listModels(config = {}) {
    return [];
  }

  /**
   * Validate configuration before initiating requests.
   * @param {Object} config
   * @returns {{ valid: boolean, error?: string }}
   */
  validateConfig(config = {}) {
    if (this.capabilities.requiresApiKey && !config.apiKey?.trim()) {
      return { valid: false, error: `Missing API key for ${this.name}.` };
    }
    return { valid: true };
  }
}
```

---

## 4. Four-Phase Development Roadmap

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                           DEVELOPMENT ROADMAP                           │
  └─────────────────────────────────────────────────────────────────────────┘

    PHASE 0: Foundations & Architecture Boundary (Current Milestone)
    ├── Abstract AIProvider Interface & Singleton Registry
    ├── Dynamic Extension Auto-Loader (import.meta.glob)
    ├── Git Downstream Remote Setup (pushurl=DISABLE_PUSH)
    └── Zero-Regression Build & Lint Verification (ESLint code 0, Vite code 0)
         │
         ▼
    PHASE 1: Local AI Engine & Offline Scaffolding (Immediate Priority)
    ├── Ollama Provider Implementation (src/extensions/ollama/)
    ├── Connection Health Probe & Model Listing via GET /api/tags
    ├── Streaming NDJSON Parser for POST /api/chat
    ├── Strict Localhost Loopback Validation (Zero Data Leakage)
    └── UI Integration: Provider Selector & Dynamic Model Dropdown
         │
         ▼
    PHASE 2: Deep Context & Developer Ergonomics
    ├── Stack Trace Source Context Inspector (±15 Lines Code Extraction)
    ├── Automated Secret & PII Redaction Engine (AWS, JWT, DB Keys)
    ├── Global Desktop Hotkey Daemon (Ctrl+Shift+E Clipboard Trigger)
    └── Floating Quick-Diagnostic Overlay HUD
         │
         ▼
    PHASE 3: Multi-Model Intelligence & Enterprise Tooling
    ├── Dual-Stream Side-by-Side Multi-Model Comparative Analysis
    ├── Consensus & Discrepancy Matrix View (Llama vs DeepSeek vs Gemini)
    ├── Team Diagnostic Playbooks & Export Bundles (Encrypted Offline)
    └── Enterprise Installer Packages (.msi, .pkg, .deb) with Silent Deploy
```

### 4.1 Phase 0: Foundations & Architecture Boundary (Milestone Complete)
- **Objective**: Establish clean modular decoupling in the public codebase so downstream features can be introduced with zero merge conflict risk.
- **Deliverables**:
  1. `src/lib/providers/AIProvider.js`: Base class defining contracts for streaming, connection testing, model enumeration, and validation.
  2. `src/lib/providers/providerRegistry.js`: Central registry allowing dynamic registration and retrieval of active AI providers.
  3. `src/lib/providers/GeminiProvider.js`: Encapsulation of existing Google Gemini SDK logic under the `AIProvider` contract.
  4. `src/lib/extensionRegistry.js`: Dynamic extension discovery using Vite's `import.meta.glob`.
  5. UI updates in `App.jsx` and `SettingsPanel.jsx`: Dynamic provider dropdown and conditional API key requirement rendering.
  6. Git topology setup in `CrypticMechanic-Pro` with `pushurl = DISABLE_PUSH`.
- **Success Criteria**:
  - `npm run lint` exits with code `0`.
  - `npm run build` generates production bundle with code `0`.
  - Upstream code remains completely free of proprietary or mock Pro code.

### 4.2 Phase 1: Local AI Engine & Offline Scaffolding (Immediate Execution)
- **Objective**: Enable full offline, air-gapped diagnostic capability in `CrypticMechanic-Pro` using locally hosted Ollama instances.
- **Key Modules**:
  1. `src/extensions/ollama/OllamaProvider.js`: Concrete `AIProvider` implementing the Ollama HTTP REST specification.
  2. **Model Discovery**: Probe `GET http://localhost:11434/api/tags` to populate available local models (Llama 3.2, Qwen 2.5 Coder, DeepSeek R1).
  3. **Streaming Parser**: Stream consumer for `POST /api/chat` supporting Newline-Delimited JSON (NDJSON) chunks (`{"message":{"content":"..."},"done":false}`).
  4. **Health Check & Diagnostics**: Proactive connection tester that alerts the user if the Ollama daemon is down, offering one-click diagnostic guidance (`ollama serve`).
  5. **Air-Gap Verification**: Automated regex assertion restricting endpoints to `localhost`, `127.0.0.1`, or local RFC 1918 subnets.
- **Success Criteria**:
  - Offline translation executes end-to-end with zero internet connection (WiFi disabled).
  - Merging `upstream/dev` into `CrypticMechanic-Pro` produces zero merge conflicts.

### 4.3 Phase 2: Deep Context & Developer Ergonomics
- **Objective**: Elevate diagnosis quality by ingesting source code context directly from local repositories, and streamline developer invocation via system hotkeys.
- **Key Modules**:
  1. **Source Context Inspector**:
     - Automatically parses file paths and line numbers from stack traces (e.g., `at OrderService.processPayment (src/services/order.ts:142:19)`).
     - Securely reads surrounding lines (±15 lines) from the local repository.
     - Appends source context directly into the LLM system prompt without requiring manual user copy-pasting.
  2. **Automated Credential & PII Scrubbing**:
     - Pre-inference regex scrubber that detects and redacts high-entropy API tokens (`sk-...`, `AKIA...`, `ghp_...`), private keys, passwords, and authorization headers.
  3. **Global Desktop Hotkey & Tray Daemon**:
     - System-level shortcut (`Ctrl+Shift+E` / `Cmd+Shift+E`) registered via Electron / native OS hooks.
     - Automatically captures selected error text or active clipboard, opens a lightweight floating HUD, and streams the diagnostic instantly.
- **Success Criteria**:
  - Diagnostic accuracy on complex logic bugs improves by >40% due to local source code context.
  - Zero sensitive tokens leaked in generated prompts.

### 4.4 Phase 3: Multi-Model Intelligence & Enterprise Tooling
- **Objective**: Deliver enterprise-grade consensus verification and collaborative organizational playbooks.
- **Key Modules**:
  1. **Side-by-Side Multi-Model Comparison**:
     - Dual-column real-time streaming view comparing two distinct engines (e.g., `Llama 3.3 70B` vs `DeepSeek R1 14B`, or Local Ollama vs Cloud Gemini 3 Pro).
     - Highlight consensus points (agreed root causes) and divergent hypotheses.
  2. **Team Diagnostic Playbooks**:
     - Library of enterprise-specific error patterns (e.g., proprietary microservice error envelopes, internal Kubernetes ingress faults).
     - Exportable encrypted playbooks for team distribution across air-gapped secure enclaves.
  3. **Enterprise Packaging & Deployment**:
     - Silent MSI installers for Windows enterprise deployment with pre-configured local endpoint policies.
     - Support for centralized local inference gateways (e.g., corporate vLLM clusters).
- **Success Criteria**:
  - Simultaneous dual-stream analysis with synchronized markdown rendering.
  - Seamless deployment via enterprise configuration files (`crypticmechanic.config.json`).

---

## 5. Commercialization Triggers & Business Model

### 5.1 Commercialization Triggers

The transition from free community usage to paid Pro/Enterprise adoption is driven by concrete compliance and workflow friction points:

1. **The Air-Gap & IP Compliance Trigger (Primary Enterprise Driver)**:
   - *Friction*: Enterprise legal, security, and compliance departments (HIPAA, SOC 2, ISO 27001, Defense FAR/DFARS) strictly prohibit developers from sending proprietary source code or production error logs to third-party cloud APIs (such as OpenAI, Anthropic, or Google).
   - *Pro Solution*: Phase 1 Local AI provides a provably air-gapped, zero-data-leakage solution operating entirely on local developer hardware or corporate private clouds.
2. **The Developer Workflow Friction Trigger (Primary Individual Driver)**:
   - *Friction*: Manually copying stack traces from terminals, pasting them into a browser, opening an IDE, copying surrounding code lines, and pasting them into ChatGPT/Gemini wastes 10–20 minutes per incident.
   - *Pro Solution*: Phase 2's global hotkey (`Ctrl+Shift+E`) and automated Source Context Inspector reduce this to a single 2-second keystroke.
3. **The Hallucination & Critical Reliability Trigger**:
   - *Friction*: Complex multi-threaded race conditions or compiler errors often yield incorrect or hallucinated fixes when analyzed by a single model.
   - *Pro Solution*: Phase 3's Multi-Model Comparison allows developers to cross-verify hypotheses across reasoning models (e.g., DeepSeek R1) and coding models (e.g., Qwen 2.5 Coder).

---

### 5.2 Pricing Structure & Licensing Tiers

```
┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
│     COMMUNITY PREVIEW     │      PRO INDIVIDUAL       │      TEAM ENTERPRISE      │
│        $0 / Forever       │      $49 Perpetual        │   $29 / User / Month      │
├───────────────────────────┼───────────────────────────┼───────────────────────────┤
│ • MIT Open-Source Core    │ • Everything in Community │ • Everything in Pro       │
│ • Cloud Gemini 3/2.5 BYOK │ • Local Offline Ollama    │ • Centralized Gateway     │
│ • Installable PWA         │ • Source Context Inspector│ • Air-Gapped Deployments  │
│ • Manual Paste & Presets  │ • Global Hotkey & Tray    │ • Team Playbook Sharing   │
│ • Local History (50 items)│ • PII & Secret Redactor   │ • Dedicated SLA Support   │
│ • Zero Telemetry          │ • 1 Year Feature Updates  │ • Volume License Admin    │
└───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

#### Detailed Tier Breakdown

1. **Public Community Preview**:
   - **Target Audience**: Individual open-source developers, students, and hobbyists.
   - **Price**: **$0** (Free, Open-Source under MIT).
   - **Terms**: Bring-Your-Own-Key (BYOK). No credit card required. Free updates via GitHub releases.
2. **Pro Individual**:
   - **Target Audience**: Professional freelance engineers, consultants, and senior developers desiring local offline speed, privacy, and desktop convenience.
   - **Price**: **$49 one-time perpetual license** (includes 1 year of feature upgrades and maintenance) or **$5/month**.
   - **Entitlements**: Node/Electron standalone executable, Phase 1 Local Ollama integration, Phase 2 Source Context Inspector, Global System Hotkey, and PII Redactor.
3. **Team Enterprise**:
   - **Target Audience**: Regulated enterprises (finance, healthcare, defense, tech companies with proprietary codebases).
   - **Price**: **$29 per seat / month** (billed annually, volume tier discounts available at >50 seats).
   - **Entitlements**: Signed MSI/PKG installers, corporate vLLM/private cluster gateway support, centralized encrypted playbook distribution, compliance attestation reports, and priority technical support SLA.

---

### 5.3 Go-to-Market (GTM) & Conversion Funnel

The open-core distribution acts as the high-volume top-of-funnel engine:

1. **Frictionless Ingestion**: Developers discover CrypticMechanic via GitHub, dev.to, Hacker News, or Twitter/X. They open the web app or install the PWA, paste their Gemini API key, and experience instant, high-quality error decoding.
2. **Contextual In-App Value Signals**:
   - In the settings and provider panel, a subtle, non-intrusive badge highlights: *"Need zero-data leakage for proprietary code? Switch to Local Offline Mode (Pro)"*.
   - When large stack traces containing local file paths are pasted, an inline tip notes: *"CrypticMechanic Pro automatically inspects surrounding source code files to diagnose this fault with 100% precision."*
3. **Zero-Lock-in Guarantee**: Community users retain all open-source capabilities indefinitely. Upgrading to Pro unlocks developer productivity and compliance guarantees without altering familiar workflows.

---

## 6. Document Governance & Maintenance

- **Review Cadence**: This roadmap document is reviewed at the end of each development phase by the lead maintainers.
- **Architectural Changes**: Any proposed modifications to the abstract `AIProvider` contract or `extensionRegistry.js` require an Architectural Decision Record (ADR) and explicit regression testing against both `CrypticMechanic` and `CrypticMechanic-Pro`.
- **Integrity Compliance**: All claims regarding zero-data leakage, air-gap guarantees, and performance metrics must be empirically validated prior to public release.
