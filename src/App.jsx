import { useState, useEffect } from 'react';
import {
  Settings, Sparkles, FileTerminal, AlertCircle,
  Download, Terminal, Key
} from 'lucide-react';
import SettingsPanel from './components/SettingsPanel';
import MarkdownRenderer from './components/MarkdownRenderer';
import { translateError } from './lib/gemini';
import { loadSettings, saveSettings } from './lib/settings';
import './App.css';

function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [logs, setLogs] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleSettingsChange = (next) => {
    setSettings(next);
    saveSettings(next);
  };

  const handleTranslate = async () => {
    if (!logs.trim()) return;

    if (!settings.apiKey) {
      setError('No API key configured. Click the ⚙ Settings icon in the top-right to add your Gemini API key.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const response = await translateError(logs, settings);
      setResult(response);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Translation failed. Check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasApiKey = Boolean(settings.apiKey);

  return (
    <div className="app-container">
      {/* ─── HEADER ─── */}
      <header className="app-header">
        <div className="brand">
          <img src="/icon.png" alt="CrypticMechanic" className="brand-logo" />
          <span className="brand-text">CrypticMechanic</span>
          <span className="brand-tag">AI</span>
        </div>
        <div className="header-actions">
          {deferredPrompt && (
            <button className="btn-secondary" onClick={handleInstallClick}>
              <Download size={14} />
              Install
            </button>
          )}
          <button
            className="btn-icon"
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* ─── NO API KEY BANNER ─── */}
      {!hasApiKey && (
        <div className="no-key-banner">
          <Key size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span>Add your Gemini API key in Settings to start translating errors.</span>
          <button className="btn-secondary" onClick={() => setIsSettingsOpen(true)}>
            Open Settings
          </button>
        </div>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <main className="main-content">
        {/* INPUT */}
        <section className="input-section glass-panel">
          <div className="section-label">
            <Terminal size={14} />
            Input Logs
          </div>
          <textarea
            className="log-textarea"
            placeholder="Paste your cryptic stack trace, terminal output, or error log here..."
            value={logs}
            onChange={(e) => setLogs(e.target.value)}
          />
          <div className="input-footer">
            <button
              className="btn-primary"
              onClick={handleTranslate}
              disabled={isLoading || !logs.trim()}
            >
              {isLoading ? (
                <>
                  <Settings size={18} className="spinner" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Translate
                </>
              )}
            </button>
            <span className="char-count">{logs.length.toLocaleString()} chars</span>
          </div>
        </section>

        {/* OUTPUT */}
        <section className="output-section glass-panel">
          <div className="section-label" style={{ marginBottom: '14px' }}>
            <Sparkles size={14} />
            Analysis
          </div>
          <div className="output-body">
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-dots">
                  <span></span><span></span><span></span>
                </div>
                <p className="loading-text">CrypticMechanic is analyzing your logs...</p>
              </div>
            ) : error ? (
              <div className="output-error">
                <AlertCircle size={40} className="error-icon" />
                <p>{error}</p>
                {!hasApiKey && (
                  <p className="error-hint">
                    You can get a free API key from{' '}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                      Google AI Studio
                    </a>
                  </p>
                )}
              </div>
            ) : result ? (
              <MarkdownRenderer content={result} />
            ) : (
              <div className="output-empty">
                <FileTerminal size={44} className="pulse" />
                <p>Paste an error log on the left and hit <strong>Translate</strong> to decode it.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ─── STATUS BAR ─── */}
      <div className="status-bar">
        <span>Model: {settings.model} · {settings.detail} · {settings.tone}</span>
        <span>CrypticMechanic v1.0</span>
      </div>

      {/* ─── SETTINGS PANEL ─── */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}

export default App;
