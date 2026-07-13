const { contextBridge } = require('electron');

// Expose a minimal API to the renderer if needed in the future
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
});
