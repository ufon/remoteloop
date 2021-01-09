const { BrowserWindow } = require("electron");
const { htmlPath } = require("../constants/paths");

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
      backgroundThrottling: false,
    },
  });
  window.loadFile(htmlPath + "/index.html");
//   window.on("blur", window.hide);

  return window;
};

const toggleWindow = (window, tray) => {
  const { width: windowWidth } = window.getBounds();
  const { x, y, width, height } = tray.getBounds();
  const windowX = Math.round(x + width / 2 - windowWidth / 2);
  const windowY = Math.round(y + height + 4);

  if (window.isVisible()) {
    window.hide();
  } else {
    window.setPosition(windowX, windowY, false);
    window.setVisibleOnAllWorkspaces(true);
    window.show();
    window.setVisibleOnAllWorkspaces(false);
  }
};

module.exports.toggleWindow = toggleWindow;
module.exports.default = createWindow;
