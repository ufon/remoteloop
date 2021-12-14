const express = require('express');
const nutjs = require('@nut-tree/nut-js');
const ip = require('ip');
const { dirname, join } = require('path');
const { WAIT, CONNECTED } = require('../constants/statuses');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  transports: ['websocket'],
});
const appBundleDirectory = join(dirname(require.resolve('@remoteloop/web/package.json')), 'dist');

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

      socket.on('pan', async event => {
        const { velocityX, velocityY } = event;

        const { x: oldX, y: oldY } = await nutjs.mouse.getPosition();

        await nutjs.mouse.move([new nutjs.Point(oldX + velocityX * 10 * 2, oldY + velocityY * 10 * 2)]);
      });

      socket.on('pan-drag', async event => {
        const { velocityX, velocityY } = event;
        const { x: oldX, y: oldY } = await nutjs.mouse.getPosition();

        await nutjs.mouse.move([new nutjs.Point(oldX + velocityX * 10 * 2, oldY + velocityY * 10 * 2)]);
      });

      socket.on('tap', async () => {
        await nutjs.mouse.leftClick();
      });

      socket.on('press', async () => {
        await nutjs.mouse.pressButton(nutjs.Button.LEFT);
      });

      socket.on('pressup', async () => {
        await nutjs.mouse.releaseButton(nutjs.Button.LEFT);
      });

      socket.on('scroll', async event => {
        const { velocityY } = event;

        await nutjs.mouse.scrollUp(velocityY * 10 * 2);
      });

      socket.on('keyboard-string', async string => {
        await nutjs.keyboard.type(string);
      });

      socket.on('keyboard-special', async keyCode => {
        await nutjs.keyboard.type(nutjs.Key[keyCode]);
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
