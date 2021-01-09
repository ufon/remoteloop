const { app, ipcMain, BrowserWindow } = require("electron");
const contextMenu = require("./helpers/createContextMenu.js");
const createTray = require("./helpers/createTray.js");
const { default: createWindow } = require("./helpers/createWindow.js");
const controller = require("./server/controller.js");

let window;

app.on("ready", () => {
  app.dock.hide();
  window = createWindow();
  createTray(window);

  window.webContents.on("did-finish-load", () => {
    controller.run(window);
  });
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    window = createWindow();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("restart", (event, onLine) => {
  if (onLine) {
    controller.restart(window);
  }
});

ipcMain.on("menu-click", () => {
  contextMenu.popup();
});

// [
//   `exit`,
//   `SIGINT`,
//   `SIGUSR1`,
//   `SIGUSR2`,
//   // `uncaughtException`,
//   `SIGTERM`,
// ].forEach((event) => {
//   process.on(event, () => {
//     controller.stop(process.exit);
//   });
// });
