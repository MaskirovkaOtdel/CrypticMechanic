export const DEFAULT_SETTINGS = {
  apiKey: '',
  detail: 'Standard',
  format: 'Diagnosis + Fixes',
  tone: 'Professional',
  model: 'gemini-2.5-flash',
  customModel: '',
  theme: 'midnight-terminal',
  saveHistory: true,
};

const HISTORY_KEY = 'CM_HISTORY';
const MAX_HISTORY_ITEMS = 30;

export function loadSettings() {
  try {
    const saved = localStorage.getItem('CM_SETTINGS');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate legacy default model to current standard default
      if (parsed.model === 'gemini-2.0-flash-lite') {
        parsed.model = 'gemini-2.5-flash';
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    // Migrate old API key if present
    const oldKey = localStorage.getItem('GEMINI_API_KEY');
    if (oldKey) {
      return { ...DEFAULT_SETTINGS, apiKey: oldKey };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  // Always sanitize the apiKey (strip accidental whitespace)
  const sanitized = {
    ...settings,
    apiKey: settings.apiKey ? settings.apiKey.trim() : '',
  };
  localStorage.setItem('CM_SETTINGS', JSON.stringify(sanitized));
}

export function loadHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(item) {
  try {
    const history = loadHistory();
    const newItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...item,
    };
    // Keep most recent first, capped at MAX_HISTORY_ITEMS
    const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteHistoryItem(id) {
  try {
    const history = loadHistory();
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return loadHistory();
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch { /* ignore */ }
  return [];
}
