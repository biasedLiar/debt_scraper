// Modules to control application life and create native browser window
import { app, BrowserWindow, screen, session } from "electron";

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
      webSecurity: false,
      nodeIntegration: true,
      sandbox: false,
      contextIsolation: false,
      devTools: true,
    },
  });
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
