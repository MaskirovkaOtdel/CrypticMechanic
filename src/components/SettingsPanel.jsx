import { X, Key, SlidersHorizontal } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';

const DETAIL_OPTIONS = ['Concise', 'Standard', 'Thorough'];
const FORMAT_OPTIONS = ['Diagnosis + Fixes', 'Step-by-Step', 'Root Cause', 'Quick Fix'];
const TONE_OPTIONS = ['Professional', 'Friendly', 'ELI5'];
const MODEL_OPTIONS = [
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (Cheapest)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Most Capable)' },
];

export default function SettingsPanel({ isOpen, onClose, settings, onSettingsChange }) {
  const update = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <>
      <div
        className={`settings-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2><SlidersHorizontal size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Settings</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          {/* API Key */}
          <div className="setting-group">
            <label><Key size={12} style={{ marginRight: 4 }} />Gemini API Key</label>
            <p className="setting-desc">
              Get a free key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Google AI Studio</a>. Stored locally only.
            </p>
            <input
              type="password"
              className="input-field"
              placeholder="Paste your API key here..."
              value={settings.apiKey}
              onChange={(e) => update('apiKey', e.target.value)}
            />
          </div>

          {/* Model */}
          <div className="setting-group">
            <label>AI Model</label>
            <p className="setting-desc">Cheaper models use less of your free-tier quota.</p>
            <select
              className="select-field"
              value={settings.model}
              onChange={(e) => update('model', e.target.value)}
            >
              {MODEL_OPTIONS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Detail Level */}
          <div className="setting-group">
            <label>Detail Level</label>
            <div className="segmented-control">
              {DETAIL_OPTIONS.map(opt => (
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
              {FORMAT_OPTIONS.map(opt => (
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
              {TONE_OPTIONS.map(opt => (
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
        </div>
      </div>
    </>
  );
}
