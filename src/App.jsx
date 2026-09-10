import { useState, useEffect } from 'react';
import {
  Settings, Sparkles, FileTerminal, AlertCircle,
  Download, Terminal, Key, Copy, Check, Trash2,
  History, ClipboardPaste, ArrowRight, BookOpen, X
} from 'lucide-react';
import SettingsPanel from './components/SettingsPanel';
import MarkdownRenderer from './components/MarkdownRenderer';
import { translateError } from './lib/gemini';
import {
  loadSettings, saveSettings,
  loadHistory, saveHistoryItem, clearHistory
} from './lib/settings';
import { SAMPLE_ERRORS } from './lib/sampleErrors';
import './App.css';

function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState(loadHistory);
  const [logs, setLogs] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
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

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setLogs(text);
      }
    } catch {
      // Clipboard permissions denied or unavailable
    }
  };

  const handleCopyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSelectSample = (sampleLog) => {
    setLogs(sampleLog);
    setError('');
  };

  const handleLoadHistoryItem = (item) => {
    setLogs(item.logs);
    setResult(item.result);
    setError('');
    setIsHistoryOpen(false);
  };

  const handleTranslate = async () => {
    if (!logs.trim()) return;

    if (!settings.apiKey) {
      setError('No API key configured. Click Settings (⚙) in the top-right to add your Gemini API key.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const response = await translateError(logs, settings);
      setResult(response);

      if (settings.saveHistory !== false) {
        const updated = saveHistoryItem({
          logs,
          result: response,
          model: settings.model,
        });
        setHistory(updated);
      }
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
          <img src="./icon.png" alt="CrypticMechanic" className="brand-logo" />
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
            className={`btn-icon ${isHistoryOpen ? 'active' : ''}`}
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            title="History"
            aria-label="Toggle history panel"
          >
            <History size={20} />
          </button>
          <button
            className="btn-icon"
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
            aria-label="Open settings panel"
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
          <div className="section-toolbar">
            <div className="section-label">
              <Terminal size={14} />
              Input Logs
            </div>
            <div className="toolbar-actions">
              <button
                className="btn-text-action"
                onClick={handlePasteClipboard}
                title="Paste from clipboard"
              >
                <ClipboardPaste size={13} />
                Paste
              </button>
              {logs && (
                <button
                  className="btn-text-action"
                  onClick={() => setLogs('')}
                  title="Clear input"
                >
                  <Trash2 size={13} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Presets / Samples */}
          <div className="presets-bar">
            <span className="presets-label">
              <BookOpen size={12} />
              Presets:
            </span>
            <div className="presets-list">
              {SAMPLE_ERRORS.map((s) => (
                <button
                  key={s.id}
                  className="preset-chip"
                  onClick={() => handleSelectSample(s.log)}
                  title={s.description}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="log-textarea"
            placeholder="Paste your cryptic stack trace, terminal output, or error log here... or select a preset above."
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
          <div className="section-toolbar" style={{ marginBottom: '14px' }}>
            <div className="section-label">
              <Sparkles size={14} />
              Analysis
            </div>
            {result && (
              <button
                className="btn-secondary copy-btn"
                onClick={handleCopyResult}
                title="Copy full analysis markdown"
              >
                {copied ? (
                  <>
                    <Check size={13} style={{ color: 'var(--success)' }} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    Copy
                  </>
                )}
              </button>
            )}
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
                <p>Paste an error log on the left or try one of the <strong>Presets</strong>, then hit <strong>Translate</strong>.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ─── STATUS BAR ─── */}
      <div className="status-bar">
        <span>Model: {settings.model} · {settings.detail} · {settings.tone}</span>
        <span>CrypticMechanic v1.0.1</span>
      </div>

      {/* ─── HISTORY DRAWER ─── */}
      <div
        className={`settings-overlay ${isHistoryOpen ? 'open' : ''}`}
        onClick={() => setIsHistoryOpen(false)}
      />
      <div className={`history-panel ${isHistoryOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2><History size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Recent History</h2>
          <button className="btn-icon" onClick={() => setIsHistoryOpen(false)} aria-label="Close history">
            <X size={20} />
          </button>
        </div>
        <div className="history-body">
          {history.length === 0 ? (
            <div className="history-empty">
              <p>No recent translations recorded.</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="history-card"
                  onClick={() => handleLoadHistoryItem(item)}
                >
                  <div className="history-card-header">
                    <span className="history-card-date">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    <ArrowRight size={14} className="history-card-icon" />
                  </div>
                  <pre className="history-card-preview">{item.logs.slice(0, 100).trim()}...</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── SETTINGS PANEL ─── */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        historyCount={history.length}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}

export default App;
