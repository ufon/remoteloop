const { Tray } = require('electron');
const { assetsPath } = require('../constants/paths');
const contextMenu = require('./createContextMenu');
const { toggleWindow } = require('./createWindow');

const createTray = window => {
  console.log(assetsPath);
  tray = new Tray(assetsPath + '/remoteControl.png');
  tray.setToolTip('remoteloop');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => toggleWindow(window, tray));
  tray.on('right-click', () => tray.popUpContextMenu());
  tray.on('blur', () => tray.closeContextMenu());

  return tray;
};

module.exports = createTray;
