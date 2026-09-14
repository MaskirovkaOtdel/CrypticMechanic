import { AIProvider } from './AIProvider.js';
import {
  translateErrorStream,
  translateError,
  resolveModelName,
} from '../gemini.js';

export const GEMINI_MODELS = [
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash (Recommended - Fastest & Next-Gen)', isDefault: true },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro (Deepest Reasoning & Complex Stacks)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Balanced & Fast)' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (Cheapest)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (High Capability)' },
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
      description: 'Cloud-based Google Gemini 3 and 2.5 generative models (BYOK).',
      isLocal: false,
      requiresApiKey: true,
      defaultModel: 'gemini-3-flash',
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
}
