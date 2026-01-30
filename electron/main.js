import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple demos; secure apps should use preload scripts
      webSecurity: false // sometimes needed for local file loading in dev without simpler setup
    }
  });

  // Determine if we are in development or production
  // Ideally, we check an env var or if we can connect to localhost
  // For simplicity: try localhost, fallback to file
  
  // Note: users usually run 'npm run dev' AND 'electron .'
  // We will default to loading the production build if available,
  // or the dev server URL if we assume dev mode.
  // A common pattern is to pass a flag or check env.
  
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    // Try to connect to Vite dev server
    // You must run 'npm run dev' separately!
    win.loadURL('http://localhost:5173').catch(() => {
        // Fallback or log error
        console.log('Vite server not running? Loading local file...');
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    });
    // Open DevTools
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Auto-grant permissions for things like microphone
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media'];
    if (allowedPermissions.includes(permission)) {
      callback(true); // Approve
    } else {
      callback(false); // Deny
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
