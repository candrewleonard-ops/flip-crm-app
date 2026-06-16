# FlipCRM Desktop — Standalone App

A **self-contained, private desktop CRM** (Windows `.exe`). Everything it needs lives in this one
repository — there is **no website link, no git submodule, no sign-in, and no Supabase**. The app
opens straight to the dashboard and stores all data **locally** on the machine.

> This used to be a thin Electron wrapper that pulled the website's code from the `Projectmanagement`
> repo. It is now fully decoupled: the app code lives here in `app/` and evolves independently of the
> website. Changes here never touch the website, and vice-versa.

## Structure

```
flip-crm-app/
├── app/        ← the Next.js CRM (local data only — no login, no Supabase)
├── desktop/    ← Electron wrapper that packages app/ into FlipCRM-Desktop-Setup-*.exe
├── package.json ← one-command setup / dev / build
└── .github/workflows/build-desktop.yml  ← CI that builds the .exe on a version tag
```

## First-time setup

```bash
git clone https://github.com/candrewleonard-ops/flip-crm-app.git
cd flip-crm-app
npm run setup        # installs app/ and desktop/ dependencies
```

## Daily development — one command

```bash
npm run dev
```

This starts the app and opens it in a desktop window automatically (it waits for the app to be ready
first). Edit anything under `app/`, save, and the window hot-reloads. No login, no second terminal.

## Build the installer — one command

```bash
npm run build        # produces desktop/dist/FlipCRM-Desktop-Setup-<version>.exe
```

Run that `.exe` to install **FlipCRM Desktop**. It installs side-by-side and does **not** replace any
other app you may have. Because there's no login, it opens straight to the dashboard.

## Build via GitHub Actions (optional)

Push a version tag and CI builds the Windows installer and attaches it to a GitHub Release:

```bash
git tag v0.1.1
git push origin v0.1.1
```

Or trigger it manually: **Actions** tab → **Build Desktop App** → **Run workflow**.

## Data

All data is stored locally (in the app's own storage) and seeded with sample projects so the app is
usable immediately. A real local database can be added later without changing any screens — every read
and write already goes through a single store (`app/src/lib/store.tsx`).
