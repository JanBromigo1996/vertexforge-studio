# Contributing to VertexForge Studio

Thank you for helping! This project was written with an AI assistant (Claude), so careful human review is very valuable.

## Reporting bugs
Open an issue and include: what you did, what you expected, what happened, your OS and whether you use the desktop app or the browser version. Screenshots help.

## Changing code
1. Fork the repository and create a branch.
2. Build the app (see README) and test your change in the browser version **and**, if it touches `main.go`, `installer/` or `winutil/`, on Windows.
3. Keep changes small and focused. Describe what you changed and how you tested it in the pull request.

## Ground rules
- **Never break saved projects.** Data changes must be migrated in `normalizeSuite()` / `normalizeProject()` (`src/core.js`) so older projects load without loss.
- **No generative AI features** that create art, text or media for the user. VertexForge is a planning and organisation tool.
- **No telemetry, no tracking, no network calls** besides loading fonts in the browser version.
- **No script or shell spawning** (PowerShell, cmd, …) in the Windows code – use Windows API calls.
- New UI text needs entries for all languages in `src/i18n.js` (English is the fallback).

## Good first tasks
- A native macOS wrapper (e.g. WKWebView) for the existing single-file app
- More languages
- Accessibility improvements (keyboard navigation, screen reader labels)

## Release checklist (maintainers)
1. Bump the version in `src/core.js` (`APP_VERSION`), `main.go`, `installer/main.go` and both `winres.json` files.
2. Copy the new `dist/vertexforge_studio.html` to `docs/app/index.html` (the “Open in browser” version on the website).
3. Push a tag like `v2.3.1` – the release workflow builds, scans and publishes everything.
4. Update the version, sizes and checksums on `docs/index.html` (and `site/site.html`).
