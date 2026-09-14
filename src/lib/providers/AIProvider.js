/**
 * Base contract for AI Providers in CrypticMechanic.
 * Subclasses must implement streamAnalyze() and may override validateConfig(), listModels(), testConnection(), and renderSettings().
 */
export class AIProvider {
  /**
   * @param {Object} config
   * @param {string} config.id Unique provider identifier (e.g. 'gemini', 'ollama')
   * @param {string} config.name Human-readable display name (e.g. 'Google Gemini', 'Ollama (Local Offline)')
   * @param {string} [config.description] Provider description
   * @param {boolean} [config.isLocal=false] Whether provider runs locally on-device
   * @param {boolean} [config.requiresApiKey=true] Whether provider requires an API key
   * @param {string} [config.defaultModel=''] Default model ID
   * @param {Object} [config.capabilities={}] Extended capability flags
   */
  constructor({
    id,
    name,
    description = '',
    isLocal = false,
    requiresApiKey = true,
    defaultModel = '',
    capabilities = {},
  } = {}) {
    if (new.target === AIProvider) {
      throw new TypeError('Cannot instantiate abstract class AIProvider directly; please extend it.');
    }
    if (!id || !name) {
      throw new Error('AIProvider requires an id and name.');
    }
    this.id = id;
    this.name = name;
    this.description = description;
    this.isLocal = Boolean(isLocal);
    this.requiresApiKey = Boolean(requiresApiKey);
    this.defaultModel = defaultModel;
    this.capabilities = Object.freeze({
      isLocal: this.isLocal,
      requiresApiKey: this.requiresApiKey,
      streaming: true,
      modelListing: false,
      configurableEndpoint: false,
      ...capabilities,
    });
  }

  /**
   * Stream analysis of error logs.
   * Accepts (logs, settings, onChunk, signal) or ({ logs, settings, onChunk, signal }).
   * @param {string|Object} _logsOrOptions
   * @param {Object} [_settings]
   * @param {(accumulated: string, chunk: string) => void} [_onChunk]
   * @param {AbortSignal} [_signal]
   * @returns {Promise<string>}
   */
  // eslint-disable-next-line no-unused-vars
  async streamAnalyze(_logsOrOptions, _settings, _onChunk, _signal) {
    throw new Error(`streamAnalyze() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Non-streaming analysis fallback.
   * @param {string|Object} logsOrOptions
   * @param {Object} [settings]
   * @param {AbortSignal} [signal]
   * @returns {Promise<string>}
   */
  async analyze(logsOrOptions, settings, signal) {
    let logs = logsOrOptions;
    let actualSettings = settings;
    let actualSignal = signal;
    if (typeof logsOrOptions === 'object' && logsOrOptions !== null && 'logs' in logsOrOptions) {
      logs = logsOrOptions.logs;
      actualSettings = logsOrOptions.settings;
      actualSignal = logsOrOptions.signal;
    }
    let accumulated = '';
    const res = await this.streamAnalyze(logs, actualSettings, (curr) => {
      accumulated = curr;
    }, actualSignal);
    return res || accumulated;
  }

  /**
   * Health probe / connection test.
   * @param {Object} [_settings]
   * @returns {Promise<{ ok: boolean, message: string, details?: any }>}
   */
  // eslint-disable-next-line no-unused-vars
  async testConnection(_settings = {}) {
    return { ok: true, message: 'Ready' };
  }

  /**
   * Enumerate available models for this provider.
   * @param {Object} [_settings]
   * @returns {Promise<Array<{ id: string, name: string, description?: string, isDefault?: boolean }>>}
   */
  // eslint-disable-next-line no-unused-vars
  async listModels(_settings = {}) {
    return [];
  }

  /**
   * Validate configuration prior to execution.
   * @param {Object} [settings]
   * @returns {{ valid: boolean, error?: string }}
   */
  validateConfig(settings = {}) {
    if (this.requiresApiKey && !settings?.apiKey?.trim()) {
      return {
        valid: false,
        error: `No API key configured for ${this.name}. Click Settings (⚙) in the top-right to configure it.`,
      };
    }
    return { valid: true };
  }

  /**
   * Optional custom settings UI renderer hook.
   * @param {Object} [_props] { settings, onSettingsChange, update }
   * @returns {any}
   */
  // eslint-disable-next-line no-unused-vars
  renderSettings(_props) {
    return null;
  }

  /**
   * Returns default settings/config for this provider.
   * @returns {Object}
   */
  getDefaultConfig() {
    return {
      model: this.defaultModel,
    };
  }
}
