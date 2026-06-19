# FlipCRM Desktop

A **standalone, offline Windows desktop CRM** for a real-estate fix-&-flip / rehab
business. No login, no cloud, no accounts, no server — it opens straight to the
dashboard and stores **all data locally** on the machine it's installed on.

- 🖥️ One real `.exe` (NSIS installer), installs side-by-side as **FlipCRM Desktop**
- 🔒 No authentication, no Supabase, no internet required
- 💾 Local JSON database + a real media folder (photos / videos / PDFs / receipts
  are saved as **actual files on disk**, never as base64 in the database)
- 👤 Single user

## Tech stack

Electron + electron-builder · Vite + React 19 + TypeScript · Tailwind CSS v4 ·
react-router-dom (hash router) · lucide-react · recharts · date-fns · uuid.

## Get started (two commands, that's it)

```bash
npm install      # one-time setup
npm run dev      # work on it — opens the desktop window with hot reload
```

```bash
npm run build    # produces dist/FlipCRM-Desktop-Setup-<version>.exe
```

`npm run dev` runs Vite and launches Electron together (via `vite-plugin-electron`)
pointed at the dev server, so the window hot-reloads as you edit `src/`.
`npm run build` type-checks, bundles the renderer + Electron, and runs
electron-builder to produce the Windows installer in `dist/`.

> **Building the `.exe`:** electron-builder produces the Windows installer when run
> **on Windows**. If you're not on Windows, push a `v*` tag (or run the **Build
> Desktop App** workflow in the Actions tab) and GitHub Actions builds the
> installer for you on a Windows runner and attaches it to a Release.

## Where your data lives

Everything is stored in Electron's per-user `userData` directory:

```
%APPDATA%\FlipCRM Desktop\
├── flipcrm-db.json        ← the database (atomic writes; debounced ~400ms)
└── media\<projectId>\…     ← real photos, videos, PDFs, receipts, renders
```

Open it any time from **Admin & Settings → Open data folder**. Photos/videos/PDFs
render in-app through a custom `media://` protocol that maps to these files.
**Settings** also has **Export backup** / **Import backup** (a portable copy of the
db + media folder) and **Reset to sample data**.

## What's inside

- **Dashboard** — stat cards, the Communications Hub (headline feature), and
  active project cards with over-budget alerts.
- **Projects** — nested folders (drag projects between them, recolor, rename),
  and a full project detail screen with two main folders:
  - *Renovation & Reconstruction*: Active Work Orders · Tasks (list + kanban,
    microtask checklists, multi-contractor assignment, one-click **Generate
    standard work orders** from templates) · Communications · Contractors ·
    Photos & Videos · 3D Renders
  - *Project Information*: Vital Information · Expenses · Documents · Photos & Videos
- **Communications Hub** — one place to message every contractor on active &
  scheduled work; unread threads float to the top, then active before scheduled,
  then priority, then date. Filter by project, log calls/notes/SMS.
- **Expenses** — clickable expandable rows: assign a payee (who got paid), add
  free-form notes for context, and attach receipts.
- **Contractors** — directory with trades, ratings, per-contractor projects, and
  a message log.
- **Admin & Settings** — company profile and local data management.

## Project structure

```
flipcrm-desktop/
├── electron/
│   ├── main.ts          # window, media:// protocol, IPC (db / files / backup)
│   └── preload.ts       # exposes the typed window.api bridge
├── src/                 # React renderer
│   ├── main.tsx, App.tsx
│   ├── components/       # ui primitives, layout, project, contractor
│   ├── pages/
│   ├── lib/              # types, store, seed, catalogs, utils
│   └── styles/globals.css
├── index.html
├── vite.config.ts
├── electron-builder.yml
└── package.json
```

## Notes on a few decisions

- **JSON database** (not SQLite) — simplest and dependency-free for a single user;
  the renderer keeps only file *metadata*, never blobs.
- **`vite-plugin-electron`** gives the one-command `dev` / `build` workflow from a
  single `vite.config.ts`.
- **Backups are folder-based** (a copy of `flipcrm-db.json` + `media/`) so there are
  no extra dependencies and the backup is easy to drop on a USB drive.
- **Task pricing lives in one file** — `src/lib/task-pricing.ts`. Only flooring is
  square-foot priced ($4.50/sq ft, driven by each project's square footage);
  everything else is a flat/manual amount. Change the rate or add a square-foot
  category there and nothing else needs editing.
- If you ever open the renderer in a plain browser (e.g. `vite preview`), it falls
  back to `localStorage`; file features are desktop-only.
