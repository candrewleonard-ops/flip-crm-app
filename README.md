# FlipCRM — Desktop App

Standalone repository for the **FlipCRM** desktop application (Windows `.exe` and macOS `.dmg`/`.zip`).
This is the Electron wrapper around the Reinnovation Homes / FlipCRM Next.js web app.

The website itself lives in its own repository (**Projectmanagement**) and continues to deploy to
Cloudflare independently. This repo only builds the *desktop* version, pulling the website source in
as a git submodule so the two stay cleanly separated.

## Structure

```
flip-crm-app/
├── site/            ← git submodule → candrewleonard-ops/Projectmanagement (the Next.js website)
├── desktop/         ← Electron wrapper for Windows (builds FlipCRM-Setup-*.exe)
├── desktop-mac/     ← Electron wrapper for macOS (builds .dmg / .zip)
└── .github/workflows/build-desktop.yml  ← CI that builds installers on a version tag
```

## First-time setup (after cloning)

The website source is a submodule, so clone with `--recurse-submodules`, or initialize it after cloning:

```bash
git clone --recurse-submodules https://github.com/candrewleonard-ops/flip-crm-app.git
# or, if already cloned:
git submodule update --init --recursive
```

## Building locally

### Windows
```bash
cd desktop
npm install
cd ../site && npm install && cd ..
npm --prefix desktop run build:exe   # builds desktop/dist/FlipCRM-Setup-<version>.exe
```

### macOS
```bash
cd desktop-mac
npm install
cd ../site && npm install && cd ..
npm --prefix desktop-mac run build:dmg   # builds desktop-mac/dist/*.dmg + *.zip
```

## Building via GitHub Actions (recommended)

Push a version tag and CI builds Windows + macOS installers and attaches them to a GitHub Release:

```bash
git tag v0.1.1
git push origin v0.1.1
```

You can also trigger it manually from the **Actions** tab → **Build Desktop Apps** → **Run workflow**.

## Updating to the latest website version

The desktop app builds against whatever commit the `site` submodule is pinned to. To pull in the
latest website changes:

```bash
cd site
git pull origin main
cd ..
git add site
git commit -m "Update site submodule to latest"
git push
```

The website repository (Projectmanagement) and its Cloudflare deployment are never affected by this repo.
