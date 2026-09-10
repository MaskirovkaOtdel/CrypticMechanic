# CrypticMechanic 🔧

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19.0+-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Electron](https://img.shields.io/badge/Electron-36.0+-47848F?style=flat&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Gemini](https://img.shields.io/badge/Gemini_API-Supported-4285F4?style=flat&logo=google-gemini&logoColor=white)](https://ai.google.dev/)

**CrypticMechanic** is a premium developer tool that translates raw, confusing error logs, terminal outputs, and stack traces into human-readable diagnoses and clear, actionable steps. Powered by Google's Gemini models, it brings clarity to chaotic errors so you can fix bugs faster and keep coding.

Available as both a responsive Web Application (with full PWA support) and a lightweight, self-contained **Portable Desktop App** for Windows.

---

## ✨ Features

- **Intuitive UI/UX & Real-Time Streaming**: Paste your raw logs and watch diagnoses stream in live with `generateContentStream`. Side-by-side or clean stacked layout highlights a focused **Diagnosis** and a checkable list of **Actionable Fixes**.
- **Interactive Checklists**: Markdown task checkboxes (`- [ ]` / `- [x]`) are fully interactive toggles so developers can tick off steps as bugs are resolved.
- **Enhanced Code Blocks**:
  - Language badge headers (`BASH`, `JAVASCRIPT`, `DOCKERFILE`, etc.).
  - Dedicated per-code-block copy buttons with immediate visual feedback (`Copied!`).
  - Dark terminal container (`#14161f`) with high WCAG contrast across all themes, including Clean Room (light mode).
- **Workflow & Ergonomics**:
  - **Drag-and-Drop**: Drop `.log` or `.txt` files directly onto the log input area.
  - **Keyboard Shortcuts**: `Ctrl+Enter` (or `Cmd+Enter`) in the log input triggers translation; `Escape` closes open drawers.
  - **Export Options**: One-click "Copy Markdown" and "Download .md" (`CrypticMechanic-Analysis.md`).
  - **Token Estimator**: Real-time character and token counter (e.g. `1,200 chars (~300 tokens)`).
- **Highly Customisable Outputs**: Customise how your responses are generated via the settings panel:
  - **Detail Level**: Choose between *Concise* (fast checklist), *Standard*, or *Thorough* (deep explanation).
  - **Response Format**: Toggle between *Diagnosis + Fixes*, *Step-by-Step*, *Root Cause*, or *Quick Fix*.
  - **Response Tone**: Match your style with *Professional*, *Friendly*, or *ELI5*.
- **5 Premium CompSci & SWE Themes**:
  - 🌌 **Midnight Terminal** (Default) – Sleek, high-contrast dark theme.
  - 🚨 **Kernel Panic** – Vibrant, error-state dark theme with deep crimson accents.
  - 📟 **Circuit Board** – Classic matrix-green console vibe.
  - 🟦 **Blue Screen** – Nostalgic retro BSOD crash theme.
  - 🥼 **Clean Room** – Sleek, premium light theme for crisp day reading with dark terminal code blocks.
- **Latest Gemini 2.5 Model Lineup**:
  - `gemini-2.5-flash` (Default / Recommended - Fast & Balanced)
  - `gemini-2.5-flash-lite` (Cheapest & Ultra-Fast)
  - `gemini-2.5-pro` (Deep Reasoning / Complex Stack Traces)
  - `gemini-2.0-flash` (Legacy GA)
  - **Custom Model ID**: Type any model identifier (e.g. `gemini-3.1-pro`, `gemini-2.5-flash-preview`) to keep the app future-proof.
- **Deterministic Troubleshooting**: Configured with `temperature: 0.2` and native `systemInstruction` parameters for consistent, accurate fixes.
- **Local History with Model Badges**: Browse recent translations with model badge pills (e.g. `2.5 Flash`) and delete individual items or clear history.
- **Offline & Desktop Native**:
  - **Electron Portable App**: Downloadable, zero-install portable `.exe` executable for Windows.
  - **PWA Ready**: Installable directly onto your system from Chromium-based browsers.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 19, Vite 8, JavaScript (ESM)
- **Styling**: Vanilla CSS with custom properties (CSS variables) for real-time theme swapping.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown Rendering**: `react-markdown` with syntax highlighting via `react-syntax-highlighter` (Prism `oneDark`).
- **AI Integration**: Google Generative AI SDK (`@google/generative-ai`)
- **Desktop Wrapper**: Electron 36 & `electron-builder`

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18.0.0 or later is recommended).

### Installation & Local Dev

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/MaskirovkaOtdel/CrypticMechanic.git
   cd CrypticMechanic
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run Web Dev Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to the address shown in the terminal (usually `http://localhost:5173`).

---

## 🖥️ Desktop App (Electron)

CrypticMechanic can run as a standalone desktop application.

### Run Desktop in Development
To run the Vite dev server bundled inside an Electron window:
```bash
npm run electron:dev
```

### Build Portable Windows Executable
To package the app into a single, self-contained executable (`CrypticMechanic-Portable.exe`):
```bash
npm run electron:build
```
The resulting executable will be saved in the `release/` directory. Double-click it to run without installing or starting any terminal scripts.

---

## ⚙️ Configuration & Settings

To access customization options, click the **Settings (Gear)** icon in the top header.

- **API Key**:
  - Obtain a free API key from [Google AI Studio](https://aistudio.google.com/apikey) and paste it into the field.
  - Use the eye toggle button to view or obscure your key.
  - Your key is stored locally in your browser/app's `localStorage` and is never shared or transmitted anywhere else except directly to Google's API endpoint.
- **Model Choice**:
  - `gemini-3-flash` (Default / Recommended - Fastest & Next-Gen)
  - `gemini-3-pro` (Deepest Reasoning / Complex Stack Traces)
  - `gemini-2.5-flash` (Balanced & Fast)
  - `gemini-2.5-flash-lite` (Cheapest)
  - `gemini-2.5-pro` (High Capability)
  - `Custom Model ID...` (Enter any custom model name)
- **Prompt Customizer**: Adjust the Detail Level, Response Format, and Tone to modify the system prompt.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with 💻 by **Thodoris Efstathiadis** (`MaskirovkaOtdel`).
