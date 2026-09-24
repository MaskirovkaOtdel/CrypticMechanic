export const DEFAULT_SETTINGS = {
  provider: 'gemini',
  apiKey: '',
  detail: 'Standard',
  format: 'Diagnosis + Fixes',
  tone: 'Professional',
  model: 'gemini-3-flash',
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
      // Migrate legacy default models to current standard default
      if (parsed.model === 'gemini-2.0-flash-lite' || parsed.model === 'gemini-2.5-flash') {
        parsed.model = 'gemini-3-flash';
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

export function filterHistory(history, query = '', modelFilter = 'All') {
  if (!Array.isArray(history)) return [];
  const q = (query || '').trim().toLowerCase();
  const m = (modelFilter || 'All').trim().toLowerCase();

  return history.filter((item) => {
    if (!item) return false;

    // Model filter check
    if (m && m !== 'all') {
      const itemModel = (item.model || '').toLowerCase();
      const normalizedBadge = (
        itemModel === 'gemini-3-flash' ? '3 flash' :
        itemModel === 'gemini-3-pro' ? '3 pro' :
        itemModel === 'gemini-2.5-flash' ? '2.5 flash' :
        itemModel === 'gemini-2.5-flash-lite' ? '2.5 flash lite' :
        itemModel === 'gemini-2.5-pro' ? '2.5 pro' :
        itemModel === 'gemini-2.0-flash' ? '2.0 flash' :
        itemModel === 'gemini-2.0-flash-lite' ? '2.0 flash lite' :
        itemModel.replace(/^gemini-/, '')
      ).toLowerCase();

      const matchesModel =
        itemModel === m ||
        normalizedBadge === m ||
        itemModel.includes(m) ||
        normalizedBadge.includes(m) ||
        m.includes(normalizedBadge) ||
        m.includes(itemModel);

      if (!matchesModel) return false;
    }

    // Query filter check across logs, diagnosis/result, and model name
    if (q) {
      const logs = (item.logs || '').toLowerCase();
      const result = (item.result || item.diagnosis || '').toLowerCase();
      const model = (item.model || '').toLowerCase();
      if (!logs.includes(q) && !result.includes(q) && !model.includes(q)) {
        return false;
      }
    }

    return true;
  });
}

export function exportHistoryAsJSON(history) {
  const data = history || loadHistory();
  const jsonString = JSON.stringify(data, null, 2);
  if (typeof document !== 'undefined' && typeof Blob !== 'undefined') {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `crypticmechanic-history-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // DOM download failed or not permitted in current environment
    }
  }
  return jsonString;
}

export function importHistoryFromJSON(jsonString) {
  try {
    const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid JSON format: expected an array of history items.');
    }
    const existing = loadHistory();
    const existingIds = new Set(existing.map((item) => String(item.id)));

    const validNewItems = parsed
      .filter((item) => item && typeof item === 'object' && typeof item.logs === 'string')
      .map((item, idx) => ({
        id: item.id ? String(item.id) : `${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: item.timestamp || new Date().toISOString(),
        logs: item.logs,
        result: item.result || item.diagnosis || '',
        model: item.model || 'gemini-3-flash',
        provider: item.provider || 'gemini',
      }))
      .filter((item) => !existingIds.has(item.id));

    const merged = [...validNewItems, ...existing].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
    return { success: true, count: validNewItems.length, history: merged };
  } catch (err) {
    return { success: false, count: 0, error: err.message, history: loadHistory() };
  }
}
