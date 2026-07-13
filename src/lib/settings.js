export const DEFAULT_SETTINGS = {
  apiKey: '',
  detail: 'Standard',
  format: 'Diagnosis + Fixes',
  tone: 'Professional',
  model: 'gemini-2.0-flash-lite',
  theme: 'midnight-terminal',
};

export function loadSettings() {
  try {
    const saved = localStorage.getItem('CM_SETTINGS');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
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
  localStorage.setItem('CM_SETTINGS', JSON.stringify(settings));
}
