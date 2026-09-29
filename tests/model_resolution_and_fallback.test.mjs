import assert from 'node:assert/strict';
import {
  resolveModelName,
  getModelFallbackCandidates,
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
test('DEFAULT_SETTINGS uses working production model (gemini-2.5-flash)', () => {
  assert.equal(DEFAULT_SETTINGS.model, 'gemini-2.5-flash');
});

// 2. Out-of-the-box model resolution
test('Empty or undefined settings resolves to gemini-2.5-flash', () => {
  assert.equal(resolveModelName({}), 'gemini-2.5-flash');
  assert.equal(resolveModelName({ model: '' }), 'gemini-2.5-flash');
  assert.equal(resolveModelName({ model: null }), 'gemini-2.5-flash');
});

// 3. Gemini 3 series alias resolution
test('gemini-3-flash aliases to gemini-3-flash-preview', () => {
  assert.equal(resolveModelName({ model: 'gemini-3-flash' }), 'gemini-3-flash-preview');
});

test('gemini-3-pro aliases to gemini-3.1-pro-preview', () => {
  assert.equal(resolveModelName({ model: 'gemini-3-pro' }), 'gemini-3.1-pro-preview');
});

test('gemini-3.1-pro aliases to gemini-3.1-pro-preview', () => {
  assert.equal(resolveModelName({ model: 'gemini-3.1-pro' }), 'gemini-3.1-pro-preview');
});

// 4. Stable GA models resolution
test('gemini-2.5-flash resolves directly without distortion', () => {
  assert.equal(resolveModelName({ model: 'gemini-2.5-flash' }), 'gemini-2.5-flash');
});

test('gemini-2.0-flash resolves directly without distortion', () => {
  assert.equal(resolveModelName({ model: 'gemini-2.0-flash' }), 'gemini-2.0-flash');
});

test('gemini-1.5-flash resolves directly without distortion', () => {
  assert.equal(resolveModelName({ model: 'gemini-1.5-flash' }), 'gemini-1.5-flash');
});

test('gemini-2.5-pro resolves directly without distortion', () => {
  assert.equal(resolveModelName({ model: 'gemini-2.5-pro' }), 'gemini-2.5-pro');
});

// 5. Cross-provider contamination sanitization
test('Ollama model strings in Gemini settings safely default to gemini-2.5-flash', () => {
  assert.equal(resolveModelName({ model: 'llama3.2:latest' }), 'gemini-2.5-flash');
  assert.equal(resolveModelName({ model: 'qwen2.5-coder:7b' }), 'gemini-2.5-flash');
  assert.equal(resolveModelName({ model: 'deepseek-r1:8b' }), 'gemini-2.5-flash');
  assert.equal(resolveModelName({ model: 'mistral:latest' }), 'gemini-2.5-flash');
});

// 6. Custom model handling
test('Custom model ID is preserved when model is "custom"', () => {
  assert.equal(
    resolveModelName({ model: 'custom', customModel: 'my-finetuned-gemini-model' }),
    'my-finetuned-gemini-model'
  );
});

test('Blank custom model defaults safely to gemini-2.5-flash', () => {
  assert.equal(
    resolveModelName({ model: 'custom', customModel: '   ' }),
    'gemini-2.5-flash'
  );
});

// 7. Fallback chains
test('Fallback candidate list for gemini-3-flash includes stable fallbacks', () => {
  const candidates = getModelFallbackCandidates('gemini-3-flash');
  assert.deepEqual(candidates, [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ]);
});

test('Fallback candidate list for gemini-2.5-flash includes 2.0 and 1.5 flash', () => {
  const candidates = getModelFallbackCandidates('gemini-2.5-flash');
  assert.deepEqual(candidates, [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ]);
});

// 8. Preset models catalogue
test('GEMINI_MODELS catalogue has working default preset', () => {
  const defaultModel = GEMINI_MODELS.find((m) => m.isDefault);
  assert.ok(defaultModel, 'Default model must be marked in GEMINI_MODELS');
  assert.equal(defaultModel.id, 'gemini-2.5-flash');
});

test('GEMINI_MODELS contains all core models', () => {
  const ids = GEMINI_MODELS.map((m) => m.id);
  assert.ok(ids.includes('gemini-2.5-flash'));
  assert.ok(ids.includes('gemini-2.0-flash'));
  assert.ok(ids.includes('gemini-1.5-flash'));
  assert.ok(ids.includes('gemini-2.5-pro'));
  assert.ok(ids.includes('gemini-1.5-pro'));
  assert.ok(ids.includes('gemini-3-flash'));
  assert.ok(ids.includes('gemini-3-pro'));
});

test('filterHistory correctly filters by model and badges including 3.1 pro', () => {
  const sampleHistory = [
    { id: '1', logs: 'err 1', model: 'gemini-2.5-flash', result: 'fix 1' },
    { id: '2', logs: 'err 2', model: 'gemini-2.0-flash', result: 'fix 2' },
    { id: '3', logs: 'err 3', model: 'gemini-1.5-flash', result: 'fix 3' },
    { id: '4', logs: 'err 4', model: 'gemini-3-flash', result: 'fix 4' },
    { id: '5', logs: 'err 5', model: 'gemini-3.1-pro', result: 'fix 5' },
  ];

  assert.equal(filterHistory(sampleHistory, '', 'All').length, 5);
  assert.equal(filterHistory(sampleHistory, '', '2.5 Flash').length, 1);
  assert.equal(filterHistory(sampleHistory, '', '2.0 Flash').length, 1);
  assert.equal(filterHistory(sampleHistory, '', '1.5 Flash').length, 1);
  assert.equal(filterHistory(sampleHistory, '', '3 Flash').length, 1);
  assert.equal(filterHistory(sampleHistory, '', '3 Pro').length, 1);
});

// 10. Extended aliases resolution
test('Extended and legacy model aliases resolve properly', () => {
  assert.equal(resolveModelName({ model: 'gemini-pro' }), 'gemini-1.5-pro');
  assert.equal(resolveModelName({ model: 'gemini-1.0-pro' }), 'gemini-1.5-pro');
  assert.equal(resolveModelName({ model: 'gemini-1.5-flash-latest' }), 'gemini-1.5-flash');
  assert.equal(resolveModelName({ model: 'gemini-1.5-pro-latest' }), 'gemini-1.5-pro');
  assert.equal(resolveModelName({ model: 'gemini-2.0-flash-exp' }), 'gemini-2.0-flash');
});

// 11. Fallbacks for 1.5 series models
test('Fallback candidate lists exist for gemini-1.5-pro and gemini-1.5-flash', () => {
  const proCandidates = getModelFallbackCandidates('gemini-1.5-pro');
  assert.ok(proCandidates.length >= 2, 'gemini-1.5-pro has fallback candidates');
  assert.ok(proCandidates.includes('gemini-2.5-pro'));

  const flashCandidates = getModelFallbackCandidates('gemini-1.5-flash');
  assert.ok(flashCandidates.length >= 2, 'gemini-1.5-flash has fallback candidates');
  assert.ok(flashCandidates.includes('gemini-2.5-flash'));
});

// 12. Model unavailability error detection
test('isModelUnavailableError detects various Google API error formats', async () => {
  const { isModelUnavailableError } = await import('../src/lib/gemini.js');
  assert.equal(isModelUnavailableError(new Error('404 Not Found')), true);
  assert.equal(isModelUnavailableError(new Error('models/gemini-3-flash is not found for API version v1beta')), true);
  assert.equal(isModelUnavailableError(new Error('models/gemini-3-flash is not supported for generateContent')), true);
  assert.equal(isModelUnavailableError(new Error('[GoogleGenerativeAI Error]: Error 400 Bad Request models/foo does not exist')), true);
  assert.equal(isModelUnavailableError(new Error('Invalid API key')), false);
  assert.equal(isModelUnavailableError(new Error('Resource exhausted / 429 quota')), false);
});

// 13. LoadSettings one-time migration and subsequent preservation
test('loadSettings migrates legacy default once, but preserves subsequent intentional user choice', async () => {
  const mockStorage = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mockStorage.has(k) ? mockStorage.get(k) : null),
    setItem: (k, v) => mockStorage.set(k, String(v)),
    removeItem: (k) => mockStorage.delete(k),
  };

  const { loadSettings: loadFn } = await import('../src/lib/settings.js');

  // Case A: Old unmigrated settings with legacy default
  mockStorage.set('CM_SETTINGS', JSON.stringify({ model: 'gemini-3-flash' }));
  const migrated = loadFn();
  assert.equal(migrated.model, 'gemini-2.5-flash', 'Legacy default gemini-3-flash migrated to 2.5');
  assert.equal(migrated._modelMigrated, true, 'Migration flag recorded');

  // Case B: User later explicitly selects gemini-3-flash
  mockStorage.set('CM_SETTINGS', JSON.stringify({ model: 'gemini-3-flash', _modelMigrated: true }));
  const reloaded = loadFn();
  assert.equal(reloaded.model, 'gemini-3-flash', 'Intentional user selection of gemini-3-flash is preserved');
});

console.log('================================================================');
console.log('ALL MODEL RESOLUTION & FALLBACK TESTS PASSED!');
console.log('================================================================');
