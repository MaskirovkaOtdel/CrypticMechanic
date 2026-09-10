import { useState } from 'react';
import { X, Key, SlidersHorizontal, Trash2, Database, Eye, EyeOff } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';

const DETAIL_OPTIONS = ['Concise', 'Standard', 'Thorough'];
const FORMAT_OPTIONS = ['Diagnosis + Fixes', 'Step-by-Step', 'Root Cause', 'Quick Fix'];
const TONE_OPTIONS = ['Professional', 'Friendly', 'ELI5'];

const MODEL_OPTIONS = [
  { value: 'gemini-3-flash', label: 'Gemini 3 Flash (Recommended - Fastest & Next-Gen)' },
  { value: 'gemini-3-pro', label: 'Gemini 3 Pro (Deepest Reasoning & Complex Stacks)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Balanced & Fast)' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (Cheapest)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (High Capability)' },
  { value: 'custom', label: 'Custom Model ID...' },
];

export default function SettingsPanel({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  historyCount = 0,
  onClearHistory,
}) {
  const [showApiKey, setShowApiKey] = useState(false);

  const update = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const isKnownPreset = MODEL_OPTIONS.some((m) => m.value === settings.model && m.value !== 'custom');
  const selectedModelValue = isKnownPreset ? settings.model : (settings.model ? 'custom' : 'gemini-2.5-flash');

  const customModelValue =
    settings.customModel || (!isKnownPreset && settings.model && settings.model !== 'custom' ? settings.model : '');

  return (
    <>
      <div
        className={`settings-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>
            <SlidersHorizontal size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Settings
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close Settings">
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          {/* API Key */}
          <div className="setting-group">
            <label>
              <Key size={12} style={{ marginRight: 4 }} />
              Gemini API Key
            </label>
            <p className="setting-desc">
              Get a free key from{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                Google AI Studio
              </a>
              . Stored locally only in your browser/app.
            </p>
            <div className="api-key-input-wrapper">
              <input
                type={showApiKey ? 'text' : 'password'}
                className="input-field api-key-input"
                placeholder="Paste your API key here..."
                value={settings.apiKey || ''}
                onChange={(e) => update('apiKey', e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="api-key-toggle-btn"
                onClick={() => setShowApiKey(!showApiKey)}
                title={showApiKey ? 'Hide API key' : 'Show API key'}
                aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Model */}
          <div className="setting-group">
            <label>AI Model</label>
            <p className="setting-desc">Select a Gemini 3 or 2.5 series model or enter a custom model identifier.</p>
            <select
              className="select-field"
              value={selectedModelValue}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'custom') {
                  update('model', 'custom');
                } else {
                  update('model', val);
                }
              }}
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            {selectedModelValue === 'custom' && (
              <div className="custom-model-wrapper" style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter custom model ID (e.g. gemini-3.1-pro, gemini-2.5-flash-preview)..."
                  value={customModelValue}
                  onChange={(e) => {
                    const nextCustom = e.target.value;
                    onSettingsChange({
                      ...settings,
                      model: 'custom',
                      customModel: nextCustom,
                    });
                  }}
                />
                <p className="setting-desc" style={{ marginTop: '4px', fontSize: '11px' }}>
                  Enter a custom Gemini model identifier (e.g. gemini-3.1-pro). Defaults to gemini-2.5-flash if left blank.
                </p>
              </div>
            )}
          </div>

          {/* Detail Level */}
          <div className="setting-group">
            <label>Detail Level</label>
            <div className="segmented-control">
              {DETAIL_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={settings.detail === opt ? 'active' : ''}
                  onClick={() => update('detail', opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Response Format */}
          <div className="setting-group">
            <label>Response Format</label>
            <div className="segmented-control">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={settings.format === opt ? 'active' : ''}
                  onClick={() => update('format', opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="setting-group">
            <label>Tone</label>
            <div className="segmented-control">
              {TONE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={settings.tone === opt ? 'active' : ''}
                  onClick={() => update('tone', opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <ThemeSwitcher
            currentTheme={settings.theme}
            onThemeChange={(t) => update('theme', t)}
          />

          {/* History / Privacy */}
          <div className="setting-group" style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
            <label>
              <Database size={12} style={{ marginRight: 4 }} />
              Privacy & History
            </label>
            <p className="setting-desc">
              Store recent analyses on this machine to easily reference past errors.
            </p>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                textTransform: 'none',
                color: 'var(--text-secondary)',
              }}
            >
              <input
                type="checkbox"
                checked={settings.saveHistory !== false}
                onChange={(e) => update('saveHistory', e.target.checked)}
                style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              Record translations to local history ({historyCount} saved)
            </label>
            {historyCount > 0 && onClearHistory && (
              <button
                className="btn-secondary"
                onClick={onClearHistory}
                style={{ marginTop: '8px', width: 'fit-content', color: 'var(--error)' }}
              >
                <Trash2 size={13} />
                Clear Local History
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
