# Security

## Release checks
- Every release file is scanned with **ClamAV** before it is published. The scan log is stored in `docs/security/`.
- SHA-256 checksums are published on the website and in every release.
- If a `VT_API_KEY` secret is configured, the release workflow also uploads the files to **VirusTotal** and links the reports.

## What the Windows app does
- Shows the UI in a Microsoft Edge WebView2 window. App files are extracted to `%LOCALAPPDATA%\VertexForge Studio\app`.
- Stores projects in WebView2 storage under `%LOCALAPPDATA%\VertexForge Studio\WebView2`.
- Opens linked files with their default program (ShellExecute) and can show them in Explorer.
- Reads program icons via the Windows API to display them.
- Starts **no scripts or command shells**, makes **no network requests** and collects **no telemetry**.

## What the installer does
- Copies the app to `Program Files\VertexForge Studio`, creates Start menu and desktop shortcuts and an “Apps & features” entry.
- The uninstaller removes these; your projects are only deleted if you explicitly choose so.

## Reporting a vulnerability
Please open a GitHub issue (or a private security advisory on GitHub) describing the problem. Do not post exploit details publicly before a fix is available.
