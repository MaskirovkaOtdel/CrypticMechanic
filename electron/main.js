const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'default',
    title: 'CrypticMechanic',
    backgroundColor: '#0a0b10',
    show: false,
  });

  // Load the built Vite output
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  // Show when ready to avoid flash
  win.once('ready-to-show', () => {
    win.show();
  });

  // Remove default menu
  win.setMenu(null);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
