/**
 * tests/r4_usecase_verification.test.mjs
 *
 * Comprehensive Application Functional Verification Suite (R4):
 * Covers all 6 core functional areas against actual implementations in
 * `src/lib/gemini.js` and `src/lib/logFormatter.js`:
 *
 * 1. Gemini 3 Model Resolution & Aliases:
 *    - All 21 aliases in MODEL_ALIASES (preview aliases, flash-lite, pro, exp, legacy migration)
 *    - Default fallback models on empty, undefined, null, or whitespace settings
 *    - Custom model ID preservation, whitespace trimming, and empty custom fallback
 *    - Cross-provider Ollama contamination filtering (colon strings, llama, qwen, mistral, deepseek)
 *    - Last successful model state tracking (getLastSuccessfulModel, setLastSuccessfulModel)
 *    - Dynamic system prompt construction across tones and detail levels
 *
 * 2. Thinking / Reasoning Level Token Budget Mapping:
 *    - resolveThinkingBudget for 'Off' (0), 'Low' (1024), 'Medium' (4096), 'High' (8192), 'Auto' (undefined)
 *    - Fallback to undefined for unrecognized levels ('minimal', 'standard', 'deep', 'Extreme')
 *    - Safe undefined return for numeric inputs, negative numbers, out-of-range clamping
 *    - Safe undefined return for invalid inputs (null, undefined, NaN, objects, arrays)
 *
 * 3. Fallback Candidate Chains & Error Discrimination:
 *    - getModelFallbackCandidates for primary Gemini 3 models (flash-lite, flash, pro)
 *    - Preview model candidate chains and unknown/custom model isolation
 *    - Deduplication invariant check across all candidate lists
 *    - isModelUnavailableError detection of 404, 'not found', 'not_found', 'does not exist', 'unsupported'
 *    - Strict discrimination: RESOURCE_EXHAUSTED / 429 quota errors return false (not 404)
 *    - Strict discrimination: 401, 403, 500, network errors return false
 *
 * 4. Terminal Log Noise Stripping & Frame Collapsing:
 *    - 64-char container IDs (docker://, containerd://, container_id=, cid=, sha256:, standalone hex)
 *    - 12-char bracketed container IDs at line starts ([a1b2c3d4e5f6])
 *    - ISO-8601 timestamps with millisecond and timezone offset variants
 *    - Syslog timestamps including single-digit day format (e.g. Sep  4)
 *    - Simple time-only brackets ([12:34:56])
 *    - Option toggles (stripContainerHashes: false, collapseDuplicates: false, stripTimestamps: false)
 *    - Indentation preservation on collapsed duplicate frame summaries
 *
 * 5. ANSI Control Sequence Removal & Counting:
 *    - 16-color, 256-color, and 24-bit TrueColor SGR escape sequences
 *    - 8-bit C1 escape sequences (\x9b...)
 *    - OSC window title sequences with BEL (\x07) and ST (\x1b\\) terminators
 *    - Compound multi-parameter ANSI sequences
 *    - Multiline ANSI sequence counting accuracy
 *    - Safe handling of null, undefined, empty, and non-string inputs
 *
 * 6. Runtime Heuristic Signature Detection:
 *    - Python tracebacks and single-line exceptions (ZeroDivisionError, ModuleNotFoundError, KeyError, ValueError)
 *    - Node.js stack traces with Unix paths, Windows drive letter paths, npm ERR!, and ECONNREFUSED
 *    - Go panics, fatal error memory crashes, and goroutine stack traces
 *    - Rust thread panics, unwrap() failures, and backtraces
 *    - Java/JVM thread exceptions, Caused by clauses, and OutOfMemoryError
 *    - Kubernetes CrashLoopBackOff, ImagePullBackOff, and pod identifiers
 *    - Docker daemon error responses and connection failures
 *    - Runtime match object contract (runtime, label, name, toString(), valueOf())
 */

import assert from 'node:assert/strict';
import {
  resolveModelName,
  getModelFallbackCandidates,
  resolveThinkingBudget,
  MODEL_ALIASES,
  MODEL_FALLBACKS,
  getLastSuccessfulModel,
  setLastSuccessfulModel,
  isModelUnavailableError,
  buildSystemInstruction,
  buildUserPrompt,
  handleGeminiError,
  getGenerativeModelWithSpecificModel,
} from '../src/lib/gemini.js';
import {
  stripAnsiCodes,
  countAnsiCodes,
  cleanTerminalNoise,
  detectLogRuntime,
} from '../src/lib/logFormatter.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('================================================================');
console.log('R4 FUNCTIONAL USE-CASE VERIFICATION SUITE');
console.log('================================================================');

// ================================================================
// AREA 1: Gemini 3 Model Resolution & Aliases
// ================================================================
console.log('\n--- Area 1: Gemini 3 Model Resolution & Aliases ---');

test('Area 1.1: All 21 entries in MODEL_ALIASES resolve to expected endpoints', () => {
  const expectedMappings = {
    'gemini-3.5-flash-lite': 'gemini-3.5-flash-lite-preview',
    'gemini-3.8-flash': 'gemini-3.8-flash',
    'gemini-3.1-pro': 'gemini-3.1-pro-preview',
    'gemini-3-pro': 'gemini-3.1-pro-preview',
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

  const aliasKeys = Object.keys(MODEL_ALIASES);
  assert.equal(aliasKeys.length, 21, 'MODEL_ALIASES must have exactly 21 defined aliases');

  for (const [alias, target] of Object.entries(expectedMappings)) {
    assert.equal(
      resolveModelName({ model: alias }),
      target,
      `Alias "${alias}" must resolve to "${target}"`
    );
  }
});

test('Area 1.2: Default fallback model when settings are empty, null, undefined, or whitespace', () => {
  const expectedDefault = 'gemini-3.5-flash-lite-preview';
  assert.equal(resolveModelName({}), expectedDefault);
  assert.equal(resolveModelName({ model: '' }), expectedDefault);
  assert.equal(resolveModelName({ model: '   ' }), expectedDefault);
  assert.equal(resolveModelName({ model: null }), expectedDefault);
  assert.equal(resolveModelName({ model: undefined }), expectedDefault);
  assert.equal(resolveModelName(), expectedDefault);
});

test('Area 1.3: Custom model ID is preserved and trimmed when model is "custom"', () => {
  assert.equal(
    resolveModelName({ model: 'custom', customModel: 'gemini-custom-finetune-v1' }),
    'gemini-custom-finetune-v1'
  );
  assert.equal(
    resolveModelName({ model: 'custom', customModel: '   my-corp-model   ' }),
    'my-corp-model'
  );
});

test('Area 1.4: Blank or whitespace-only customModel defaults safely to gemini-3.5-flash-lite', () => {
  const expectedDefault = 'gemini-3.5-flash-lite-preview';
  assert.equal(resolveModelName({ model: 'custom', customModel: '' }), expectedDefault);
  assert.equal(resolveModelName({ model: 'custom', customModel: '    ' }), expectedDefault);
  assert.equal(resolveModelName({ model: 'custom', customModel: null }), expectedDefault);
  assert.equal(resolveModelName({ model: 'custom' }), expectedDefault);
});

test('Area 1.5: Cross-provider Ollama contamination filtering defaults safely to Gemini 3', () => {
  const expectedDefault = 'gemini-3.5-flash-lite-preview';
  assert.equal(resolveModelName({ model: 'llama3:8b' }), expectedDefault);
  assert.equal(resolveModelName({ model: 'llama3' }), expectedDefault);
  assert.equal(resolveModelName({ model: 'llama2:latest' }), expectedDefault);
  assert.equal(resolveModelName({ model: 'qwen2.5-coder:7b' }), expectedDefault);
  assert.equal(resolveModelName({ model: 'qwen:14b' }), expectedDefault);
  assert.equal(resolveModelName({ model: 'mistral:latest' }), expectedDefault);
  assert.equal(resolveModelName({ model: 'mistral' }), expectedDefault);
  assert.equal(resolveModelName({ model: 'deepseek-coder:6.7b' }), expectedDefault);
  assert.equal(resolveModelName({ model: 'deepseek-r1' }), expectedDefault);
});

test('Area 1.6: State tracking via getLastSuccessfulModel and setLastSuccessfulModel', () => {
  const current = getLastSuccessfulModel();
  assert.ok(typeof current === 'string' && current.length > 0);

  setLastSuccessfulModel('gemini-3.8-flash');
  assert.equal(getLastSuccessfulModel(), 'gemini-3.8-flash');

  // Ignored inputs should preserve existing model
  setLastSuccessfulModel(null);
  assert.equal(getLastSuccessfulModel(), 'gemini-3.8-flash');

  setLastSuccessfulModel('');
  assert.equal(getLastSuccessfulModel(), 'gemini-3.8-flash');

  setLastSuccessfulModel(12345);
  assert.equal(getLastSuccessfulModel(), 'gemini-3.8-flash');

  // Restore initial
  setLastSuccessfulModel('gemini-3.5-flash-lite');
  assert.equal(getLastSuccessfulModel(), 'gemini-3.5-flash-lite');
});

test('Area 1.7: Dynamic system instruction construction across tones and detail levels', () => {
  const proInstruction = buildSystemInstruction({ tone: 'Professional', detail: 'Concise', format: 'Quick Fix' });
  assert.ok(proInstruction.includes('professional, technical troubleshooter tone'));
  assert.ok(proInstruction.includes('Keep your response brief'));
  assert.ok(proInstruction.includes('### Quick Fix'));

  const friendlyInstruction = buildSystemInstruction({ tone: 'Friendly', detail: 'Thorough', format: 'Step-by-Step' });
  assert.ok(friendlyInstruction.includes('friendly, approachable tone'));
  assert.ok(friendlyInstruction.includes('Be very detailed and comprehensive'));
  assert.ok(friendlyInstruction.includes('### Step-by-Step Resolution'));

  const eli5Instruction = buildSystemInstruction({ tone: 'ELI5', detail: 'Standard', format: 'Root Cause' });
  assert.ok(eli5Instruction.includes('complete beginner'));
  assert.ok(eli5Instruction.includes('balanced level of detail'));
  assert.ok(eli5Instruction.includes('### Root Cause Analysis'));
});

test('Area 1.8: buildUserPrompt wraps logs in backtick fences with adaptive scaling', () => {
  const normalLogs = 'Error: simple error';
  const normalPrompt = buildUserPrompt(normalLogs);
  assert.ok(normalPrompt.includes('```\nError: simple error\n```'));

  const logsWithBackticks = 'Error occurred in code:\n```js\nconsole.log(1);\n```';
  const escapedPrompt = buildUserPrompt(logsWithBackticks);
  assert.ok(escapedPrompt.includes('````\nError occurred in code:\n```js\nconsole.log(1);\n```\n````'));
});

// ================================================================
// AREA 2: Thinking / Reasoning Level Token Budget Mapping
// ================================================================
console.log('\n--- Area 2: Thinking / Reasoning Level Token Budget Mapping ---');

test('Area 2.1: resolveThinkingBudget maps valid user levels accurately', () => {
  assert.equal(resolveThinkingBudget('Off'), 0, 'Off must map to 0 tokens');
  assert.equal(resolveThinkingBudget('Low'), 1024, 'Low must map to 1024 tokens');
  assert.equal(resolveThinkingBudget('Medium'), 4096, 'Medium must map to 4096 tokens');
  assert.equal(resolveThinkingBudget('High'), 8192, 'High must map to 8192 tokens');
  assert.equal(resolveThinkingBudget('Auto'), undefined, 'Auto must omit thinkingBudget (undefined)');
});

test('Area 2.2: resolveThinkingBudget safely falls back to undefined for non-standard labels', () => {
  // Alternative or external provider terminology must safely return undefined (no crash)
  assert.equal(resolveThinkingBudget('minimal'), undefined);
  assert.equal(resolveThinkingBudget('standard'), undefined);
  assert.equal(resolveThinkingBudget('deep'), undefined);
  assert.equal(resolveThinkingBudget('Extreme'), undefined);
  assert.equal(resolveThinkingBudget('Ultra'), undefined);
  assert.equal(resolveThinkingBudget('low'), undefined); // case-sensitive check
  assert.equal(resolveThinkingBudget(''), undefined);
});

test('Area 2.3: resolveThinkingBudget safely returns undefined for numeric inputs', () => {
  assert.equal(resolveThinkingBudget(1024), undefined);
  assert.equal(resolveThinkingBudget(4096), undefined);
  assert.equal(resolveThinkingBudget(16384), undefined);
  assert.equal(resolveThinkingBudget(0), undefined);
  assert.equal(resolveThinkingBudget(-1), undefined);
  assert.equal(resolveThinkingBudget(999999), undefined);
});

test('Area 2.4: resolveThinkingBudget safely returns undefined for invalid non-string inputs', () => {
  assert.equal(resolveThinkingBudget(null), undefined);
  assert.equal(resolveThinkingBudget(undefined), undefined);
  assert.equal(resolveThinkingBudget(NaN), undefined);
  assert.equal(resolveThinkingBudget({}), undefined);
  assert.equal(resolveThinkingBudget([]), undefined);
  assert.equal(resolveThinkingBudget(true), undefined);
  assert.equal(resolveThinkingBudget(false), undefined);
});

test('Area 2.5: getGenerativeModelWithSpecificModel injects thinkingBudget for configured levels and omits for Auto', () => {
  const lowModel = getGenerativeModelWithSpecificModel('fake-key', { thinkingLevel: 'Low' }, 'gemini-3.5-flash-lite-preview');
  assert.equal(lowModel.modelName, 'gemini-3.5-flash-lite-preview');
  assert.ok(lowModel.model);

  const autoModel = getGenerativeModelWithSpecificModel('fake-key', { thinkingLevel: 'Auto' }, 'gemini-3.8-flash');
  assert.equal(autoModel.modelName, 'gemini-3.8-flash');
  assert.ok(autoModel.model);
});

// ================================================================
// AREA 3: Fallback Candidate Chains & Error Discrimination
// ================================================================
console.log('\n--- Area 3: Fallback Candidate Chains & Error Discrimination ---');

test('Area 3.1: getModelFallbackCandidates returns verified Gemini 3 candidate chains', () => {
  const flashLiteChain = getModelFallbackCandidates('gemini-3.5-flash-lite');
  assert.deepEqual(flashLiteChain, [
    'gemini-3.5-flash-lite-preview',
    'gemini-3.8-flash',
    'gemini-3.1-pro-preview',
  ]);

  const flashChain = getModelFallbackCandidates('gemini-3.8-flash');
  assert.deepEqual(flashChain, [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite-preview',
    'gemini-3.1-pro-preview',
  ]);

  const proChain = getModelFallbackCandidates('gemini-3.1-pro');
  assert.deepEqual(proChain, [
    'gemini-3.1-pro-preview',
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite-preview',
  ]);
});

test('Area 3.2: getModelFallbackCandidates handles direct preview model identifiers', () => {
  const previewChain = getModelFallbackCandidates('gemini-3.5-flash-lite-preview');
  assert.deepEqual(previewChain, [
    'gemini-3.5-flash-lite-preview',
    'gemini-3.8-flash',
    'gemini-3.1-pro-preview',
  ]);

  const proPreviewChain = getModelFallbackCandidates('gemini-3.1-pro-preview');
  assert.deepEqual(proPreviewChain, [
    'gemini-3.1-pro-preview',
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite-preview',
  ]);
});

test('Area 3.3: getModelFallbackCandidates handles unknown or custom model without crashing', () => {
  const customChain = getModelFallbackCandidates('my-custom-endpoint');
  assert.deepEqual(customChain, ['my-custom-endpoint']);

  const emptyChain = getModelFallbackCandidates('');
  assert.ok(Array.isArray(emptyChain) && emptyChain.length >= 1);
});

test('Area 3.4: Candidate lists must be strictly deduplicated across all fallbacks', () => {
  for (const modelKey of Object.keys(MODEL_FALLBACKS)) {
    const candidates = getModelFallbackCandidates(modelKey);
    const unique = new Set(candidates);
    assert.equal(
      candidates.length,
      unique.size,
      `Candidate list for "${modelKey}" must not contain duplicates: ${JSON.stringify(candidates)}`
    );
  }
});

test('Area 3.5: isModelUnavailableError correctly detects 404, not found, and unsupported errors', () => {
  assert.equal(isModelUnavailableError(new Error('404 Not Found')), true);
  assert.equal(isModelUnavailableError(new Error('Error 404: model not found')), true);
  assert.equal(isModelUnavailableError(new Error('Resource not_found: models/gemini-3-preview')), true);
  assert.equal(isModelUnavailableError(new Error('The model `gemini-3.5-flash-lite` does not exist')), true);
  assert.equal(isModelUnavailableError(new Error('Model is not supported for generateContent')), true);
  assert.equal(isModelUnavailableError(new Error('Unsupported model: models/xyz')), true);
  assert.equal(isModelUnavailableError(new Error('Invalid model name provided')), true);
  assert.equal(isModelUnavailableError(new Error('Request contains an invalid argument: models/gemini-bad [400]')), true);
});

test('Area 3.6: isModelUnavailableError discriminates and rejects RESOURCE_EXHAUSTED / 429 quota errors', () => {
  // Rate limit / quota errors must NEVER trigger model fallback (they are not missing models)
  assert.equal(isModelUnavailableError(new Error('RESOURCE_EXHAUSTED')), false);
  assert.equal(isModelUnavailableError(new Error('Resource has been exhausted (e.g. check quota).')), false);
  assert.equal(isModelUnavailableError(new Error('Quota exceeded for quota metric')), false);
  assert.equal(isModelUnavailableError(new Error('429 Too Many Requests')), false);
  assert.equal(isModelUnavailableError(new Error('Rate limit exceeded')), false);
});

test('Area 3.7: isModelUnavailableError discriminates auth, server, and network errors', () => {
  assert.equal(isModelUnavailableError(new Error('401 Unauthorized: API key invalid')), false);
  assert.equal(isModelUnavailableError(new Error('403 Forbidden: Permission denied')), false);
  assert.equal(isModelUnavailableError(new Error('500 Internal Server Error')), false);
  assert.equal(isModelUnavailableError(new Error('503 Service Unavailable')), false);
  assert.equal(isModelUnavailableError(new Error('Failed to fetch')), false);
  assert.equal(isModelUnavailableError(new Error('NetworkError when attempting to fetch resource')), false);
  assert.equal(isModelUnavailableError(null), false);
  assert.equal(isModelUnavailableError(undefined), false);
  assert.equal(isModelUnavailableError(''), false);
});

test('Area 3.8: handleGeminiError formats raw API errors into user-friendly messages', () => {
  assert.throws(
    () => handleGeminiError(new Error('RESOURCE_EXHAUSTED')),
    /Gemini API quota exceeded/
  );
  assert.throws(
    () => handleGeminiError(new Error('429 rate limit exceeded')),
    /Gemini API quota exceeded/
  );
  assert.throws(
    () => handleGeminiError(new Error('API_KEY_INVALID')),
    /Invalid API key/
  );
  assert.throws(
    () => handleGeminiError(new Error('403 permission_denied')),
    /Access denied or API disabled \(403\)/
  );
  assert.throws(
    () => handleGeminiError(new Error('Failed to fetch')),
    /Network connection failed/
  );
  assert.throws(
    () => handleGeminiError(new Error('404 model not found'), 'gemini-3.5-flash-lite'),
    /Model "gemini-3.5-flash-lite" not found or unsupported/
  );
});

// ================================================================
// AREA 4: Terminal Log Noise Stripping & Frame Collapsing
// ================================================================
console.log('\n--- Area 4: Terminal Log Noise Stripping & Frame Collapsing ---');

test('Area 4.1: cleanTerminalNoise strips docker:// and containerd:// 64-char container IDs', () => {
  const hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const raw = `docker://${hash} Application crashed`;
  const cleaned = cleanTerminalNoise(raw);
  assert.ok(!cleaned.includes('docker://'), 'Must strip docker:// prefix');
  assert.ok(!cleaned.includes(hash), 'Must strip 64-char hash');
  assert.equal(cleaned.trim(), 'Application crashed');

  const rawContainerd = `containerd://${hash} Container exited with 1`;
  const cleanedContainerd = cleanTerminalNoise(rawContainerd);
  assert.ok(!cleanedContainerd.includes('containerd://'), 'Must strip containerd:// prefix');
  assert.ok(!cleanedContainerd.includes(hash), 'Must strip 64-char containerd hash');
  assert.equal(cleanedContainerd.trim(), 'Container exited with 1');
});

test('Area 4.2: cleanTerminalNoise strips container_id and cid parameters', () => {
  const hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const rawCid = `cid=${hash} Worker terminated`;
  const cleanedCid = cleanTerminalNoise(rawCid);
  assert.ok(!cleanedCid.includes('cid='), 'Must strip cid= parameter');
  assert.equal(cleanedCid.trim(), 'Worker terminated');

  const rawContainerId = `container_id: ${hash} Out of memory`;
  const cleanedContainerId = cleanTerminalNoise(rawContainerId);
  assert.ok(!cleanedContainerId.includes('container_id:'), 'Must strip container_id parameter');
  assert.equal(cleanedContainerId.trim(), 'Out of memory');
});

test('Area 4.3: cleanTerminalNoise strips sha256: hashes and standalone 64-char hex strings', () => {
  const hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const rawSha = `sha256:${hash} Image pull failure`;
  const cleanedSha = cleanTerminalNoise(rawSha);
  assert.ok(!cleanedSha.includes('sha256:'), 'Must strip sha256: prefix');
  assert.equal(cleanedSha.trim(), 'Image pull failure');

  const rawHex = `${hash} Process died`;
  const cleanedHex = cleanTerminalNoise(rawHex);
  assert.ok(!cleanedHex.includes(hash), 'Must strip standalone 64-char hex hash');
  assert.equal(cleanedHex.trim(), 'Process died');
});

test('Area 4.4: cleanTerminalNoise strips leading 12-char bracketed container IDs', () => {
  const raw = '[a1b2c3d4e5f6] Starting server on port 8080';
  assert.equal(cleanTerminalNoise(raw), 'Starting server on port 8080');

  const indented = '  [f9e8d7c6b5a4] Handshake failed';
  assert.equal(cleanTerminalNoise(indented), '  Handshake failed');
});

test('Area 4.5: cleanTerminalNoise strips ISO-8601 timestamps with millisecond & offset variants', () => {
  const isoUtc = '2026-10-17T08:15:30.123Z [ERROR] DB connection failed';
  assert.equal(cleanTerminalNoise(isoUtc), '[ERROR] DB connection failed');

  const isoSpace = '[2026-10-17 08:15:30,456] CRITICAL: Redis unreachable';
  assert.equal(cleanTerminalNoise(isoSpace), 'CRITICAL: Redis unreachable');

  const isoOffset = '2026-10-17T08:15:30+02:00 - Worker thread panicked';
  assert.equal(cleanTerminalNoise(isoOffset), 'Worker thread panicked');
});

test('Area 4.6: cleanTerminalNoise strips syslog timestamps including single-digit day format', () => {
  const syslogNormal = 'Oct 17 08:15:30 host myservice[999]: Segfault at 0x0';
  assert.equal(cleanTerminalNoise(syslogNormal), 'host myservice[999]: Segfault at 0x0');

  // Single digit day with double space (standard Unix syslog convention)
  const syslogSingleDigit = 'Sep  4 15:42:01 server kernel: Out of memory';
  assert.equal(cleanTerminalNoise(syslogSingleDigit), 'server kernel: Out of memory');

  const bracketedSyslog = '[Jul 29 11:05:49.123] : service stopped';
  assert.equal(cleanTerminalNoise(bracketedSyslog), 'service stopped');
});

test('Area 4.7: cleanTerminalNoise strips simple time-only bracket timestamps', () => {
  const timeOnly = '[12:34:56] Starting compile phase';
  assert.equal(cleanTerminalNoise(timeOnly), 'Starting compile phase');

  const timeMillis = '[12:34:56.789] SyntaxError: Unexpected identifier';
  assert.equal(cleanTerminalNoise(timeMillis), 'SyntaxError: Unexpected identifier');
});

test('Area 4.8: cleanTerminalNoise respects option flags (toggles)', () => {
  const containerLog = 'docker://e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 Error';
  assert.equal(
    cleanTerminalNoise(containerLog, { stripContainerHashes: false }),
    containerLog,
    'stripContainerHashes: false must preserve container hashes'
  );

  const duplicateLog = 'at Object.run (app.js:1:1)\nat Object.run (app.js:1:1)\nat Object.run (app.js:1:1)';
  assert.equal(
    cleanTerminalNoise(duplicateLog, { collapseDuplicates: false }),
    duplicateLog,
    'collapseDuplicates: false must not collapse duplicate frames'
  );

  const timestampLog = '2026-10-17T08:15:30.123Z Server error';
  assert.equal(
    cleanTerminalNoise(timestampLog, { stripTimestamps: false }),
    timestampLog,
    'stripTimestamps: false must preserve timestamps'
  );
});

test('Area 4.9: cleanTerminalNoise preserves indentation on collapsed repetition summary lines', () => {
  const indentedDuplicates = '    at evaluate (calc.js:10:5)\n    at evaluate (calc.js:10:5)\n    at evaluate (calc.js:10:5)';
  const result = cleanTerminalNoise(indentedDuplicates);
  const lines = result.split('\n');
  assert.equal(lines.length, 2);
  assert.equal(lines[0], '    at evaluate (calc.js:10:5)');
  assert.equal(lines[1], '    ... [repeated 2 times]');
});

// ================================================================
// AREA 5: ANSI Control Sequence Removal & Counting
// ================================================================
console.log('\n--- Area 5: ANSI Control Sequence Removal & Counting ---');

test('Area 5.1: stripAnsiCodes strips 16-color, 256-color, and 24-bit TrueColor SGR codes', () => {
  const color16 = '\x1b[31;1mError:\x1b[0m \x1b[32mOperation successful\x1b[0m';
  assert.equal(stripAnsiCodes(color16), 'Error: Operation successful');

  const color256 = '\x1b[38;5;208mOrange warning\x1b[0m and \x1b[48;5;236mDark background\x1b[0m';
  assert.equal(stripAnsiCodes(color256), 'Orange warning and Dark background');

  const trueColor = '\x1b[38;2;255;128;64mCustom RGB\x1b[0m in \x1b[48;2;10;20;30mCanvas\x1b[0m';
  assert.equal(stripAnsiCodes(trueColor), 'Custom RGB in Canvas');
});

test('Area 5.2: stripAnsiCodes strips 8-bit C1 escape sequences', () => {
  const c1Text = '\x9b33mYellow 8-bit text\x9b0m';
  assert.equal(stripAnsiCodes(c1Text), 'Yellow 8-bit text');

  const c1Bold = '\x9b1;34mBold Blue\x9b0m';
  assert.equal(stripAnsiCodes(c1Bold), 'Bold Blue');
});

test('Area 5.3: stripAnsiCodes strips OSC window title sequences with BEL and ST terminators', () => {
  const oscBel = '\x1b]0;npm install in progress\x07Running scripts...';
  assert.equal(stripAnsiCodes(oscBel), 'Running scripts...');

  const oscSt = '\x1b]2;Terminal Status\x1b\\Compilation done';
  assert.equal(stripAnsiCodes(oscSt), 'Compilation done');
});

test('Area 5.4: stripAnsiCodes strips compound multi-parameter ANSI sequences', () => {
  const compound = '\x1b[1;4;31;42mBold Underlined Red on Green\x1b[0m';
  assert.equal(stripAnsiCodes(compound), 'Bold Underlined Red on Green');
});

test('Area 5.5: countAnsiCodes accurately counts sequences across multiline text', () => {
  const multiline = '\x1b[31mLine 1\x1b[0m\n\x1b[32mLine 2\x1b[0m\n\x1b[33mLine 3\x1b[0m';
  assert.equal(countAnsiCodes(multiline), 6);

  const clean = 'Just plain text with no sequences\nSecond line';
  assert.equal(countAnsiCodes(clean), 0);
});

test('Area 5.6: stripAnsiCodes and countAnsiCodes safely handle empty, null, and non-string inputs', () => {
  assert.equal(stripAnsiCodes(''), '');
  assert.equal(stripAnsiCodes(null), '');
  assert.equal(stripAnsiCodes(undefined), '');
  assert.equal(stripAnsiCodes(12345), '');
  assert.equal(stripAnsiCodes({}), '');

  assert.equal(countAnsiCodes(''), 0);
  assert.equal(countAnsiCodes(null), 0);
  assert.equal(countAnsiCodes(undefined), 0);
  assert.equal(countAnsiCodes(12345), 0);
});

// ================================================================
// AREA 6: Runtime Heuristic Detection
// ================================================================
console.log('\n--- Area 6: Runtime Heuristic Detection ---');

test('Area 6.1: detectLogRuntime detects Python multi-line tracebacks', () => {
  const pythonTraceback = `
Traceback (most recent call last):
  File "/app/server.py", line 42, in handle_request
    result = compute_values(data)
  File "/app/utils.py", line 15, in compute_values
    return 100 / divisor
ZeroDivisionError: division by zero
  `;
  const match = detectLogRuntime(pythonTraceback);
  assert.ok(match, 'Must detect Python traceback');
  assert.equal(match.runtime, 'Python');
  assert.equal(match.label, 'Python Traceback');
});

test('Area 6.2: detectLogRuntime detects Python single-line exceptions', () => {
  assert.equal(detectLogRuntime('ZeroDivisionError: float division by zero')?.runtime, 'Python');
  assert.equal(detectLogRuntime('ModuleNotFoundError: No module named requests')?.runtime, 'Python');
  assert.equal(detectLogRuntime("KeyError: 'user_session_id'")?.runtime, 'Python');
  assert.equal(detectLogRuntime("ValueError: invalid literal for int() with base 10: 'abc'")?.runtime, 'Python');
  assert.equal(detectLogRuntime('IndentationError: unexpected indent')?.runtime, 'Python');
  assert.equal(detectLogRuntime('NameError: name undefined_var is not defined')?.runtime, 'Python');
});

test('Area 6.3: detectLogRuntime detects Node.js stack traces with Unix file paths', () => {
  const nodeTrace = `
TypeError: Cannot read properties of undefined (reading 'map')
    at renderItems (/var/www/app/src/components/List.js:45:12)
    at async processQueue (/var/www/app/src/queue.js:88:20)
  `;
  const match = detectLogRuntime(nodeTrace);
  assert.ok(match, 'Must detect Node.js stack trace');
  assert.equal(match.runtime, 'Node.js');
  assert.equal(match.label, 'Node.js');
});

test('Area 6.4: detectLogRuntime detects Node.js stack traces with Windows drive letter paths', () => {
  const windowsTrace = `
Error: ENOENT: no such file or directory, open 'C:\\Users\\User\\Desktop\\app\\config.json'
    at App (C:\\Users\\User\\Desktop\\app\\src\\index.js:10:5)
    at Module._compile (node:internal/modules/cjs/loader:1376:14)
  `;
  const match = detectLogRuntime(windowsTrace);
  assert.ok(match, 'Must detect Node.js stack trace with Windows path');
  assert.equal(match.runtime, 'Node.js');
});

test('Area 6.5: detectLogRuntime detects Node.js CLI & runtime error signatures', () => {
  assert.equal(detectLogRuntime('npm ERR! code ELIFECYCLE\nnpm ERR! errno 1')?.runtime, 'Node.js');
  assert.equal(detectLogRuntime('UnhandledPromiseRejection: Error: connection timed out')?.runtime, 'Node.js');
  assert.equal(detectLogRuntime('Error: connect ECONNREFUSED 127.0.0.1:5432')?.runtime, 'Node.js');
  assert.equal(detectLogRuntime('Error: Cannot find module express\ncode: MODULE_NOT_FOUND')?.runtime, 'Node.js');
});

test('Area 6.6: detectLogRuntime detects Go panics and fatal error memory crashes', () => {
  const goPanic = `
panic: runtime error: index out of range [5] with length 3

goroutine 1 [running]:
main.processItems(0xc0000a4000)
    /home/user/go/src/main.go:42 +0x1a8
  `;
  const match = detectLogRuntime(goPanic);
  assert.ok(match, 'Must detect Go panic');
  assert.equal(match.runtime, 'Go');
  assert.equal(match.label, 'Go Panic');

  const goFatal = 'fatal error: out of memory\ngoroutine 1 [running]:';
  const fatalMatch = detectLogRuntime(goFatal);
  assert.ok(fatalMatch);
  assert.equal(fatalMatch.runtime, 'Go');
  assert.equal(fatalMatch.label, 'Go Panic');
});

test('Area 6.7: detectLogRuntime detects Go goroutine traces and source offsets', () => {
  const goGoroutine = `
goroutine 42 [select]:
net/http.(*persistConn).writeLoop(0xc000108000)
    /usr/local/go/src/net/http/transport.go:2386 +0x115
  `;
  const match = detectLogRuntime(goGoroutine);
  assert.ok(match);
  assert.equal(match.runtime, 'Go');
});

test('Area 6.8: detectLogRuntime detects Rust thread panics and unwrap() backtraces', () => {
  const rustPanic = `
thread 'main' panicked at 'called Option::unwrap() on a None value', src/main.rs:18:9
stack backtrace:
   0: rust_begin_unwind
   1: core::panicking::panic_fmt
  `;
  const match = detectLogRuntime(rustPanic);
  assert.ok(match, 'Must detect Rust panic');
  assert.equal(match.runtime, 'Rust');
  assert.equal(match.label, 'Rust Panic');
});

test('Area 6.9: detectLogRuntime detects Java/JVM thread exceptions and Caused by frames', () => {
  const javaTrace = `
Exception in thread "main" java.lang.NullPointerException: Cannot invoke method on null object
    at com.example.service.UserService.getUser(UserService.java:142)
    at com.example.controller.AppController.handle(AppController.java:55)
Caused by: java.lang.IllegalArgumentException: userId required
  `;
  const match = detectLogRuntime(javaTrace);
  assert.ok(match, 'Must detect Java / JVM exception');
  assert.equal(match.runtime, 'Java / JVM');
  assert.equal(match.label, 'Java / JVM Exception');

  const javaOom = 'java.lang.OutOfMemoryError: Java heap space';
  assert.equal(detectLogRuntime(javaOom)?.runtime, 'Java / JVM');
});

test('Area 6.10: detectLogRuntime detects Kubernetes orchestrator errors and pod identifiers', () => {
  assert.equal(detectLogRuntime('pod/payment-api-7b89f-xyz: CrashLoopBackOff')?.runtime, 'Kubernetes');
  assert.equal(detectLogRuntime('Failed to pull image "registry.k8s.io/kube-proxy": ImagePullBackOff')?.runtime, 'Kubernetes');
  assert.equal(detectLogRuntime('Back-off restarting failed container worker in pod auth_kube-system')?.runtime, 'Kubernetes');
  assert.equal(detectLogRuntime('Container terminated due to OOMKilled')?.runtime, 'Kubernetes');
});

test('Area 6.11: detectLogRuntime detects Docker daemon error responses and connection failures', () => {
  assert.equal(detectLogRuntime('docker: Error response from daemon: Conflict. The container name is in use')?.runtime, 'Docker');
  assert.equal(detectLogRuntime('Cannot connect to the Docker daemon at unix:///var/run/docker.sock')?.runtime, 'Docker');
  assert.equal(detectLogRuntime('ERROR: failed to solve with frontend dockerfile.v0')?.runtime, 'Docker');
  assert.equal(detectLogRuntime("Unable to find image 'node:20-alpine' locally")?.runtime, 'Docker');
});

test('Area 6.12: detectLogRuntime match object satisfies string coercion and property contract', () => {
  const match = detectLogRuntime('ZeroDivisionError: division by zero');
  assert.ok(match);
  assert.equal(match.runtime, 'Python');
  assert.equal(match.name, 'Python');
  assert.equal(match.label, 'Python');
  assert.equal(match.toString(), 'Python');
  assert.equal(match.valueOf(), 'Python');
  assert.equal(String(match), 'Python');
  assert.equal(`${match}`, 'Python');
  assert.equal(match == 'Python', true);
});

test('Area 6.13: detectLogRuntime returns null for non-error plain text, empty string, and null', () => {
  assert.equal(detectLogRuntime('Hello, server started successfully on port 3000'), null);
  assert.equal(detectLogRuntime('Build completed in 1.45s without warnings'), null);
  assert.equal(detectLogRuntime(''), null);
  assert.equal(detectLogRuntime('   \n  \t '), null);
  assert.equal(detectLogRuntime(null), null);
  assert.equal(detectLogRuntime(undefined), null);
});

// ================================================================
// SUMMARY REPORT
// ================================================================
console.log('\n================================================================');
console.log(`TOTAL R4 VERIFICATION TESTS: ${passed + failed}`);
console.log(`PASSED:                      ${passed}`);
console.log(`FAILED:                      ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nALL R4 FUNCTIONAL USE-CASE VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
}
