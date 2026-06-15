// Copies the Next.js standalone build output (from the `site` submodule)
// into desktop-mac/next-app so electron-builder can package it with the .exe.
const fs = require("fs");
const path = require("path");

// The Next.js website now lives in the `site/` git submodule at repo root.
const siteRoot = path.resolve(__dirname, "..", "site");
const srcStandalone = path.join(siteRoot, ".next", "standalone");
const srcStatic = path.join(siteRoot, ".next", "static");
const srcPublic = path.join(siteRoot, "public");
const dest = path.join(__dirname, "next-app");
const destStatic = path.join(dest, ".next", "static");
const destPublic = path.join(dest, "public");

function rimraf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyRecursive(src, out) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(out, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(out, entry.name);
    if (entry.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log("[copy-standalone] cleaning desktop-mac/next-app");
rimraf(dest);

if (!fs.existsSync(srcStandalone)) {
  console.error("[copy-standalone] site/.next/standalone not found.");
  console.error("[copy-standalone] Did the submodule build run? Try: cd ../site && DESKTOP_BUILD=true next build");
  process.exit(1);
}

console.log("[copy-standalone] copying standalone server");
copyRecursive(srcStandalone, dest);

console.log("[copy-standalone] copying .next/static");
copyRecursive(srcStatic, destStatic);

if (fs.existsSync(srcPublic)) {
  console.log("[copy-standalone] copying public/");
  copyRecursive(srcPublic, destPublic);
}

console.log("[copy-standalone] done");
