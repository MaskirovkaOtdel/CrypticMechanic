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

// 9. History filtering
test('filterHistory correctly filters by model and badges', () => {
  const sampleHistory = [
    { id: '1', logs: 'err 1', model: 'gemini-2.5-flash', result: 'fix 1' },
    { id: '2', logs: 'err 2', model: 'gemini-2.0-flash', result: 'fix 2' },
    { id: '3', logs: 'err 3', model: 'gemini-1.5-flash', result: 'fix 3' },
    { id: '4', logs: 'err 4', model: 'gemini-3-flash', result: 'fix 4' },
  ];

  assert.equal(filterHistory(sampleHistory, '', 'All').length, 4);
  assert.equal(filterHistory(sampleHistory, '', '2.5 Flash').length, 1);
  assert.equal(filterHistory(sampleHistory, '', '2.0 Flash').length, 1);
  assert.equal(filterHistory(sampleHistory, '', '1.5 Flash').length, 1);
  assert.equal(filterHistory(sampleHistory, '', '3 Flash').length, 1);
});

console.log('================================================================');
console.log('ALL MODEL RESOLUTION & FALLBACK TESTS PASSED!');
console.log('================================================================');
