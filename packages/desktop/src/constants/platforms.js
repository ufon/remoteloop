const os = require('os');

const platforms = {
  WINDOWS: 'WINDOWS',
  MAC: 'MAC',
  LINUX: 'LINUX',
};

const platformsNames = {
  win32: platforms.WINDOWS,
  darwin: platforms.MAC,
  linux: platforms.LINUX,
};

const currentPlatform = platformsNames[os.platform()];

module.exports.platformsNames = platformsNames;
module.exports.platforms = platforms;
module.exports.default = currentPlatform;
