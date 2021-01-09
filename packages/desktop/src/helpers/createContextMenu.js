const { Menu } = require("electron");

const contextMenu = Menu.buildFromTemplate([
  { id: "1", label: "About" },
  {
    id: "2",
    label: "Launch at startup",
    type: "checkbox",
    checked: true,
  },
  { type: "separator" },
  { id: "2", label: "Quit", role: "quit", accelerator: "Command+Q" },
]);

module.exports = contextMenu;
