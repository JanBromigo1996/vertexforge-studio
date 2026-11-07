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
- **Results of this exact release** on VirusTotal are linked on the [website](https://janbromigo1996.github.io/vertexforge-studio/#security)
  and, if the automated scan is enabled, appended below. Any remaining detection is reported to the vendor as a false
  positive and tracked in [issues labelled `false-positive`](https://github.com/JanBromigo1996/vertexforge-studio/issues?q=label%3Afalse-positive).
- **On your PC:** `Program Files\VertexForge Studio` (3 files), optional shortcuts, an Apps entry; your data in
  `%LOCALAPPDATA%\VertexForge Studio`. The app makes **no internet connections** – no telemetry, no update check.
