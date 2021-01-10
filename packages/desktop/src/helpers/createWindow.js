const { BrowserWindow } = require('electron');
const { htmlPath } = require('../constants/paths');
const { default: currentPlatform, platforms } = require('../constants/platforms.js');

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
  window.loadFile(htmlPath + '/index.html');
  window.on('blur', window.hide);
  window.setAlwaysOnTop(true, 'status');

  return window;
};

const toggleWindow = (window, tray) => {
  let windowY;
  const { width: windowWidth } = window.getBounds();
  const { x, y, width, height } = tray.getBounds();
  const windowX = Math.round(x + width / 2 - windowWidth / 2);
  if (currentPlatform === platforms.WINDOWS) {
    windowY = Math.round(y - height - 160);
  } else if (currentPlatform === platforms.MAC) {
    windowY = Math.round(y + height + 4);
  }
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
