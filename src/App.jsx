import { useState, useEffect } from 'react';
import {
  Settings, Sparkles, FileTerminal, AlertCircle,
  Download, Terminal, Key, Copy, Check, Trash2,
  History, ClipboardPaste, ArrowRight, BookOpen, X
} from 'lucide-react';
import SettingsPanel from './components/SettingsPanel';
import MarkdownRenderer from './components/MarkdownRenderer';
import { copyTextToClipboard } from './lib/clipboard';
import { resolveModelName } from './lib/gemini';
import { getActiveProvider } from './lib/providers/providerRegistry';
import { initExtensions, getUIHooks } from './lib/extensionRegistry';
import {
  loadSettings, saveSettings,
  loadHistory, saveHistoryItem, deleteHistoryItem, clearHistory
} from './lib/settings';
import { SAMPLE_ERRORS } from './lib/sampleErrors';
import './App.css';

// Initialize auto-discovered extensions at startup
initExtensions();

function formatModelBadge(modelName) {
  if (!modelName) return '3 Flash';
  if (modelName === 'gemini-3-flash') return '3 Flash';
  if (modelName === 'gemini-3-pro') return '3 Pro';
  if (modelName === 'gemini-2.5-flash') return '2.5 Flash';
  if (modelName === 'gemini-2.5-flash-lite') return '2.5 Flash Lite';
  if (modelName === 'gemini-2.5-pro') return '2.5 Pro';
  if (modelName === 'gemini-2.0-flash') return '2.0 Flash';
  if (modelName === 'gemini-2.0-flash-lite') return '2.0 Flash Lite';
  return modelName.replace(/^gemini-/, '');
}

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
  const [isDragging, setIsDragging] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Global Escape shortcut to close drawers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isSettingsOpen || isHistoryOpen) {
          setIsSettingsOpen(false);
          setIsHistoryOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isHistoryOpen]);

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

  const handleDeleteHistory = (e, id) => {
    e.stopPropagation();
    const updated = deleteHistoryItem(id);
    setHistory(updated);
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
    const success = await copyTextToClipboard(result);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CrypticMechanic-Analysis.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

    const activeProvider = getActiveProvider(settings);
    const configValidation = activeProvider.validateConfig(settings);
    if (!configValidation.valid) {
      setError(configValidation.error || 'Invalid configuration. Please check Settings (⚙).');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    let streamBuffer = '';
    const activeModel = activeProvider.resolveModel ? activeProvider.resolveModel(settings) : (settings.model || resolveModelName(settings));

    try {
      const finalResponse = await activeProvider.streamAnalyze(logs, settings, (accumulated) => {
        streamBuffer = accumulated;
        setResult(accumulated);
      });

      const outcome = finalResponse || streamBuffer;
      if (outcome) {
        setResult(outcome);
      }

      if (settings.saveHistory !== false && outcome) {
        const updated = saveHistoryItem({
          logs,
          result: outcome,
          model: activeModel,
          provider: activeProvider.id,
        });
        setHistory(updated);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Translation failed. Check your settings and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextareaKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && logs.trim()) {
        handleTranslate();
      }
    }
  };

  // Drag-and-drop log file loading with boundary check & binary/size safety
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('The dropped file exceeds the 5 MB limit. Please provide a smaller log excerpt.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          if (content.slice(0, 4096).includes('\0')) {
            setError('The dropped file appears to be a binary file. Please drop a plain text or log file.');
            return;
          }
          setLogs(content);
          setError('');
        }
      };
      reader.onerror = () => {
        setError('Failed to read the dropped file. Please try again.');
      };
      reader.readAsText(file);
    }
  };

  const activeProvider = getActiveProvider(settings);
  const providerValidation = activeProvider.validateConfig(settings);
  const isConfigValid = providerValidation.valid;
  const uiHooks = getUIHooks();
  const customBadge = uiHooks.badges?.[0];
  const charCount = logs.length;
  const tokenCount = charCount > 0 ? Math.ceil(charCount / 4) : 0;
  const activeModelDisplay = activeProvider.resolveModel ? activeProvider.resolveModel(settings) : (settings.model || resolveModelName(settings));

  return (
    <div className="app-container">
      {/* ─── HEADER ─── */}
      <header className="app-header">
        <div className="brand">
          <img src="./icon.png" alt="CrypticMechanic" className="brand-logo" />
          <span className="brand-text">CrypticMechanic</span>
          <span className={`brand-tag ${customBadge?.className || ''}`.trim()}>
            {customBadge?.text || 'AI'}
          </span>
        </div>
        <div className="header-actions">
          {uiHooks.headerActions?.map((ActionComp, i) => (
            <ActionComp key={i} settings={settings} />
          ))}
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

      {/* ─── NO API KEY / CONFIG BANNER ─── */}
      {!isConfigValid && activeProvider.requiresApiKey && (
        <div className="no-key-banner">
          <Key size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span>Add your {activeProvider.name} API key in Settings to start translating errors.</span>
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

          <div
            className={`textarea-wrapper ${isDragging ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              className="log-textarea"
              placeholder="Paste your cryptic stack trace, terminal output, or error log here... or drag & drop a log file, or select a preset above. (Ctrl+Enter to Translate)"
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
            {isDragging && (
              <div className="drag-drop-overlay">
                <FileTerminal size={36} />
                <span>Drop log file here to load</span>
              </div>
            )}
          </div>

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
            <span className="char-count">
              {charCount.toLocaleString()} chars (~{tokenCount.toLocaleString()} tokens)
            </span>
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
              <div className="toolbar-actions">
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
                      Copy Markdown
                    </>
                  )}
                </button>
                <button
                  className="btn-secondary copy-btn"
                  onClick={handleDownloadMarkdown}
                  title="Download analysis as CrypticMechanic-Analysis.md"
                >
                  <Download size={13} />
                  Download .md
                </button>
              </div>
            )}
          </div>

          <div className="output-body">
            {isLoading && !result ? (
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
                {!isConfigValid && activeProvider.requiresApiKey && (
                  <p className="error-hint">
                    You can get a free API key from{' '}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)' }}
                    >
                      Google AI Studio
                    </a>
                  </p>
                )}
              </div>
            ) : result ? (
              <div className="analysis-result-wrapper">
                <MarkdownRenderer content={result} />
                {isLoading && (
                  <span className="streaming-cursor" title="Streaming generation...">
                    ▋
                  </span>
                )}
              </div>
            ) : (
              <div className="output-empty">
                <FileTerminal size={44} className="pulse" />
                <p>
                  Paste an error log on the left, drag & drop a log file, or try one of the{' '}
                  <strong>Presets</strong>, then hit <strong>Translate</strong>.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ─── STATUS BAR ─── */}
      <div className="status-bar">
        <span>
          {activeProvider.isLocal ? `${activeProvider.name} · ` : ''}Model: {activeModelDisplay} · {settings.detail} · {settings.tone}
        </span>
        <span>
          {uiHooks.statusBarItems?.map((ItemComp, i) => (
            <ItemComp key={i} settings={settings} />
          ))}
          CrypticMechanic v1.1.0
        </span>
      </div>

      {/* ─── HISTORY DRAWER ─── */}
      <div
        className={`settings-overlay ${isHistoryOpen ? 'open' : ''}`}
        onClick={() => setIsHistoryOpen(false)}
      />
      <div className={`history-panel ${isHistoryOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>
            <History size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Recent History
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {history.length > 0 && (
              <button
                type="button"
                className="btn-icon"
                onClick={handleClearHistory}
                title="Clear all history"
                aria-label="Clear all history"
                style={{ color: 'var(--error)' }}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button className="btn-icon" onClick={() => setIsHistoryOpen(false)} aria-label="Close history">
              <X size={20} />
            </button>
          </div>
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
                    <div className="history-card-meta">
                      <span className="history-model-badge">
                        {formatModelBadge(item.model)}
                      </span>
                      <span className="history-card-date">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="history-card-actions">
                      <button
                        type="button"
                        className="history-delete-btn"
                        onClick={(e) => handleDeleteHistory(e, item.id)}
                        title="Delete this history item"
                        aria-label="Delete history item"
                      >
                        <Trash2 size={13} />
                      </button>
                      <ArrowRight size={14} className="history-card-icon" />
                    </div>
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
