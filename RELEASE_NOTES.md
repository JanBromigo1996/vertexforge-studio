## VertexForge Studio 2.8.1

An important update – especially for Linux.

- **Linux: dialogs and saving work again.** In 2.8.0 the Linux app only got answers from the system when the
  WebKit developer package happened to be installed. On normal systems "Save as", "Open", linking files, team
  folders and the language detection silently did nothing. Found by installing the .deb on clean Ubuntu 22.04,
  Ubuntu 24.04 and Fedora 41, and fixed. **If you use Linux, please update.**
- **Startup can no longer hang** on a slow system query; the macOS and Linux apps write a short start log
  (`vertexforge.log`) that helps with bug reports.
- **Much lighter when idle:** overdue badges and the team badge pulsed forever. Under an open dialog this kept the
  window redrawing all the time – on computers without graphics acceleration it used more than one full CPU core.
  They now pulse three times and rest. Idle CPU: from about 150 % to 0 % in our test.
- **macOS:** the window now fits small screens (e.g. 13-inch MacBook Neo with large text); quitting via the Dock or
  the menu bar first lets the app save, like the close button.
- **Tested on real systems:** macOS 26 on Apple Silicon (install from the DMG, start, quit), Ubuntu 22.04,
  Ubuntu 24.04 and Fedora 41 (install, start). Mac first-start steps updated for macOS 15 and 26.

---

## VertexForge Studio 2.8.0

### Now on macOS and Linux
- **macOS 11+** (Apple Silicon and Intel in one download): native app with the Mac menu bar, ⌘ shortcuts,
  full-screen and system dialogs. Not notarised by Apple (that needs a paid account), so the first start is
  right-click ▸ Open. Built publicly by GitHub Actions from this repository.
- **Linux** (x86_64): `.deb` for Ubuntu/Debian/Mint and `.tar.gz` with `install.sh` for other distributions.
  Needs WebKitGTK 4.1.
- Same features as on Windows: native file dialogs, team folders, linked files with previews, UI zoom,
  saving before the window closes. Shortcut labels show ⌘ ⌥ ⇧ on a Mac.
- Both are brand new and less tested than the Windows app – bug reports are very welcome.

### Fixed: "WebView2 Runtime not found" although it is installed (Windows)
- The bundled `WebView2Loader.dll` (from 2021) is replaced by the current Microsoft-signed version.
- If the loader still fails, the app now falls back to the installed runtime directly.
- If starting really fails, the message shows the exact reason, the runtime version and where the log is,
  instead of wrongly claiming the runtime is missing.

### Smoother to work with
- Fast tooltips with keyboard-shortcut chips instead of slow browser tooltips.
- Dialogs, panels and menus fade out instead of vanishing; content slides in when you open an area;
  ticking off a task gives a small check animation.
- Much faster with long lists: hundreds of tasks or shots only render what is visible (pipeline about 5×
  faster with 400 tasks); large mind boards open faster.

**ClamAV:** all 9 files clean (`clamscan.txt`).
**VirusTotal (2.8.0):** macOS .dmg and both Linux files: 0 detections. Windows: 3 of about 70 –
**Bkav Pro** `W32.Malware.8FBF5AC8` (generic), **Trapmine** `Malicious.moderate.ml.score` (as in every version since
2.3.1) and **CrowdStrike Falcon** `Win/malicious_confidence_60% (D)` (machine-learning guess, back for the first time
since 2.3.1, possibly because of the new WebView2 start code). None names a real virus; reported as false positives.

---

## VertexForge Studio 2.7.0

### Project library that looks like the real thing
- **Books:** bound books with a leather spine (raised bands, gold title), linen-textured cover and page block.
- **DVD shelf:** real cases with black plastic, clear sleeve, hinge and the title on the spine.
- **Poster wall:** printed posters with fold lines, gentle waves, torn-edge tape and a lifted corner.
- **Gallery:** moulded frames, bevel-cut mats, glass reflections and brass picture lights.
- Hover a book or DVD and it turns towards you.

### Mind board
- New surfaces: wooden desk, walnut workbench, felt game table, concrete; new note styles: polaroid and kraft paper.
- New presets: Desk, Workshop, Game table, Studio wall (10 presets, 88 combinations).

### Collectible cards with more care
- Rarity grows with progress (★ to ★★★★): silver foil from three stars, holographic foil for finished assets.
- Light and foil follow the mouse; cards lift slightly when flipped. Software badges from linked files,
  artist credit, ornate frame and a designed back side.

### Fixes
- **Borderless fullscreen (F11)** now really covers the whole screen, also from a maximised window; title and
  status bar slide in when the mouse touches the screen edge.
- Team folders: edits made while a sync is running are kept; a version overwritten at the very same moment by
  someone else is saved to `conflicts/` instead of disappearing.
- Clicking a card's progress bars no longer hits the hidden back side.

**VirusTotal (2.7.0):** 2 of about 70 engines – **Bkav Pro** `W32.Malware.D919540` (generic) and **Trapmine**
`Malicious.moderate.ml.score` (machine-learning guess), the same two as in every version since 2.3.1. All large vendors
(Microsoft, Kaspersky, Bitdefender, ESET, CrowdStrike, …) report it clean.

---

## VertexForge Studio 2.6.0

### New: team folders – work together without a server
- **File ▸ Share in a team folder…** puts the project into a folder your team already syncs
  (OneDrive, Dropbox, Google Drive, Nextcloud or a network drive). Others use **File ▸ Open team project…**.
- Every task, card, shot and chapter is its own small file. Changes to different things are merged automatically
  every few seconds; if two people change the same thing at once, your version wins and the other is kept in `conflicts/`.
- The **Team** badge next to the project name shows the sync status and who is working right now.
- Works offline – syncs again when the folder is reachable. Windows app, Chrome and Edge on a computer.
- Still no server, no account, no internet connection from VertexForge itself; your cloud service does the syncing.

### Shot list
- Click a shot image to see it large; replace or remove it there (←/→ for the next shot). Drop images onto a shot.

---

## VertexForge Studio 2.5.0

### New
- **Collectible cards** on the mind board for characters, creatures, props, vehicles and environments: image,
  role, progress per discipline (model, sculpt, texture, rig, animation – click a bar to set it), facts on the back.
  Click ↻ to flip the card. Drop an image on a card to use it.
- **Deck:** all cards of a project at a glance, filter by type, flip them, jump to a card on its board.
- **Quick search (Ctrl+K or the magnifier):** finds projects, tasks, board elements, cards, shots, chapters and commands.
- **Delete with undo:** boards, phases, shots, scenes and lore entries are deleted right away with an “Undo” button
  instead of a confirmation dialog. Projects still ask first.
- **Touch:** move kanban tasks with your finger (hold, then drag).

### Tidier interface
- Cover and title size moved from the library header into “View”, next to the library style.
- Images and videos share one “Images & videos” button on the board.
- Compact design buttons in pipeline and shot list; tabs show labels only for the active area on smaller screens.

---

## VertexForge Studio 2.4.0

### New: designs for every area – only the look changes, never the features
- **Project library:** Studio, DVD shelf, poster wall (taped film posters), leather-bound books, gallery frames
- **Pipeline & shot list:** Studio, notebook, blueprint, production folder, cinema – chosen per project
- Mind board (6 presets / 42 combinations) and story papers as before

### New: tablet & phone
- Touchscreens are detected automatically: larger buttons, handles and menus, project actions behind one ⋯ tap,
  two-finger zoom on the mind board, board tools stay visible on tablets

Install over 2.3.x – projects, versions and settings are kept.

---

## VertexForge Studio 2.3.1

**Bug fix:** after installing 2.3.0 the program did not start from the desktop/Start menu shortcut.
- Shortcuts are now created with the official Windows shell interface (IShellLink) instead of a hand-written file.
- More robust start: working folder set to the program folder, network drives no longer slow down the start,
  and any start error is shown in a message and written to `%LOCALAPPDATA%\VertexForge Studio\vertexforge.log`.

If you installed 2.3.0: just run the new setup over it. Your projects stay untouched.

**VirusTotal (2.3.1):** 2 of about 70 engines – **Bkav Pro** `W32.Malware.B4D2B4A6` (generic) and **Trapmine**
`Malicious.moderate.ml.score` (machine-learning guess). All large vendors (Microsoft, Kaspersky, Bitdefender, ESET,
CrowdStrike, …) report it clean. Both detections are reported as false positives.

---

## VertexForge Studio 2.3.0

A free, open-source planning tool for 3D artists: pipeline, deadlines, mind board, shot list and story in one place.

> **Made with Claude.** The code was written with Claude, an AI assistant, guided by Jan, a hobby 3D artist.
> It can contain bugs – please [report them](https://github.com/JanBromigo1996/vertexforge-studio/issues/new/choose).
> The tool itself contains no AI and never creates art.

### Downloads
| File | What it is |
|---|---|
| `VertexForge-Studio-Setup.exe` | Windows 10/11 installer (recommended) |
| `VertexForge-Studio-Portable.zip` | Windows, no installation – keep `WebView2Loader.dll` next to the exe |
| `VertexForge-Studio-Browser.html` | Single file for any browser (macOS, Linux). Loads its fonts from Google Fonts when online. |
| `SHA256SUMS.txt`, `clamscan.txt` | Checksums and the full ClamAV log |

### What's new
- Mind board: link images, videos and files; several wires per node; images undock when dragged away
- Six board styles (studio, pinboard, sketchbook, blueprint, chalkboard, glass) and five story papers – per board / per project
- Fullscreen for board and story (Esc to leave), shot list reordering by drag & drop, multiple saved versions
- Installer wizard in six languages, title bar integrated into the design, refreshed light mode, guided tour

### Security & transparency – no secrets
- **ClamAV:** 0 detections for every file (log attached).
- **Not code-signed** (certificates cost money), so Windows SmartScreen may warn: *More info → Run anyway*.
- **Antivirus history:** a first, unpublished test build was flagged by a few machine-learning engines on VirusTotal
  (Microsoft `Program:Win32/Wacapew.C!ml`, Elastic *moderate confidence*, CrowdStrike *confidence 60 %*,
  Huorong `HEUR:Trojan/FakeMsApp.a`, Bkav generic). No engine found known malware.
  **Cause:** the window library hid Microsoft's `WebView2Loader.dll` inside the program and loaded it from memory –
  a technique malware also uses. **Fix:** the DLL is now a normal Microsoft-signed file next to the program; the setup
  unpacks a compressed package, uses a separate uninstaller and no longer copies itself.
- **2.3.0 on VirusTotal:** all large vendors (Microsoft, Kaspersky, Bitdefender, ESET, CrowdStrike, …) report it clean.
  Two smaller engines still raise generic guesses: **Bkav Pro** `W32.Malware.69DD7DC0` and **Trapmine**
  `Malicious.moderate.ml.score`. Neither names a real virus; both were reported as false positives.
- **Live results of these exact files** on VirusTotal are linked on the [website](https://vertexforge.pages.dev/#security)
  and, if the automated scan is enabled, appended below. Any remaining detection is reported to the vendor as a false
  positive and tracked in [issues labelled `false-positive`](https://github.com/JanBromigo1996/vertexforge-studio/issues?q=label%3Afalse-positive).
- **On your PC:** `Program Files\VertexForge Studio` (3 files), optional shortcuts, an Apps entry; your data in
  `%LOCALAPPDATA%\VertexForge Studio`. The app makes **no internet connections** – no telemetry, no update check.
