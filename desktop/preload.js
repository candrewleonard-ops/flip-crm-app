// Preload script — exposes a safe bridge to the renderer.
// Today it just exposes app metadata; tomorrow it can expose
// native integrations (notifications, file system, auto-update, etc.)
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("flipcrm", {
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron,
});
