// Modules to control application life and create native browser window
import { app, BrowserWindow, screen, session } from "electron";

/**
 * Sets up security measures for the application window
 * Note: nodeIntegration and contextIsolation remain permissive due to 
 * Puppeteer running in renderer process (architectural limitation)
 * @param {BrowserWindow} window - The browser window to secure
 */
const setupSecurityPolicies = (window) => {
  // Prevent navigation away from the app
  window.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    // Only allow file:// protocol for the main app window
    if (parsedUrl.protocol !== 'file:') {
      console.warn(`Blocked navigation to: ${navigationUrl}`);
      event.preventDefault();
    }
  });

  // Prevent new window creation from main app (Puppeteer windows are separate)
  window.webContents.setWindowOpenHandler(({ url }) => {
    console.warn(`Blocked window.open to: ${url}`);
    return { action: 'deny' };
  });

  // Block permission requests that aren't needed
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const deniedPermissions = [
      'media',
      'geolocation',
      'notifications',
      'midiSysex',
      'pointerLock',
      'fullscreen',
      'openExternal'
    ];
    
    if (deniedPermissions.includes(permission)) {
      console.warn(`Denied permission request: ${permission}`);
      return callback(false);
    }
    
    // Allow other permissions (like clipboard for app functionality)
    callback(true);
  });

  // Add Content Security Policy via headers
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data:; " +
          "connect-src 'self'; " +
          "font-src 'self'; " +
          "object-src 'none'; " +
          "base-uri 'self';"
        ]
      }
    });
  });
};

const createWindow = async () => {
  // Create the browser window.
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const mainWindow = new BrowserWindow({
    width: width / 2,
    height: height,
    frame: false,
    // x: 100,
    // y: 100,
    movable: true,
    fullscreen: false,
    show: false,
    closable: false,
    webPreferences: {
      webSecurity: true,  // ✅ ENABLED - Main window doesn't load external sites
      nodeIntegration: true,   // ⚠️ Required for Puppeteer in renderer
      sandbox: false,          // ⚠️ Required for Puppeteer in renderer
      contextIsolation: false, // ⚠️ Required for Puppeteer in renderer
      devTools: true,
    },
  });
  
  // Apply security policies
  setupSecurityPolicies(mainWindow);
  
  mainWindow.loadFile("src/index.html");

  mainWindow.once("ready-to-show", () => {
    mainWindow.setTitle("Min Økonomihjelper");
    mainWindow.show();
    mainWindow.focus();
    // mainWindow.setPosition(600, 500);
  });
  // and load the index.html of the app.

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  return mainWindow;
};

app.whenReady().then(async () => {
  let w = await createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});


