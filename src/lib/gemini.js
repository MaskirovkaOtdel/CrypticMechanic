import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Resolve the effective model identifier based on settings.
 */
export function resolveModelName(settings = {}) {
  if (settings.model === 'custom') {
    return (settings.customModel || '').trim() || 'gemini-3-flash';
  }
  return settings.model || 'gemini-3-flash';
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
 * Instantiate the GoogleGenerativeAI model with system instructions and temperature 0.2.
 */
function getGenerativeModel(apiKey, settings) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = resolveModelName(settings);
  const systemInstruction = buildSystemInstruction(settings);

  return {
    modelName,
    model: genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
      generationConfig: {
        temperature: 0.2,
      },
    }),
  };
}

/**
 * Format raw Gemini errors into actionable, developer-friendly messages.
 */
function handleGeminiError(err, modelName = '') {
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
      'Gemini API quota exceeded (Rate Limit / 429). Please wait a few moments or switch to a lighter model (e.g. Gemini 3 Flash or Gemini 2.5 Flash Lite) in Settings.',
      { cause: err }
    );
  }
  if (lowerMsg.includes('failed to fetch') || lowerMsg.includes('network') || lowerMsg.includes('networkerror')) {
    throw new Error('Network connection failed. Please verify your internet connection and try again.', { cause: err });
  }
  if (lowerMsg.includes('404') || lowerMsg.includes('not found') || lowerMsg.includes('is not supported')) {
    throw new Error(
      `Model "${modelName || 'selected'}" not found or unsupported. Please check the model ID in Settings.`,
      { cause: err }
    );
  }

  throw new Error(rawMsg || 'Translation failed. Check your API key and try again.', { cause: err });
}

/**
 * Translate error logs using the Gemini API (standard non-streaming).
 */
export async function translateError(logs, settings) {
  const apiKey = (settings.apiKey || '').trim();

  if (!apiKey) {
    throw new Error('No API key configured. Open Settings (⚙) to add your Gemini API key.');
  }

  let modelName = '';
  try {
    const instance = getGenerativeModel(apiKey, settings);
    modelName = instance.modelName;
    const prompt = buildUserPrompt(logs);
    const result = await instance.model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    handleGeminiError(err, modelName);
  }
}

/**
 * Translate error logs using the Gemini API with streaming generation.
 * Calls onChunk(accumulatedText, chunkText) as chunks arrive.
 * Falls back to standard translateError if streaming is unsupported.
 */
export async function translateErrorStream(logs, settings, onChunk) {
  const apiKey = (settings.apiKey || '').trim();

  if (!apiKey) {
    throw new Error('No API key configured. Open Settings (⚙) to add your Gemini API key.');
  }

  let modelName = '';
  try {
    const instance = getGenerativeModel(apiKey, settings);
    modelName = instance.modelName;
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
          return accumulatedText;
        }

        // If stream loop produced no chunks, await full response
        const finalResp = await streamResult.response;
        const finalText = finalResp.text();
        if (typeof onChunk === 'function' && finalText) {
          onChunk(finalText, finalText);
        }
        return finalText;
      } catch (streamErr) {
        // Fallback to standard generateContent if streaming specifically fails or is unsupported
        const streamErrMsg = (streamErr?.message || '').toLowerCase();
        if (
          streamErrMsg.includes('stream not supported') ||
          streamErrMsg.includes('streaming is not supported') ||
          streamErrMsg.includes('unsupported method')
        ) {
          const fallbackText = await translateError(logs, settings);
          if (typeof onChunk === 'function') {
            onChunk(fallbackText, fallbackText);
          }
          return fallbackText;
        }
        throw streamErr;
      }
    } else {
      // Fallback if generateContentStream is missing
      const text = await translateError(logs, settings);
      if (typeof onChunk === 'function') {
        onChunk(text, text);
      }
      return text;
    }
  } catch (err) {
    handleGeminiError(err, modelName);
  }
}
