# Security

## Release checks
- Every release file is scanned with **ClamAV** before it is published. The scan log is stored in `docs/security/`.
- SHA-256 checksums are published on the website and in every release.
- If a `VT_API_KEY` secret is configured, the release workflow also uploads the files to **VirusTotal** and links the reports.

## What the Windows app does
- Shows the UI in a Microsoft Edge WebView2 window. Microsoft's `WebView2Loader.dll` (Authenticode-signed by Microsoft, unchanged
  from the WebView2 SDK) lies as a normal file next to the program and is loaded the ordinary way. Nothing is loaded from memory. App files are extracted to `%LOCALAPPDATA%\VertexForge Studio\app`.
- Stores projects in WebView2 storage under `%LOCALAPPDATA%\VertexForge Studio\WebView2`.
- Opens linked files with their default program (ShellExecute) and can show them in Explorer.
- Reads program icons via the Windows API to display them.
- Starts **no scripts or command shells**, makes **no network requests** and collects **no telemetry**.

## What the installer does
- Needs administrator rights only to write to `Program Files` and the uninstall entry. The app itself runs as a normal user.
- Unpacks a compressed package (app, separate uninstaller, `WebView2Loader.dll`) to `Program Files\VertexForge Studio`,
  creates Start menu and desktop shortcuts and an “Apps” entry (`HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\VertexForgeStudio`).
- For its own window the setup unpacks `WebView2Loader.dll` to `%TEMP%\VertexForgeSetup`, where it also writes `setup.log`.
- The uninstaller removes these; your projects are only deleted if you explicitly choose so.

## Antivirus results
All results are published, including false alarms – on the website, in the release notes and in issues labelled
`false-positive`. A first, unpublished test build of 2.3.0 was flagged by machine-learning engines (Microsoft
`Wacapew.C!ml`, Elastic, CrowdStrike 60 %, Huorong `FakeMsApp`, Bkav). The cause was the in-memory loading of
`WebView2Loader.dll` by the window library plus an uncompressed embedded program in the setup; both were removed
(see `third_party/go-webview2/webviewloader/module.go` and `installer/`).

## Reporting a vulnerability
Please use a **private security advisory** on GitHub (Security → Report a vulnerability) or, for minor issues, a normal issue. Do not post exploit details publicly before a fix is available.
