import { AIProvider } from './AIProvider.js';
import {
  translateErrorStream,
  translateError,
  resolveModelName,
  getLastSuccessfulModel,
} from '../gemini.js';

export const GEMINI_MODELS = [
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Recommended - Ultra-Fast & Lightweight)', isDefault: true },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash (Fast & General Diagnostics)' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Balanced Speed & Reasoning)' },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro (Deep Reasoning & Complex Stacks)' },
  { id: 'gemini-3.5-pro', name: 'Gemini 3.5 Pro (Advanced Architecture & System Analysis)' },
  { id: 'custom', name: 'Custom Model ID...' },
];

/**
 * Google Gemini cloud provider implementation.
 * Wraps existing gemini.js logic with 100% backward compatibility.
 */
export class GeminiProvider extends AIProvider {
  constructor() {
    super({
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Cloud-based Google Gemini 3 family generative models (BYOK).',
      isLocal: false,
      requiresApiKey: true,
      defaultModel: 'gemini-3.5-flash-lite',
      capabilities: {
        streaming: true,
        modelListing: true,
        configurableEndpoint: false,
      },
    });
  }

  validateConfig(settings = {}) {
    const apiKey = (settings?.apiKey || '').trim();
    if (!apiKey) {
      return {
        valid: false,
        error: 'No API key configured. Click Settings (⚙) in the top-right to add your Gemini API key.',
      };
    }
    return { valid: true };
  }

  async streamAnalyze(logsOrOptions, settings, onChunk) {
    let logs = logsOrOptions;
    let actualSettings = settings;
    let actualOnChunk = onChunk;

    if (typeof logsOrOptions === 'object' && logsOrOptions !== null && 'logs' in logsOrOptions) {
      logs = logsOrOptions.logs;
      actualSettings = logsOrOptions.settings;
      actualOnChunk = logsOrOptions.onChunk;
    }

    return translateErrorStream(logs, actualSettings, actualOnChunk);
  }

  async analyze(logsOrOptions, settings) {
    let logs = logsOrOptions;
    let actualSettings = settings;

    if (typeof logsOrOptions === 'object' && logsOrOptions !== null && 'logs' in logsOrOptions) {
      logs = logsOrOptions.logs;
      actualSettings = logsOrOptions.settings;
    }

    return translateError(logs, actualSettings);
  }

  async testConnection(settings = {}) {
    const apiKey = (settings?.apiKey || '').trim();
    if (!apiKey) {
      return { ok: false, message: 'Missing Gemini API key.' };
    }
    return { ok: true, message: 'Gemini API key configured.' };
  }

  async listModels() {
    return GEMINI_MODELS;
  }

  resolveModel(settings = {}) {
    return resolveModelName(settings);
  }

  getLastUsedModel() {
    return getLastSuccessfulModel();
  }
}
