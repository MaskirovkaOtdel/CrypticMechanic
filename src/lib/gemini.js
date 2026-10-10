import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Canonical model aliases mapping friendly or legacy IDs to valid Google Generative AI endpoints.
 */
export const MODEL_ALIASES = {
  // Latest verified model from each Gemini 3 line
  'gemini-3.5-flash-lite': 'gemini-3.5-flash-lite-preview', // Default: low consumption / fast troubleshooting
  'gemini-3.8-flash': 'gemini-3.8-flash',                   // Flash line: in-depth / complex coding exploration
  'gemini-3.1-pro': 'gemini-3.1-pro-preview',               // Pro line: maximum diagnostic capacity
  'gemini-3-pro': 'gemini-3.1-pro-preview',

  // Legacy, deprecated, or older iterations transparently migrate to latest line equivalents
  'gemini-3-flash': 'gemini-3.8-flash',
  'gemini-3-flash-preview': 'gemini-3.8-flash',
  'gemini-3.5-flash': 'gemini-3.8-flash',
  'gemini-3.5-pro': 'gemini-3.1-pro-preview',
  'gemini-2.5-flash': 'gemini-3.5-flash-lite-preview',
  'gemini-2.5-flash-lite': 'gemini-3.5-flash-lite-preview',
  'gemini-2.0-flash': 'gemini-3.5-flash-lite-preview',
  'gemini-2.0-flash-lite': 'gemini-3.5-flash-lite-preview',
  'gemini-2.5-pro': 'gemini-3.1-pro-preview',
  'gemini-1.5-flash': 'gemini-3.5-flash-lite-preview',
  'gemini-1.5-pro': 'gemini-3.1-pro-preview',
  'gemini-pro': 'gemini-3.5-flash-lite-preview',
  'gemini-1.0-pro': 'gemini-3.5-flash-lite-preview',
  'gemini-1.5-flash-latest': 'gemini-3.5-flash-lite-preview',
  'gemini-1.5-pro-latest': 'gemini-3.1-pro-preview',
  'gemini-2.0-flash-exp': 'gemini-3.8-flash',
  'gemini-exp-1206': 'gemini-3.8-flash',
};

/**
 * Fallback chains when a selected model returns 404 (e.g. preview access not allowlisted).
 * Exclusively restricted to latest verified Gemini 3 models.
 */
export const MODEL_FALLBACKS = {
  'gemini-3.5-flash-lite': ['gemini-3.5-flash-lite-preview', 'gemini-3.8-flash', 'gemini-3.1-pro-preview'],
  'gemini-3.5-flash-lite-preview': ['gemini-3.8-flash', 'gemini-3.1-pro-preview'],
  'gemini-3.8-flash': ['gemini-3.5-flash-lite-preview', 'gemini-3.1-pro-preview'],
  'gemini-3.1-pro-preview': ['gemini-3.8-flash', 'gemini-3.5-flash-lite-preview'],
  'gemini-3.1-pro': ['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-3.5-flash-lite-preview'],
};

let lastSuccessfulModel = 'gemini-3.5-flash-lite';

export function getLastSuccessfulModel() {
  return lastSuccessfulModel;
}

export function setLastSuccessfulModel(model) {
  if (model && typeof model === 'string') {
    lastSuccessfulModel = model;
  }
}

/**
 * Helper to identify model unavailability, missing preview access, or 404 from Google API.
 */
export function isModelUnavailableError(err) {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('not_found') ||
    msg.includes('is not supported') ||
    msg.includes('unsupported model') ||
    msg.includes('does not exist') ||
    msg.includes('model not found') ||
    (msg.includes('model') && msg.includes('invalid')) ||
    (msg.includes('models/') && msg.includes('400'))
  );
}

/**
 * Resolve thinking budget in tokens based on user preference.
 */
export function resolveThinkingBudget(level) {
  switch (level) {
    case 'Off': return 0;
    case 'Low': return 1024;
    case 'Medium': return 4096;
    case 'High': return 8192;
    case 'Auto':
    default:
      return undefined;
  }
}

/**
 * Resolve the effective model identifier based on settings.
 */
export function resolveModelName(settings = {}) {
  let raw = settings.model === 'custom'
    ? (settings.customModel || '').trim() || 'gemini-3.5-flash-lite'
    : (settings.model || '').trim() || 'gemini-3.5-flash-lite';

  // Cross-provider hygiene: If an Ollama or non-Gemini model is set, default to gemini-3.5-flash-lite
  if (
    raw.includes(':') ||
    raw.startsWith('llama') ||
    raw.startsWith('qwen') ||
    raw.startsWith('mistral') ||
    raw.startsWith('deepseek')
  ) {
    raw = 'gemini-3.5-flash-lite';
  }

  return MODEL_ALIASES[raw] || raw;
}

/**
 * Return list of candidate models to try in order (primary + fallbacks).
 */
export function getModelFallbackCandidates(modelName) {
  const resolved = MODEL_ALIASES[modelName] || modelName;
  const fallbacks = MODEL_FALLBACKS[resolved] || MODEL_FALLBACKS[modelName] || [];
  return [resolved, ...fallbacks.map((f) => MODEL_ALIASES[f] || f)].filter(
    (m, idx, arr) => arr.indexOf(m) === idx
  );
}

/**
 * Build dynamic system instructions based on user settings (tone, detail, format).
 */
export function buildSystemInstruction(settings = {}) {
  const { detail, format, tone } = settings;

  // Tone instructions
  const toneMap = {
    Professional: 'Use a professional, technical troubleshooter tone. Be precise and authoritative.',
    Friendly: 'Use a friendly, approachable tone. Explain things clearly without jargon where possible.',
    ELI5: 'Explain as if the reader is a complete beginner. Use simple analogies and avoid technical jargon.',
  };

  // Detail level instructions
  const detailMap = {
    Concise: 'Keep your response brief and to the point. No more than 2-3 sentences per section.',
    Standard: 'Provide a balanced level of detail. Enough context to understand and act, but not verbose.',
    Thorough: 'Be very detailed and comprehensive. Explain the underlying mechanics, edge cases, and provide multiple solution paths.',
  };

  // Format instructions
  const formatMap = {
    'Diagnosis + Fixes': `Format your response as:

### Diagnosis
[Root cause explanation]

### Actionable Fixes
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3`,

    'Step-by-Step': `Format your response as a numbered step-by-step tutorial:

### Step-by-Step Resolution
1. **Step 1 Title** — Description
2. **Step 2 Title** — Description
3. **Step 3 Title** — Description`,

    'Root Cause': `Format your response as an in-depth root cause analysis:

### Root Cause Analysis
[Deep dive into what went wrong and why]

### Contributing Factors
[Additional context]

### Prevention
[How to prevent this in the future]`,

    'Quick Fix': `Format your response as a single, direct fix:

### Quick Fix
[One-liner or minimal code snippet to resolve the issue immediately]

### Why This Works
[1-2 sentence explanation]`,
  };

  return `You are CrypticMechanic — an expert developer troubleshooting assistant.

${toneMap[tone] || toneMap.Professional}

${detailMap[detail] || detailMap.Standard}

Analyze the error logs or stack trace provided by the user and respond using this exact format:

${formatMap[format] || formatMap['Diagnosis + Fixes']}`;
}

/**
 * Build user prompt payload.
 */
export function buildUserPrompt(logs) {
  const fence = String(logs).includes('```') ? '````' : '```';
  return `Analyze the following error logs or stack trace:

${fence}
${logs}
${fence}`;
}

/**
 * Instantiate the GoogleGenerativeAI model with system instructions and temperature 0.2
 * using a specific resolved model identifier.
 */
export function getGenerativeModelWithSpecificModel(apiKey, settings, specificModel) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const systemInstruction = buildSystemInstruction(settings);
  const budget = resolveThinkingBudget(settings?.thinkingLevel);

  const generationConfig = {
    temperature: 0.2,
  };
  if (budget !== undefined) {
    generationConfig.thinkingConfig = { thinkingBudget: budget };
  }

  return {
    modelName: specificModel,
    model: genAI.getGenerativeModel({
      model: specificModel,
      systemInstruction,
      generationConfig,
    }),
  };
}

/**
 * Instantiate the GoogleGenerativeAI model with system instructions and temperature 0.2.
 */
export function getGenerativeModel(apiKey, settings) {
  const modelName = resolveModelName(settings);
  return getGenerativeModelWithSpecificModel(apiKey, settings, modelName);
}

/**
 * Format raw Gemini errors into actionable, developer-friendly messages.
 */
export function handleGeminiError(err, modelName = '') {
  const rawMsg = err?.message || String(err);
  const lowerMsg = rawMsg.toLowerCase();

  if (
    lowerMsg.includes('api_key_invalid') ||
    lowerMsg.includes('api key not valid') ||
    (lowerMsg.includes('400') && lowerMsg.includes('api key'))
  ) {
    throw new Error('Invalid API key. Please check your Gemini API key in Settings.', { cause: err });
  }
  if (
    lowerMsg.includes('403') ||
    lowerMsg.includes('permission_denied') ||
    lowerMsg.includes('service_disabled')
  ) {
    throw new Error(
      'Access denied or API disabled (403). Ensure the Generative Language API is enabled and your API key has valid permissions in Google AI Studio.',
      { cause: err }
    );
  }
  if (lowerMsg.includes('resource_exhausted') || lowerMsg.includes('429')) {
    throw new Error(
      'Gemini API quota exceeded (Rate Limit / 429). Please wait a few moments or switch to a lighter model (e.g. Gemini 2.5 Flash or Gemini 2.0 Flash) in Settings.',
      { cause: err }
    );
  }
  if (lowerMsg.includes('failed to fetch') || lowerMsg.includes('network') || lowerMsg.includes('networkerror')) {
    throw new Error('Network connection failed. Please verify your internet connection and try again.', { cause: err });
  }
  if (lowerMsg.includes('404') || lowerMsg.includes('not found') || lowerMsg.includes('is not supported')) {
    throw new Error(
      `Model "${modelName || 'selected'}" not found or unsupported by Google Generative AI. Please select a supported model (e.g. Gemini 2.5 Flash, 2.0 Flash) in Settings.`,
      { cause: err }
    );
  }

  throw new Error(rawMsg || 'Translation failed. Check your API key and try again.', { cause: err });
}

/**
 * Translate error logs using the Gemini API (standard non-streaming),
 * with automatic fallback to stable models if a preview model is 404 or unsupported.
 */
export async function translateError(logs, settings) {
  const apiKey = (settings.apiKey || '').trim();

  if (!apiKey) {
    throw new Error('No API key configured. Open Settings (⚙) to add your Gemini API key.');
  }

  const initialModel = resolveModelName(settings);
  const candidates = getModelFallbackCandidates(initialModel);
  let lastErr = null;

  for (let i = 0; i < candidates.length; i++) {
    const modelToTry = candidates[i];
    try {
      const instance = getGenerativeModelWithSpecificModel(apiKey, settings, modelToTry);
      const prompt = buildUserPrompt(logs);
      const result = await instance.model.generateContent(prompt);
      const outputText = result.response.text();
      setLastSuccessfulModel(modelToTry);
      return outputText;
    } catch (err) {
      lastErr = err;
      const isUnavailable = isModelUnavailableError(err);
      if (isUnavailable && i < candidates.length - 1) {
        console.warn(`[CrypticMechanic] Model "${modelToTry}" not available, falling back to "${candidates[i + 1]}"...`);
        continue;
      }
      break;
    }
  }

  handleGeminiError(lastErr, initialModel);
}

/**
 * Translate error logs using the Gemini API with streaming generation,
 * with automatic fallback to stable models if a preview model is 404 or unsupported.
 * Calls onChunk(accumulatedText, chunkText) as chunks arrive.
 */
export async function translateErrorStream(logs, settings, onChunk) {
  const apiKey = (settings.apiKey || '').trim();

  if (!apiKey) {
    throw new Error('No API key configured. Open Settings (⚙) to add your Gemini API key.');
  }

  const initialModel = resolveModelName(settings);
  const candidates = getModelFallbackCandidates(initialModel);
  let lastErr = null;

  for (let i = 0; i < candidates.length; i++) {
    const modelToTry = candidates[i];
    try {
      const instance = getGenerativeModelWithSpecificModel(apiKey, settings, modelToTry);
      const prompt = buildUserPrompt(logs);

      if (typeof instance.model?.generateContentStream === 'function') {
        try {
          const streamResult = await instance.model.generateContentStream(prompt);
          let accumulatedText = '';

          for await (const chunk of streamResult.stream) {
            const chunkText = chunk.text();
            accumulatedText += chunkText;
            if (typeof onChunk === 'function') {
              onChunk(accumulatedText, chunkText);
            }
          }

          if (accumulatedText) {
            setLastSuccessfulModel(modelToTry);
            return accumulatedText;
          }

          // If stream loop produced no chunks, await full response
          const finalResp = await streamResult.response;
          const finalText = finalResp.text();
          if (typeof onChunk === 'function' && finalText) {
            onChunk(finalText, finalText);
          }
          setLastSuccessfulModel(modelToTry);
          return finalText;
        } catch (streamErr) {
          const streamErrMsg = (streamErr?.message || '').toLowerCase();
          const isUnavailable = isModelUnavailableError(streamErr);
          if (isUnavailable && i < candidates.length - 1) {
            console.warn(`[CrypticMechanic] Streaming model "${modelToTry}" returned 404/unsupported, falling back to "${candidates[i + 1]}"...`);
            lastErr = streamErr;
            continue;
          }
          // Fallback to standard generateContent if streaming specifically fails or is unsupported
          if (
            streamErrMsg.includes('stream not supported') ||
            streamErrMsg.includes('streaming is not supported') ||
            streamErrMsg.includes('unsupported method')
          ) {
            const fallbackText = await translateError(logs, { ...settings, model: modelToTry });
            if (typeof onChunk === 'function') {
              onChunk(fallbackText, fallbackText);
            }
            setLastSuccessfulModel(modelToTry);
            return fallbackText;
          }
          throw streamErr;
        }
      } else {
        // Fallback if generateContentStream is missing
        const text = await translateError(logs, { ...settings, model: modelToTry });
        if (typeof onChunk === 'function') {
          onChunk(text, text);
        }
        setLastSuccessfulModel(modelToTry);
        return text;
      }
    } catch (err) {
      lastErr = err;
      const isUnavailable = isModelUnavailableError(err);
      if (isUnavailable && i < candidates.length - 1) {
        console.warn(`[CrypticMechanic] Model "${modelToTry}" not available, falling back to "${candidates[i + 1]}"...`);
        continue;
      }
      break;
    }
  }

  handleGeminiError(lastErr, initialModel);
}
