# EmulatorJS + Firebase — Setup Guide

A self-hosted, static retro-game site using [EmulatorJS](https://emulatorjs.org/)
and Firebase Hosting. This repo contains the site code, config, and helper
scripts — no ROMs, BIOS files, or EmulatorJS core binaries are included (see
[Legal note](#legal-note) below for why).

## 1. Get the files

Fork this repo on GitHub, then clone your fork:

```powershell
git clone https://github.com/<your-username>/<your-fork-name>.git
cd <your-fork-name>
```

(Or just download/copy these files into a new empty folder of your own —
you don't strictly need to fork if you're starting your own repo from
scratch.)

## 2. Install prerequisites

- **Node.js** — from [nodejs.org](https://nodejs.org) if you don't have it:
  ```powershell
  node -v
  ```
- **Firebase CLI**:
  ```powershell
  npm install -g firebase-tools
  firebase --version
  firebase login
  ```

## 3. Create your own Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) →
   **Add project** → follow the prompts (Google Analytics is optional, not
   needed for this).
2. Once created, note your **Project ID** (shown on the project overview
   page, e.g. `my-retro-site-a1b2c`).
3. Point this repo at your project:
   ```powershell
   firebase use --add
   ```
   Select your project when prompted, and give it the alias `default`. This
   writes (or updates) `.firebaserc` with your project ID.

## 4. Download the EmulatorJS runtime + cores

Cores aren't committed to the repo (they're large, and easy to re-fetch).
Pull them with the included script:

```powershell
powershell -ExecutionPolicy Bypass -File .\get-cores.ps1
```

This fills `public/emulatorjs/data/` with the loader, runtime, and core
`.data` files for every system the project supports. Edit the `$cores`
array in that script first if you only want a subset.

## 5. Add your own ROMs

Put ROM files in `public/roms/`, organized by system — most are detected
automatically by file extension; a few disc-based systems (PSX, Sega CD,
Saturn, 3DO, Atari 2600/5200) need their own subfolder because their
extensions are ambiguous. See the comments at the top of `Generategames.js`
for the exact folder names and supported extensions.

**You're responsible for only using ROMs/BIOS files you have the legal
right to use** — see [Legal note](#legal-note) below.

Then generate the game list:

```powershell
node Generategames.js
```

This writes `public/games.json`. Re-run it any time your ROM collection
changes — it'll also print a list of any files it didn't recognize.

## 6. Test locally

```powershell
firebase emulators:start --only hosting
```

Open the printed URL (usually `http://localhost:5000`), pick a game, and
confirm it boots.

## 7. Deploy

```powershell
firebase deploy
```

Your site will be live at `https://<your-project-id>.web.app`.

---

## Legal note

- **ROMs and BIOS files are not included** in this repo, and shouldn't be
  added to it (check `.gitignore` — `public/roms/` and `public/bios/` are
  already excluded). These are copyrighted; only use dumps of games/hardware
  you personally own.
- **If you deploy this publicly** (a plain `firebase deploy`, reachable by
  anyone with the URL), don't include copyrighted ROM/BIOS files in
  `public/` at all — anything in that folder becomes publicly downloadable
  the moment it's deployed, regardless of whether it's committed to git.
- If you want your own copy of the site to include your ROM library and
  still be privately accessible only to you, you'll need some form of
  access control (Firebase Authentication gating the deploy, or simply
  running it locally via `firebase emulators:start` instead of deploying).
- The EmulatorJS runtime and cores themselves (downloaded by
  `get-cores.ps1`) are open-source and fine to self-host publicly.

## Known quirks

- A small number of cores occasionally don't auto-boot the selected game and
  instead land on the core's own menu — this is a known upstream EmulatorJS
  behavior (`EJS_startOnLoaded` isn't 100% reliable across all cores/
  browsers), not a bug in this project's code. If it happens, manually
  selecting "Load Content" in that menu and picking the file works fine.
- Some systems (NDS, PSX) may need real BIOS files for full compatibility,
  though EmulatorJS's melonDS core has worked without one in testing here.
