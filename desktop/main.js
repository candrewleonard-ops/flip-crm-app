// Electron main process — spawns the Next.js standalone server
// and loads it in a desktop window.
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

const DEV = process.env.ELECTRON_DEV === "true";
const DEV_URL = "http://localhost:3000";
const PROD_PORT = 41732; // arbitrary port for bundled Next.js server

let mainWindow = null;
let nextProcess = null;

function waitForServer(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http.get(url, (res) => {
        res.resume();
        resolve();
      }).on("error", () => {
        if (Date.now() - start > timeoutMs) return reject(new Error("server timeout"));
        setTimeout(check, 250);
      });
    };
    check();
  });
}

function resolveServerPath() {
  const base = app.isPackaged
    ? path.join(process.resourcesPath, "next-app")
    : path.join(__dirname, "next-app");
  return {
    serverJs: path.join(base, "server.js"),
    cwd: base,
  };
}

async function startNextServer() {
  const { serverJs, cwd } = resolveServerPath();
  nextProcess = spawn(process.execPath, [serverJs], {
    cwd,
    env: {
      ...process.env,
      PORT: String(PROD_PORT),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  nextProcess.stdout.on("data", (d) => console.log("[next]", d.toString()));
  nextProcess.stderr.on("data", (d) => console.error("[next]", d.toString()));
  await waitForServer(`http://127.0.0.1:${PROD_PORT}`);
  return `http://127.0.0.1:${PROD_PORT}`;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "FlipCRM",
    backgroundColor: "#f8fafc",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const url = DEV ? DEV_URL : await startNextServer();
  await mainWindow.loadURL(url);

  if (DEV) mainWindow.webContents.openDevTools({ mode: "detach" });
}

function buildMenu() {
  const template = [
    { label: "File", submenu: [{ role: "quit" }] },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About FlipCRM",
          click: () => shell.openExternal("https://reinnovationhomes.com"),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (nextProcess) {
    try { nextProcess.kill(); } catch {}
    nextProcess = null;
  }
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (nextProcess) {
    try { nextProcess.kill(); } catch {}
  }
});
