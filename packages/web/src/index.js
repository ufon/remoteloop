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
const keyboardButtonNode = document.getElementById("toggle-keyboard");
const inputElement = document.getElementById("input");
const trackPadEvenListener = new Hammer.Manager(trackPadNode);

const state = {
  mouseLeftButtonState: "up",
  isKeyboardOpen: false
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
    socket.emit("pan-drag", event);
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

keyboardButtonNode.addEventListener("click", () => {
  const buttonIconElement = document.querySelector("#toggle-keyboard > i");
  if (!state.isKeyboardOpen) {
    inputElement.focus();
    buttonIconElement.classList.remove("up");
    buttonIconElement.classList.add("down");
    state.isKeyboardOpen = true;
  } else {
    inputElement.blur();
    buttonIconElement.classList.remove("down");
    buttonIconElement.classList.add("up");
    state.isKeyboardOpen = false;
  }
});
inputElement.addEventListener("keyup", (event) => {
  socket.emit("keyboard-tap", event.keyCode);
  inputElement.value = '';
});

inputElement.addEventListener('focusout', e => {
  buttonIconElement.classList.remove("down");
  buttonIconElement.classList.add("up");
  state.isKeyboardOpen = false;
});
