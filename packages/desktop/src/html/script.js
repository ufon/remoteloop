const ipcRenderer = require("electron").ipcRenderer;
const ip = require("ip");
const qrcode = require("qrcode");
const { WAIT, CONNECTED } = require("../constants/statuses");

const canvasElement = document.getElementById("qr-code");
const menuElement = document.getElementById("menu");
const refreshElement = document.getElementById("refresh");
const statusElement = document.getElementById("network-status");

const QRCode = {
  draw: () => {
    console.log(`Current public IPv4: ${ip.address("public", "ipv4")}`);

    qrcode.toCanvas(
      canvasElement,
      "http://" + ip.address("public", "ipv4") + ":7007",
      {
        scale: 3.5,
      }
    );
  },
  update: () => {
    if (navigator.onLine) {
      QRCode.draw();
      ipcRenderer.send("restart", navigator.onLine);
    }
  },
};

/* Server events */
ipcRenderer.on("status-changed", (event, status) => {
  if (status === WAIT) {
    statusElement.classList.add("connection-connecting");
  }

  if (status === CONNECTED) {
    statusElement.classList.remove("connection-connecting");
  }
});

/* Menu element events */
menuElement.addEventListener("click", () => {
  ipcRenderer.send("menu-click");
});

/* Refresh button events */
refreshElement.addEventListener("click", QRCode.update);

/* Window events */
window.addEventListener("online", QRCode.update);
window.addEventListener("offline", QRCode.update);

/* QRCode drawing */
QRCode.draw();
