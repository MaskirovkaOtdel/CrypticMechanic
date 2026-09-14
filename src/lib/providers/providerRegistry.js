import { GeminiProvider } from './GeminiProvider.js';

const providers = new Map();
let defaultProviderId = 'gemini';

// Pre-register built-in default provider (Gemini)
const defaultGemini = new GeminiProvider();
providers.set(defaultGemini.id, defaultGemini);

/**
 * Register an AIProvider instance in the registry.
 * @param {import('./AIProvider').AIProvider} provider
 */
export function registerProvider(provider) {
  if (!provider || !provider.id) {
    throw new Error('Invalid provider: must be an AIProvider instance with an id.');
  }
  providers.set(provider.id, provider);
}

/**
 * Unregister a provider by id. The default Gemini provider cannot be unregistered.
 * @param {string} id
 * @returns {boolean}
 */
export function unregisterProvider(id) {
  if (id === defaultProviderId) return false;
  return providers.delete(id);
}

/**
 * Retrieve a registered provider by its ID.
 * @param {string} id
 * @returns {import('./AIProvider').AIProvider|undefined}
 */
export function getProvider(id) {
  return providers.get(id);
}

/**
 * Get all registered providers.
 * @returns {Array<import('./AIProvider').AIProvider>}
 */
export function getAllProviders() {
  return Array.from(providers.values());
}

/**
 * Get the default fallback provider.
 * @returns {import('./AIProvider').AIProvider}
 */
export function getDefaultProvider() {
  return providers.get(defaultProviderId) || defaultGemini;
}

/**
 * Set the default provider ID.
 * @param {string} id
 */
export function setDefaultProvider(id) {
  if (providers.has(id)) {
    defaultProviderId = id;
  }
}

/**
 * Resolve the active provider according to settings.
 * Falls back to default provider if specified provider is not found.
 * @param {Object} [settings]
 * @returns {import('./AIProvider').AIProvider}
 */
export function getActiveProvider(settings = {}) {
  const providerId = settings?.provider;
  if (providerId && providers.has(providerId)) {
    return providers.get(providerId);
  }
  return getDefaultProvider();
}
