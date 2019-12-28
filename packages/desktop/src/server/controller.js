const express = require("express");
const http = require("http");
const robot = require("robotjs");
const { dirname, join } = require("path");
const keycode = require("keycode");
const app = express();
const server = http.Server(app);
const io = require("socket.io")(server);
const appBundleDirectory = join(
  dirname(require.resolve("@remoteloop/web/package.json")),
  "dist"
);
robot.setMouseDelay(1);
robot.setKeyboardDelay(1);

app.use(express.static(appBundleDirectory));

io.sockets.on("connection", socket => {
  socket.on("pan", event => {
    const { x: oldX, y: oldY } = robot.getMousePos();
    const { velocityX, velocityY } = event;

    robot.moveMouse(oldX + velocityX * 10 * 2, oldY + velocityY * 10 * 2);
  });

  socket.on("pan-drag", event => {
    const { x: oldX, y: oldY } = robot.getMousePos();
    const { velocityX, velocityY } = event;

    robot.dragMouse(oldX + velocityX * 10 * 2, oldY + velocityY * 10 * 2);
  });

  socket.on("tap", () => {
    robot.mouseClick();
  });

  socket.on("press", () => {
    robot.mouseToggle("down");
  });

  socket.on("pressup", event => {
    robot.mouseToggle("up");
  });

  socket.on("scroll", event => {
    const { velocityY } = event;
    robot.scrollMouse(0, velocityY * 10 * 2);
  });

  socket.on("keyboard-string", string => {
    robot.typeString(string);
  });

  socket.on("keyboard-special", code => {
    robot.keyTap(keycode(code));
  });
});

const controller = {
  run: () => {
    const localAddress = require("ip").address();
    server.listen(50004, localAddress);
  },
  stop: () => {
    server.close();
  }
};

module.exports = controller;
