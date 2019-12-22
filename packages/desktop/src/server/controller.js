const express = require("express");
const http = require("http");
const robot = require("robotjs");
const { dirname, join } = require("path");
const log = require("electron-log");

const app = express();
const server = http.Server(app);
const io = require("socket.io")(server);
const appBundleDirectory = join(
  dirname(require.resolve("@remoteloop/web/package.json")),
  "dist"
);
robot.setMouseDelay(1);

app.use(express.static(appBundleDirectory));

io.sockets.on("connection", socket => {
  log.info("Connected");

  socket.on("pan", event => {
    const { x: oldX, y: oldY } = robot.getMousePos();
    const { velocityX, velocityY } = event;

    log.info("Pan event fired");

    log.info("robotjs:", robot.moveMouse);

    robot.moveMouse(oldX + velocityX * 10 * 2, oldY + velocityY * 10 * 2);
  });

  socket.on("pandrag", event => {
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
});

const controller = {
  run: () => {
    const localAddress = require("ip").address();
    server.listen(8080, localAddress);
  },
  stop: () => {
    server.close();
  }
};

module.exports = controller;
