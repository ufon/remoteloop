import io from "socket.io-client";
import Hammer from "hammerjs";
import {
  pressResolverSettings,
  multiPanResolverSettings,
  singlePanResolverSettings
} from "./resolvers";

const socketServer = window.location.href;
const socket = io(socketServer);
const trackPadNode = document.getElementById("trackpad");
const trackPadEvenListener = new Hammer.Manager(trackPadNode);

const state = {
  mouseLeftButtonState: "up"
};

const singlepan = new Hammer.Pan(singlePanResolverSettings);
const multipan = new Hammer.Pan(multiPanResolverSettings);
const press = new Hammer.Press(pressResolverSettings);
const tap = new Hammer.Tap();

singlepan.recognizeWith(multipan);
multipan.requireFailure(singlepan);

trackPadEvenListener.add([singlepan, multipan, press, tap]);

trackPadEvenListener.on("multipanup multipandown", event => {
  socket.emit("scroll", event);
});

trackPadEvenListener.on("pan", event => {
  if (state.mouseLeftButtonState === "up") {
    socket.emit("pan", event);
  } else {
    socket.emit("pandrag", event);
  }
});

trackPadEvenListener.on("press tap", event => {
  if (event.type === "tap") {
    socket.emit("tap", event);
  } else {
    socket.emit("press", event);
    state.mouseLeftButtonState = "down";
  }
});

trackPadEvenListener.on("panend pressup", event => {
  socket.emit("pressup", event);
  state.mouseLeftButtonState = "up";
});

trackPadEvenListener.on("pinch", event => {
  socket.emit("pinch", event);
});
