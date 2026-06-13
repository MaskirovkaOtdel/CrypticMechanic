import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Build a dynamic system prompt based on user settings.
 */
function buildPrompt(logs, settings) {
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

Analyze the following error logs or stack trace and respond using this exact format:

${formatMap[format] || formatMap['Diagnosis + Fixes']}

---

Error logs to analyze:
\`\`\`
${logs}
\`\`\``;
}

/**
 * Translate error logs using the Gemini API.
 */
export async function translateError(logs, settings) {
  const { apiKey, model } = settings;

  if (!apiKey) throw new Error('No API key configured. Open Settings to add your Gemini API key.');

  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model: model || 'gemini-2.0-flash-lite' });

  const prompt = buildPrompt(logs, settings);
  const result = await genModel.generateContent(prompt);
  const response = result.response;
  return response.text();
}
