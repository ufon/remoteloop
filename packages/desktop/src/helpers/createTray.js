const { Tray } = require("electron");
const { assetsPath } = require("../constants/paths");
const contextMenu = require("./createContextMenu");
const { toggleWindow } = require("./createWindow");

const createTray = (window) => {
  console.log(assetsPath);
  tray = new Tray(assetsPath + "/remoteControl.png");
  tray.on("click", () => toggleWindow(window, tray));
  tray.on("right-click", () => {
    contextMenu.popup();
  });

  return tray;
};

module.exports = createTray;
