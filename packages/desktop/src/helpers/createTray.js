const { Tray } = require('electron');
const { assetsPath } = require('../constants/paths');
const { toggleWindow } = require('./createWindow');

const createTray = window => {
  console.log(assetsPath);
  tray = new Tray(assetsPath + '/remoteControl.png');
  tray.setToolTip('remoteloop');
  tray.on('click', () => toggleWindow(window, tray));

  return tray;
};

module.exports = createTray;
