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

- **Intuitive UI/UX**: Paste your raw logs and get a side-by-side or clean stacked layout showing a precise **Diagnosis** and a checkable list of **Actionable Fixes**.
- **Highly Customisable Outputs**: Customise how your responses are generated via the settings panel:
  - **Detail Level**: Choose between *Concise* (fast checklist), *Balanced*, or *Exhaustive* (deep explanation).
  - **Response Style**: Toggle between *Technical/Actionable*, *Explain Like I'm Five (ELI5)*, or *Mentor/Educational*.
  - **Response Tone**: Match your mood with *Troubleshooter* (professional), *Encouraging*, or *Humorous* logs translator.
- **5 Premium CompSci & SWE Themes**:
  - 🌌 **Midnight Terminal** (Default) – Sleek, high-contrast dark theme.
  - 🚨 **Kernel Panic** – Vibrant, error-state dark theme with deep crimson accents.
  - 📟 **Circuit Board** – Classic matrix-green console vibe.
  - 🟦 **Blue Screen** – Nostalgic retro BSOD crash theme.
  - 🥼 **Clean Room** – Sleek, premium light theme for crisp day reading.
- **Model Control**: Switch models based on your pricing and preference. Defaults to `gemini-2.0-flash-lite` for the most cost-effective and lightning-fast translations.
- **Dual API Access**: Run out of the box using built-in free-tier settings, or supply your own private Google Gemini API Key (stored safely in your local browser/app environment).
- **Offline & Desktop Native**:
  - **Electron Portable App**: Downloadable, zero-install portable `.exe` executable for Windows.
  - **PWA Ready**: Installable directly onto your system from Chromium-based browsers.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 19, Vite 8, Javascript (ESM)
- **Styling**: Vanilla CSS with custom properties (CSS variables) for robust real-time theme swapping.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown Rendering**: `react-markdown` with code syntax highlighting using `react-syntax-highlighter` (prism styling).
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
  - By default, the app can run using a built-in proxy key (subject to rate limits and availability).
  - For unlimited personal usage, obtain a free API key from the [Google AI Studio](https://aistudio.google.com/) and paste it into the field. Your key is stored locally in your app's localStorage and is never shared or transmitted anywhere else except directly to Google's API endpoint.
- **Model Choice**:
  - `gemini-2.0-flash-lite` (Recommended / Cheapest / Fast)
  - `gemini-2.0-flash`
  - `gemini-1.5-flash`
  - `gemini-1.5-pro` (Detailed analysis)
- **Prompt Customizer**: Adjust the sliders and dropdowns to modify the system prompt. The app dynamically rewrites instruction structures based on your choices.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](file:///c:/Users/User/Desktop/CrypticMechanic/LICENSE) file for details.

Developed with 💻 by **Thodoris Efstathiadis** (`MaskirovkaOtdel`).
