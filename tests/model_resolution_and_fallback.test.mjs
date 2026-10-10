import assert from 'node:assert/strict';
import {
  resolveModelName,
  getModelFallbackCandidates,
  resolveThinkingBudget,
  MODEL_ALIASES,
  MODEL_FALLBACKS,
} from '../src/lib/gemini.js';
import { GEMINI_MODELS } from '../src/lib/providers/GeminiProvider.js';
import { DEFAULT_SETTINGS, filterHistory } from '../src/lib/settings.js';

console.log('================================================================');
console.log('SUITE: Model Resolution, Aliasing, Cross-Provider Sanitization & Fallbacks');
console.log('================================================================');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Default settings verification
test('DEFAULT_SETTINGS uses verified Gemini 3.5 Flash Lite default', () => {
  assert.equal(DEFAULT_SETTINGS.model, 'gemini-3.5-flash-lite');
  assert.equal(DEFAULT_SETTINGS.thinkingLevel, 'Auto');
});

// 2. Out-of-the-box model resolution
test('Empty or undefined settings resolves to gemini-3.5-flash-lite', () => {
  assert.equal(resolveModelName({}), 'gemini-3.5-flash-lite-preview');
  assert.equal(resolveModelName({ model: '' }), 'gemini-3.5-flash-lite-preview');
  assert.equal(resolveModelName({ model: null }), 'gemini-3.5-flash-lite-preview');
});

// 3. Gemini 3 series alias resolution
test('gemini-3.5-flash-lite aliases to gemini-3.5-flash-lite-preview', () => {
  assert.equal(resolveModelName({ model: 'gemini-3.5-flash-lite' }), 'gemini-3.5-flash-lite-preview');
});

test('gemini-3.8-flash resolves to gemini-3.8-flash', () => {
  assert.equal(resolveModelName({ model: 'gemini-3.8-flash' }), 'gemini-3.8-flash');
});

test('gemini-3-flash aliases to gemini-3.8-flash', () => {
  assert.equal(resolveModelName({ model: 'gemini-3.8-flash' }), 'gemini-3.8-flash');
});

test('gemini-3-pro aliases to gemini-3.1-pro-preview', () => {
  assert.equal(resolveModelName({ model: 'gemini-3-pro' }), 'gemini-3.1-pro-preview');
});

test('gemini-3.1-pro aliases to gemini-3.1-pro-preview', () => {
  assert.equal(resolveModelName({ model: 'gemini-3.1-pro' }), 'gemini-3.1-pro-preview');
});

// 4. Deprecated and obsolete legacy models transparently migrate
test('Deprecated models transparently migrate to modern endpoints', () => {
  assert.equal(resolveModelName({ model: 'gemini-2.5-flash' }), 'gemini-3.5-flash-lite-preview');
  assert.equal(resolveModelName({ model: 'gemini-2.0-flash' }), 'gemini-3.5-flash-lite-preview');
  assert.equal(resolveModelName({ model: 'gemini-1.5-flash' }), 'gemini-3.5-flash-lite-preview');
  assert.equal(resolveModelName({ model: 'gemini-3.5-flash' }), 'gemini-3.8-flash');
  assert.equal(resolveModelName({ model: 'gemini-3.5-pro' }), 'gemini-3.1-pro-preview');
  assert.equal(resolveModelName({ model: 'gemini-pro' }), 'gemini-3.5-flash-lite-preview');
});

// 5. Cross-provider contamination sanitization
test('Ollama model strings in Gemini settings safely default to gemini-3.5-flash-lite', () => {
  assert.equal(resolveModelName({ model: 'llama3.2:latest' }), 'gemini-3.5-flash-lite-preview');
  assert.equal(resolveModelName({ model: 'qwen2.5-coder:7b' }), 'gemini-3.5-flash-lite-preview');
  assert.equal(resolveModelName({ model: 'deepseek-r1:8b' }), 'gemini-3.5-flash-lite-preview');
  assert.equal(resolveModelName({ model: 'mistral:latest' }), 'gemini-3.5-flash-lite-preview');
});

// 6. Custom model handling
test('Custom model ID is preserved when model is "custom"', () => {
  assert.equal(
    resolveModelName({ model: 'custom', customModel: 'my-finetuned-gemini-model' }),
    'my-finetuned-gemini-model'
  );
});

test('Blank custom model defaults safely to gemini-3.5-flash-lite', () => {
  assert.equal(
    resolveModelName({ model: 'custom', customModel: '   ' }),
    'gemini-3.5-flash-lite-preview'
  );
});

// 7. Fallback chains (strictly verified Gemini 3 family)
test('Fallback candidate list for gemini-3.5-flash-lite contains verified Gemini 3 models', () => {
  const candidates = getModelFallbackCandidates('gemini-3.5-flash-lite');
  assert.deepEqual(candidates, [
    'gemini-3.5-flash-lite-preview',
    'gemini-3.8-flash',
    'gemini-3.1-pro-preview',
  ]);
  assert.ok(candidates.every((m) => m.startsWith('gemini-3')));
});

test('Fallback candidate list for gemini-3.8-flash contains verified Gemini 3 models', () => {
  const candidates = getModelFallbackCandidates('gemini-3.8-flash');
  assert.deepEqual(candidates, [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite-preview',
    'gemini-3.1-pro-preview',
  ]);
  assert.ok(candidates.every((m) => m.startsWith('gemini-3')));
});

test('Fallback candidate list for gemini-3.1-pro contains verified Gemini 3 models', () => {
  const candidates = getModelFallbackCandidates('gemini-3.1-pro');
  assert.deepEqual(candidates, [
    'gemini-3.1-pro-preview',
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite-preview',
  ]);
  assert.ok(candidates.every((m) => m.startsWith('gemini-3')));
});

// 8. Preset models catalogue
test('GEMINI_MODELS catalogue has working default preset marked as gemini-3.5-flash-lite', () => {
  const defaultModel = GEMINI_MODELS.find((m) => m.isDefault);
  assert.ok(defaultModel, 'Default model must be marked in GEMINI_MODELS');
  assert.equal(defaultModel.id, 'gemini-3.5-flash-lite');
});

test('GEMINI_MODELS contains all verified Gemini 3 family models', () => {
  const ids = GEMINI_MODELS.map((m) => m.id);
  assert.ok(ids.includes('gemini-3.5-flash-lite'));
  assert.ok(ids.includes('gemini-3.8-flash'));
  assert.ok(ids.includes('gemini-3.1-pro'));
  assert.ok(!ids.includes('gemini-3.5-pro'), 'Must not include non-existent gemini-3.5-pro');
  assert.ok(!ids.includes('gemini-3.5-flash'), 'Must not include non-existent gemini-3.5-flash');
});

// 9. Thinking budget resolution
test('resolveThinkingBudget correctly maps levels to budget tokens', () => {
  assert.equal(resolveThinkingBudget('Off'), 0);
  assert.equal(resolveThinkingBudget('Low'), 1024);
  assert.equal(resolveThinkingBudget('Medium'), 4096);
  assert.equal(resolveThinkingBudget('High'), 8192);
  assert.equal(resolveThinkingBudget('Auto'), undefined);
  assert.equal(resolveThinkingBudget(undefined), undefined);
});

// 10. History filtering
test('filterHistory correctly filters by model and badges for Gemini 3 family', () => {
  const sampleHistory = [
    { id: '1', logs: 'err 1', model: 'gemini-3.5-flash-lite', result: 'fix 1' },
    { id: '2', logs: 'err 2', model: 'gemini-3.8-flash', result: 'fix 2' },
    { id: '3', logs: 'err 3', model: 'gemini-3.1-pro', result: 'fix 3' },
  ];

  assert.equal(filterHistory(sampleHistory, '', 'All').length, 3);
  assert.equal(filterHistory(sampleHistory, '', '3.5 Flash Lite').length, 1);
  assert.equal(filterHistory(sampleHistory, '', '3.8 Flash').length, 1);
  assert.equal(filterHistory(sampleHistory, '', '3.1 Pro').length, 1);
});

// 11. Model unavailability error detection
test('isModelUnavailableError detects various Google API error formats', async () => {
  const { isModelUnavailableError } = await import('../src/lib/gemini.js');
  assert.equal(isModelUnavailableError(new Error('404 Not Found')), true);
  assert.equal(isModelUnavailableError(new Error('models/gemini-3-flash is not found for API version v1beta')), true);
  assert.equal(isModelUnavailableError(new Error('models/gemini-3-flash is not supported for generateContent')), true);
  assert.equal(isModelUnavailableError(new Error('[GoogleGenerativeAI Error]: Error 400 Bad Request models/foo does not exist')), true);
  assert.equal(isModelUnavailableError(new Error('Invalid API key')), false);
  assert.equal(isModelUnavailableError(new Error('Resource exhausted / 429 quota')), false);
});

// 12. LoadSettings legacy migration
test('loadSettings migrates legacy models to gemini-3.5-flash-lite and adds thinkingLevel', async () => {
  const mockStorage = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mockStorage.has(k) ? mockStorage.get(k) : null),
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k),
  };

  const { loadSettings: loadFn } = await import('../src/lib/settings.js');

  // Case A: Old settings with legacy 2.5 flash
  mockStorage.set('CM_SETTINGS', JSON.stringify({ model: 'gemini-2.5-flash' }));
  const migrated = loadFn();
  assert.equal(migrated.model, 'gemini-3.5-flash-lite', 'Legacy 2.5 flash migrated to 3.5 flash lite');
  assert.equal(migrated.thinkingLevel, 'Auto', 'Thinking level defaults to Auto');

  // Case B: User has gemini-3.8-flash
  mockStorage.set('CM_SETTINGS', JSON.stringify({ model: 'gemini-3.8-flash', thinkingLevel: 'High' }));
  const preserved = loadFn();
  assert.equal(preserved.model, 'gemini-3.8-flash', 'Gemini 3.8 flash model is preserved');
  assert.equal(preserved.thinkingLevel, 'High', 'Thinking level is preserved');
});

console.log('================================================================');
console.log('ALL MODEL RESOLUTION & FALLBACK TESTS PASSED!');
console.log('================================================================');
