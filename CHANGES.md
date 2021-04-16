# CHANGES for sundriven

## 0.7.0 (UNRELEASED)

### User-impacing

- Enhancement: Change existing `index.html` to `index-dev.html` but make new
  `index.html` using bundled version
- Fix: Avoid prematurely expiring recurring daily timers triggering flood of
  notifications
- Fix: `solarNoon` when time is somehow negative for now
- Docs (README): Update to working demo
- Docs (Code): Document
- Refactoring: - Set locale dynamically, separation of concerns

## 0.6.1

### User-impacting

- Fix: Per <https://blog.mozilla.org/futurereleases/2019/11/04/restricting-notification-permission-prompts-in-firefox/>,
  Firefox disallowing notification request unless in user action, so add
  button to request (hidden if already permitted)
- Maintenance: Add `.editorconfig`
- Docs (README): Update to working demo

### Dev-impacting

## 0.6.0

### User-impacting

- Enhancement: Replace suncalc with MeeusSunMoon
- Deployment: Reference and build/transfer local copies for sake of GH Pages
- Change: Suppress favicon requests
- npm: Update deps. jamilih (minor) and meeussunmoon (major)
- npm: Drop moment/moment-timezone in favor of current msm-supported luxon

### Dev-impacting

- Refactoring: ES6 Modules, ES features
- Linting: Apply ash-nazg, including indent to 2 sp.
- Linting: Use recommended extension for RC file
- Linting: Drop remarkrc
- pnpm: Switch to pnpm
- npm: Switch to maintained `open-cli` and `@brettz9/node-static`
- npm: Update devDeps.

## 0.5.0
- Remove apparently problematic localforage

## 0.3.0
- Add solar noon and nadir events
- Sort astronomical events

## 0.2.3
- Fix now event bug

## 0.2.2
- Better mobile display
- Fix daily time

## 0.2.1
- Better mobile display

## 0.2.0
- Allow manual latitude/longitude

## 0.1.0
- Initial version
