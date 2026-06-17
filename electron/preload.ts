import { contextBridge, ipcRenderer } from "electron";
import type {
  FlipApi,
  DB,
  ImportFileArgs,
  PickAndImportArgs,
  ExportInvoicePdfArgs,
} from "../src/lib/types";

// The single, typed bridge the renderer uses to talk to the OS / disk.
const api: FlipApi = {
  db: {
    load: () => ipcRenderer.invoke("db:load"),
    save: (db: DB) => ipcRenderer.invoke("db:save", db),
  },
  files: {
    import: (args: ImportFileArgs) => ipcRenderer.invoke("files:import", args),
    pickAndImport: (args: PickAndImportArgs) =>
      ipcRenderer.invoke("files:pickAndImport", args),
    reveal: (relPath: string) => ipcRenderer.invoke("files:reveal", relPath),
    delete: (relPath: string) => ipcRenderer.invoke("files:delete", relPath),
    exportInvoicePdf: (args: ExportInvoicePdfArgs) =>
      ipcRenderer.invoke("files:exportInvoicePdf", args),
  },
  backup: {
    export: () => ipcRenderer.invoke("backup:export"),
    import: () => ipcRenderer.invoke("backup:import"),
    openDataFolder: () => ipcRenderer.invoke("backup:openDataFolder"),
  },
  app: {
    getVersion: () => ipcRenderer.invoke("app:getVersion"),
    isDesktop: true,
  },
};

contextBridge.exposeInMainWorld("api", api);
