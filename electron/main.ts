import {
  app,
  BrowserWindow,
  protocol,
  ipcMain,
  dialog,
  shell,
  Menu,
  net,
} from "electron";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import type {
  DB,
  StoredFile,
  ImportFileArgs,
  PickAndImportArgs,
  ExportInvoicePdfArgs,
  FileKind,
  FileAccept,
  BackupResult,
} from "../src/lib/types";
import { createSeedDb, normalizeDb } from "../src/lib/seed";

// ------------------------------------------------------------
// Paths — everything lives under Electron's per-user userData dir.
// ------------------------------------------------------------
const dataDir = app.getPath("userData");
const dbFile = path.join(dataDir, "flipcrm-db.json");
const mediaDir = path.join(dataDir, "media");

function ensureDirs() {
  fs.mkdirSync(mediaDir, { recursive: true });
}

// ------------------------------------------------------------
// Custom media:// protocol — maps media://<relPath> to a real file
// inside <userData>/media/ so images & video render in the renderer
// without disabling web security.
// ------------------------------------------------------------
protocol.registerSchemesAsPrivileged([
  {
    scheme: "media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true, // enables range requests for <video>
      bypassCSP: false,
    },
  },
]);

function registerMediaProtocol() {
  protocol.handle("media", async (request) => {
    try {
      const url = new URL(request.url);
      // media://<projectId>/<file> → hostname=projectId, pathname=/<file>
      const rel = decodeURIComponent(`${url.hostname}${url.pathname}`);
      const normalized = path
        .normalize(rel)
        .replace(/^(\.\.(\/|\\|$))+/, "");
      const filePath = path.join(mediaDir, normalized);
      if (!filePath.startsWith(mediaDir)) {
        return new Response("Forbidden", { status: 403 });
      }
      return net.fetch(pathToFileURL(filePath).toString());
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });
}

// ------------------------------------------------------------
// Database load / save (atomic)
// ------------------------------------------------------------
function loadDb(): DB {
  try {
    if (!fs.existsSync(dbFile)) {
      const seeded = createSeedDb();
      saveDbSync(seeded);
      return seeded;
    }
    const raw = fs.readFileSync(dbFile, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    return normalizeDb(parsed);
  } catch (err) {
    console.error("[db] load failed, returning seed:", err);
    return createSeedDb();
  }
}

function saveDbSync(db: DB) {
  ensureDirs();
  const tmp = `${dbFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tmp, dbFile);
}

// ------------------------------------------------------------
// File helpers
// ------------------------------------------------------------
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".heic", ".avif", ".svg"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"]);
const DOC_EXT = new Set([".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv", ".rtf", ".pages", ".numbers"]);

function kindFromExt(name: string): FileKind {
  const ext = path.extname(name).toLowerCase();
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  if (ext === ".pdf") return "pdf";
  if (DOC_EXT.has(ext)) return "doc";
  return "other";
}

async function importOne(
  projectId: string,
  kind: FileKind,
  originalName: string,
  opts: { sourcePath?: string; base64?: string }
): Promise<StoredFile> {
  ensureDirs();
  const ext = path.extname(originalName).toLowerCase();
  const id = randomUUID();
  const fileName = `${id}${ext}`;
  const dir = path.join(mediaDir, projectId);
  await fs.promises.mkdir(dir, { recursive: true });
  const dest = path.join(dir, fileName);

  let size = 0;
  if (opts.sourcePath) {
    await fs.promises.copyFile(opts.sourcePath, dest);
    size = (await fs.promises.stat(dest)).size;
  } else if (opts.base64) {
    const comma = opts.base64.indexOf(",");
    const b64 = comma >= 0 && opts.base64.startsWith("data:")
      ? opts.base64.slice(comma + 1)
      : opts.base64;
    const buf = Buffer.from(b64, "base64");
    await fs.promises.writeFile(dest, buf);
    size = buf.length;
  }

  const relPath = `${projectId}/${fileName}`;
  return {
    id,
    projectId,
    kind,
    name: originalName,
    relPath,
    mediaUrl: `media://${relPath}`,
    size,
    addedAt: new Date().toISOString(),
  };
}

function dialogFilters(accept: FileAccept | undefined): Electron.FileFilter[] {
  const images = { name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "avif", "svg"] };
  const videos = { name: "Videos", extensions: ["mp4", "mov", "webm", "mkv", "avi", "m4v"] };
  const pdf = { name: "PDF", extensions: ["pdf"] };
  const docs = { name: "Documents", extensions: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf"] };
  const all = { name: "All Files", extensions: ["*"] };
  switch (accept) {
    case "image": return [images, all];
    case "video": return [videos, all];
    case "media": return [{ name: "Photos & Videos", extensions: [...images.extensions, ...videos.extensions] }, all];
    case "pdf": return [pdf, all];
    case "doc": return [docs, all];
    default: return [{ name: "All Supported", extensions: [...images.extensions, ...videos.extensions, ...docs.extensions] }, all];
  }
}

// ------------------------------------------------------------
// IPC handlers
// ------------------------------------------------------------
function registerIpc() {
  ipcMain.handle("db:load", async (): Promise<DB> => loadDb());

  ipcMain.handle("db:save", async (_e, db: DB): Promise<void> => {
    saveDbSync(db);
  });

  ipcMain.handle("files:import", async (_e, args: ImportFileArgs): Promise<StoredFile> => {
    return importOne(args.projectId, args.kind, args.originalName, {
      sourcePath: args.sourcePath,
      base64: args.base64,
    });
  });

  ipcMain.handle("files:pickAndImport", async (_e, args: PickAndImportArgs): Promise<StoredFile[]> => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    const result = await dialog.showOpenDialog(win!, {
      title: "Select files to import",
      properties: ["openFile", "multiSelections"],
      filters: dialogFilters(args.accept),
    });
    if (result.canceled || result.filePaths.length === 0) return [];
    const out: StoredFile[] = [];
    for (const fp of result.filePaths) {
      const name = path.basename(fp);
      out.push(await importOne(args.projectId, kindFromExt(name), name, { sourcePath: fp }));
    }
    return out;
  });

  ipcMain.handle("files:reveal", async (_e, relPath: string): Promise<void> => {
    shell.showItemInFolder(path.join(mediaDir, relPath));
  });

  ipcMain.handle("files:delete", async (_e, relPath: string): Promise<void> => {
    try {
      await fs.promises.unlink(path.join(mediaDir, relPath));
    } catch {
      /* already gone — ignore */
    }
  });

  ipcMain.handle("files:exportInvoicePdf", async (_e, args: ExportInvoicePdfArgs): Promise<StoredFile | null> => {
    const pdfWin = new BrowserWindow({
      show: false,
      webPreferences: { offscreen: true },
    });
    try {
      await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(args.html)}`);
      const data = await pdfWin.webContents.printToPDF({
        printBackground: true,
        margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
        pageSize: "Letter",
      });
      const ext = ".pdf";
      const id = randomUUID();
      const dir = path.join(mediaDir, args.projectId);
      await fs.promises.mkdir(dir, { recursive: true });
      const fileName = `${id}${ext}`;
      const dest = path.join(dir, fileName);
      await fs.promises.writeFile(dest, data);
      const relPath = `${args.projectId}/${fileName}`;
      return {
        id,
        projectId: args.projectId,
        kind: "pdf",
        name: args.fileName.endsWith(".pdf") ? args.fileName : `${args.fileName}.pdf`,
        relPath,
        mediaUrl: `media://${relPath}`,
        size: data.length,
        addedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error("[pdf] export failed:", err);
      return null;
    } finally {
      pdfWin.destroy();
    }
  });

  // ---- Backup / restore (folder-based; dependency-free) ----
  ipcMain.handle("backup:export", async (): Promise<BackupResult> => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    const res = await dialog.showOpenDialog(win!, {
      title: "Choose a folder to save your FlipCRM backup",
      properties: ["openDirectory", "createDirectory"],
    });
    if (res.canceled || res.filePaths.length === 0) return { ok: false };
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const destRoot = path.join(res.filePaths[0], `FlipCRM-Backup-${stamp}`);
    try {
      await fs.promises.mkdir(destRoot, { recursive: true });
      if (fs.existsSync(dbFile)) {
        await fs.promises.copyFile(dbFile, path.join(destRoot, "flipcrm-db.json"));
      }
      if (fs.existsSync(mediaDir)) {
        await fs.promises.cp(mediaDir, path.join(destRoot, "media"), { recursive: true });
      }
      return { ok: true, path: destRoot };
    } catch (err) {
      return { ok: false, message: String(err) };
    }
  });

  ipcMain.handle("backup:import", async (): Promise<BackupResult> => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    const res = await dialog.showOpenDialog(win!, {
      title: "Select a FlipCRM backup folder to restore",
      properties: ["openDirectory"],
    });
    if (res.canceled || res.filePaths.length === 0) return { ok: false };
    const src = res.filePaths[0];
    const srcDb = path.join(src, "flipcrm-db.json");
    if (!fs.existsSync(srcDb)) {
      return { ok: false, message: "No flipcrm-db.json found in that folder." };
    }
    try {
      ensureDirs();
      await fs.promises.copyFile(srcDb, dbFile);
      const srcMedia = path.join(src, "media");
      if (fs.existsSync(srcMedia)) {
        await fs.promises.rm(mediaDir, { recursive: true, force: true });
        await fs.promises.cp(srcMedia, mediaDir, { recursive: true });
      }
      return { ok: true, path: src };
    } catch (err) {
      return { ok: false, message: String(err) };
    }
  });

  ipcMain.handle("backup:openDataFolder", async (): Promise<void> => {
    await shell.openPath(dataDir);
  });

  ipcMain.handle("app:getVersion", async (): Promise<string> => app.getVersion());
}

// ------------------------------------------------------------
// Window + app lifecycle
// ------------------------------------------------------------
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_DIST = path.join(__dirname, "../dist-web");

let mainWindow: BrowserWindow | null = null;

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template: Electron.MenuItemConstructorOptions[] = [
    { label: "File", submenu: [isMac ? { role: "close" } : { role: "quit" }] },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    title: "FlipCRM Desktop",
    backgroundColor: "#0f172a",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  // External links open in the user's browser, never inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

app.whenReady().then(() => {
  ensureDirs();
  registerMediaProtocol();
  registerIpc();
  buildMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
