import { registerProvider, getProvider, getAllProviders, getDefaultProvider } from './providers/providerRegistry.js';

const registeredExtensions = [];
const settingsPanels = [];
const uiHooks = {
  headerActions: [],
  statusBarItems: [],
  badges: [],
};

let initialized = false;

/**
 * Register a custom React component or panel to render in the Settings dialog.
 * @param {Function|React.ComponentType} panel
 */
export function registerSettingsPanel(panel) {
  if (panel && !settingsPanels.includes(panel)) {
    settingsPanels.push(panel);
  }
}

/**
 * Get all registered settings panels.
 * @returns {Array<Function|React.ComponentType>}
 */
export function getRegisteredSettingsPanels() {
  return settingsPanels;
}

/**
 * Register a UI hook item (e.g. 'headerActions', 'statusBarItems', 'badges').
 * @param {string} type
 * @param {any} item
 */
export function registerUIHook(type, item) {
  if (uiHooks[type] && item && !uiHooks[type].includes(item)) {
    uiHooks[type].push(item);
  }
}

/**
 * Get registered UI hook items.
 * @param {string} [type]
 * @returns {Object|Array}
 */
export function getUIHooks(type) {
  if (type) {
    return uiHooks[type] || [];
  }
  return uiHooks;
}

/**
 * Retrieve the list of initialized extension descriptors.
 * @returns {Array<{ path: string, module: any }>}
 */
export function getExtensions() {
  return registeredExtensions;
}

/**
 * Auto-discover and initialize extensions placed in src/extensions/ or src/pro/.
 * In the public community open-core repository, no extensions exist; returns empty without errors.
 * In downstream/Pro editions, any extension matching the glob pattern is automatically discovered.
 */
export function initExtensions() {
  if (initialized) {
    return registeredExtensions;
  }
  initialized = true;

  // Auto-discover extensions non-invasively via Vite glob imports
  const extensionModules = {
    ...import.meta.glob('/src/extensions/*/index.{js,jsx}', { eager: true }),
    ...import.meta.glob('/src/pro/**/*.{js,jsx}', { eager: true }),
  };

  const context = {
    registerProvider,
    registerSettingsPanel,
    registerUIHook,
    getProvider,
    getAllProviders,
    getDefaultProvider,
  };

  for (const path in extensionModules) {
    const mod = extensionModules[path];
    try {
      if (typeof mod?.register === 'function') {
        mod.register(context);
        registeredExtensions.push({ path, module: mod });
      } else if (typeof mod?.default === 'function') {
        mod.default(context);
        registeredExtensions.push({ path, module: mod });
      } else if (mod?.default && typeof mod.default.register === 'function') {
        mod.default.register(context);
        registeredExtensions.push({ path, module: mod });
      }
    } catch (err) {
      console.error(`[CrypticMechanic] Failed to initialize extension at ${path}:`, err);
    }
  }

  return registeredExtensions;
}
