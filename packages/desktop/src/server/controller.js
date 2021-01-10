const express = require('express');
const robot = require('robotjs');
const ip = require('ip');
const { dirname, join } = require('path');
const { WAIT, CONNECTED } = require('../constants/statuses');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  transports: ['websocket'],
});
const appBundleDirectory = join(dirname(require.resolve('@remoteloop/web/package.json')), 'dist');

robot.setMouseDelay(1);
robot.setKeyboardDelay(1);

app.use(express.static(appBundleDirectory));

io.sockets.setMaxListeners(2);

const controller = {
  run: window => {
    const localAddress = ip.address('public', 'ipv4');

    io.on('connection', socket => {
      socket.removeAllListeners();

      console.log('user-agent: ' + socket.request.headers['user-agent']);

      if (window && window.webContents) {
        window.webContents.send('status-changed', CONNECTED);

        socket.on('disconnect', () => {
          if (Object.keys(io.sockets.sockets).length === 0) {
            window.webContents.send('status-changed', WAIT);
          }
        });
      }

      socket.on('pan', event => {
        const { x: oldX, y: oldY } = robot.getMousePos();
        const { velocityX, velocityY } = event;

        robot.moveMouse(oldX + velocityX * 10 * 2, oldY + velocityY * 10 * 2);
      });

      socket.on('pan-drag', event => {
        const { x: oldX, y: oldY } = robot.getMousePos();
        const { velocityX, velocityY } = event;

        robot.dragMouse(oldX + velocityX * 10 * 2, oldY + velocityY * 10 * 2);
      });

      socket.on('tap', () => {
        robot.mouseClick();
      });

      socket.on('press', () => {
        robot.mouseToggle('down');
      });

      socket.on('pressup', () => {
        robot.mouseToggle('up');
      });

      socket.on('scroll', event => {
        const { velocityY } = event;
        robot.scrollMouse(0, velocityY * 10 * 2);
      });

      socket.on('keyboard-string', string => {
        robot.typeString(string);
      });

      socket.on('keyboard-special', keyCode => {
        robot.keyTap(keyCode.toLowerCase());
      });
    });

    server.listen(7007, localAddress);
  },
  stop: callback => {
    server.close(callback);
  },
  restart: window => {
    server.close(() => {
      controller.run(window);
    });
  },
};

module.exports = controller;
