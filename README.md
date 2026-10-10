# CrypticMechanic 🔧

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19.0+-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Electron](https://img.shields.io/badge/Electron-36.0+-47848F?style=flat&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Gemini](https://img.shields.io/badge/Gemini_API-Gemini_3_Ready-4285F4?style=flat&logo=google-gemini&logoColor=white)](https://ai.google.dev/)

**CrypticMechanic** is a high-performance developer tool that translates raw, cryptic error logs, terminal noise, and complex stack traces into human-readable diagnoses and actionable fixes. Powered by Google's cutting-edge **Gemini 3** family of models, it brings instant clarity to chaotic bugs with real-time streaming, interactive checklists, customizable reasoning budgets, and intelligent log cleaning.

Available as a **Responsive Web Application** (with offline PWA capabilities), a **Containerized Docker Service**, and a lightweight **Portable Desktop App** for Windows.

---

## ✨ Features

- **Next-Gen Gemini 3 Model Lineup**:
  - `gemini-3.5-flash-lite` (**Default**): Lowest token consumption and ultra-fast troubleshooting. Ideal for rapid triage and CI/CD log parsing.
  - `gemini-3.8-flash`: Flagship workhorse model for complex debugging, in-depth exploration, and nuanced coding bugs.
  - `gemini-3.1-pro`: High-capacity model for massive stack traces, multi-package dependencies, and complex architecture errors.
  - **Custom Model ID**: Direct support for fine-tuned models, previews, or upcoming Gemini variants.
  - **Transparent Migration & Fallback Cascading**: Legacy and deprecated identifiers automatically migrate, and resilient fallback chains prevent 404 disruptions.
- **Thinking / Reasoning Level Selector**:
  - Direct control over the model's internal reasoning token budget:
    - **Auto** (Default): Adapts dynamically based on the complexity of the error.
    - **Low** (1,024 tokens): Quick reasoning step with minimal overhead.
    - **Medium** (4,096 tokens): Balanced reasoning for standard exceptions.
    - **High** (8,192 tokens): Maximum reasoning budget for deep root-cause analysis.
    - **Off** (0 budget): Disables thinking tokens for lowest latency and maximum throughput.
  - Fully compatible with all preset models and custom model IDs via `@google/generative-ai` `thinkingConfig`.
- **Intelligent Terminal Log Cleaner**:
  - **ANSI Stripping**: Strips standard 16-color, 256-color, TrueColor, 8-bit C1, and OSC terminal title manipulation codes.
  - **Noise Purging**: Strips ISO-8601/syslog timestamps, 64-char Docker container hashes, and runtime prefix noise.
  - **Repetitive Frame Collapsing**: Collapses recursive error loops into concise `... [repeated N times]` summaries to preserve token budget.
  - **Live Token Savings Feedback**: Shows exact count of stripped codes and estimated tokens saved.
- **Polyglot Runtime Auto-Detection**:
  - Heuristic pattern-matching engine automatically identifies the runtime source from pasted logs:
    - 🐍 Python Tracebacks
    - 🟢 Node.js / JavaScript Exceptions
    - 🐹 Go Panics & Goroutine dumps
    - 🦀 Rust Panics & Backtraces
    - ☕ Java / JVM Exceptions
    - ☸️ Kubernetes (`OOMKilled`, `CrashLoopBackOff`)
    - 🐳 Docker Engine errors
  - Displays dynamic runtime badges with instant visual confirmation.
- **Modular Provider Architecture & Extension Engine**:
  - Decoupled `AIProvider` base class and universal `providerRegistry`.
  - Zero-merge-conflict dynamic extension auto-discovery (`src/lib/extensionRegistry.js`).
- **Interactive Checklists & Actionable Fixes**:
  - Markdown task checkboxes (`- [ ]` / `- [x]`) are fully interactive toggles directly inside the output stream.
- **Enhanced Code Blocks**:
  - Language badge headers (`BASH`, `JAVASCRIPT`, `DOCKERFILE`, etc.).
  - Dedicated copy buttons with visual feedback (`Copied!`).
  - High-contrast dark terminal container across all themes.
- **9 Polyglot Error Presets**:
  - Instant one-click test logs covering Node.js, Docker port conflicts, Python `KeyError`, Git merge conflicts, Rust borrow checker, Kubernetes Pod `OOMKilled`, Go panic, Spring Boot dependency injection, and C++/GDB `SIGSEGV`.
- **5 Premium CompSci & Developer Themes**:
  - 🌌 **Midnight Terminal** (Default) – Sleek, high-contrast dark theme.
  - 🚨 **Kernel Panic** – Crimson error-state aesthetic.
  - 📟 **Circuit Board** – Classic green console matrix vibe.
  - 🟦 **Blue Screen** – Nostalgic retro BSOD crash theme.
  - 🥼 **Clean Room** – High-contrast light theme for crisp daylight readability.
- **Local History & Filtering**:
  - Searchable history entries with model badge chips (`3.5 Flash Lite`, `3.8 Flash`, `3.1 Pro`).
  - JSON export/import and per-item deletion. All data stays strictly in local browser storage.
- **PWA & Offline Readiness**:
  - Service worker caching for full offline application shell loading.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 19, Vite 8, JavaScript (ESM)
- **AI SDK**: Google Generative AI (`@google/generative-ai` v0.24+) with real-time streaming & thinking config
- **Styling**: Vanilla CSS variables with instant dynamic theme switching
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown & Code Highlighting**: `react-markdown` with Prism syntax highlighting
- **Desktop Runtime**: Electron 36 with `electron-builder`
- **Containerization**: Docker & Docker Compose with multi-stage Nginx alpine

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18.0.0 or later
- A free Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/apikey)

### Local Development

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/MaskirovkaOtdel/CrypticMechanic.git
   cd CrypticMechanic
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

4. **Run Verification & Tests**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

---

## 🐳 Docker Deployment

CrypticMechanic includes a multi-stage Dockerfile and Docker Compose configuration for lightweight production deployment:

### Run with Docker Compose
```bash
docker compose up -d --build
```
Open `http://localhost:8080` in your browser.

### Run with Docker CLI
```bash
docker build -t crypticmechanic:latest .
docker run -d -p 8080:80 --name crypticmechanic crypticmechanic:latest
```

---

## 🖥️ Desktop App (Electron)

### Run in Development
```bash
npm run electron:dev
```

### Build Portable Windows Executable
```bash
npm run electron:build
```
The self-contained executable (`CrypticMechanic-Portable.exe`) will be generated in `release/`.

---

## ⚙️ Configuration & Settings

Click the **Settings (Gear)** icon in the header to configure:

- **API Key**: Enter your Gemini API key (persisted safely in local storage only).
- **AI Model**:
  - `gemini-3.5-flash-lite`: Low consumption, fastest troubleshooting (Default).
  - `gemini-3.8-flash`: Optimal for complex code analysis and deep reasoning.
  - `gemini-3.1-pro`: Maximum capacity for large multi-file traces.
  - `Custom Model ID`: Supply any custom or experimental Gemini identifier.
- **Thinking / Reasoning Level**:
  - `Auto`: Dynamic budget.
  - `Low`: 1,024 tokens.
  - `Medium`: 4,096 tokens.
  - `High`: 8,192 tokens.
  - `Off`: 0 tokens (fastest, no thinking overhead).
- **Detail Level**: *Concise*, *Standard*, or *Thorough*.
- **Response Format**: *Diagnosis + Fixes*, *Step-by-Step*, *Root Cause*, or *Quick Fix*.
- **Tone**: *Professional*, *Friendly*, or *ELI5*.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with 💻 by **Thodoris Efstathiadis** (`MaskirovkaOtdel`).
