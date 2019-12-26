const { app, BrowserWindow, Tray, Menu, ipcMain } = require("electron");
const path = require("path");
const controller = require("./server/controller.js");

const assetsDirectory = path.join(__dirname, "assets");

let tray;
let window;

const getWindowPosition = () => {
  const windowBounds = window.getBounds();
  const trayBounds = tray.getBounds();
  const x = Math.round(
    trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
  );
  const y = Math.round(trayBounds.y + trayBounds.height + 4);
  return { x, y };
};

const toggleWindow = () => {
  if (window.isVisible()) {
    window.hide();
  } else {
    const position = getWindowPosition();
    window.setPosition(position.x, position.y, false);
    window.show();
    window.setVisibleOnAllWorkspaces(true);
    window.focus();
    window.setVisibleOnAllWorkspaces(false);
  }
};

const createTray = () => {
  tray = new Tray(path.join(assetsDirectory, "remoteControl.png"));

  tray.on("right-click", toggleWindow);
  tray.on("double-click", toggleWindow);
  tray.on("click", toggleWindow);
};

const createWindow = () => {
  window = new BrowserWindow({
    width: 200,
    height: 200,
    frame: false,
    show: false,
    fullscreenable: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      backgroundThrottling: false
    }
  });
  window.loadFile(`${__dirname}/index.html`);

  window.on("blur", () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide();
    }
  });
};

app.on("ready", () => {
  app.dock.hide();
  controller.run();
  createTray();
  createWindow();
});

ipcMain.on("network-change", (event, onLine) => {
  if (onLine) {
    controller.stop();
    controller.run();
  }
});

ipcMain.on("menu-click", event => {
  const contextMenu = Menu.buildFromTemplate([
    { id: "1", label: "About", click: toggleWindow },
    { type: "separator" },
    { id: "2", label: "Quit", role: "quit" }
  ]);
  contextMenu.popup();
});

app.on("window-all-closed", () => {
  app.quit();
});
