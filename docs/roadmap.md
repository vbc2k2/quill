# Roadmap

Phased plan from prototype to v0.1 release. Phases are sequential — Phase 1 should happen before Phase 2, etc.

## Phase 0 — Validate (done ✓)

- ✓ Minimal ink latency test on iPad
- ✓ Full feature prototype: folders, multi-note, pens, highlighter, eraser, lasso, shapes, ruler, text, image, table
- ✓ v2 prototype: smooth ink, sliders, custom colors, page templates, zoom, hand tool, delete page
- ✓ Bug fix v2.1: rAF batching to eliminate stroke gaps, made page-template button visible
- ✓ Sync demo using Y.js + y-websocket + y-webrtc fallback
- ✓ Self-hostable server runnable on Windows / Linux / Raspberry Pi

## Phase 1 — Web app MVP

Goal: take the prototype patterns and put them on a real foundation so we can iterate without the single-HTML-file ceiling.

- [ ] Decide stack: React or Svelte (both viable)
- [ ] Decide rich text editor: Tiptap or Lexical
- [ ] Project scaffolding: Vite + TypeScript + chosen framework
- [ ] Migrate state model into a proper store
- [ ] Swap inline outline algorithm for [perfect-freehand](https://github.com/steveruizok/perfect-freehand)
- [ ] Production palm rejection — handle Apple Pencil hover (M2 iPad Pro), Scribble, double-tap gesture
- [ ] Service Worker + Web App Manifest for PWA install on iPad
- [ ] IndexedDB persistence via `y-indexeddb` (replace `localStorage`)
- [ ] Document format spec — write down the schema for `Y.Doc → folders / notes / pages / elements`
- [ ] Tests: at minimum, snapshot tests for stroke rendering and CRDT merge

## Phase 2 — Production sync

Goal: move from prototype-grade sync to something a user can trust with real notes.

- [ ] Self-hostable y-websocket-server (already done; this phase hardens it)
- [ ] Persistence: LevelDB-backed durable store
- [ ] Authentication: room invites + JWT or magic-link login
- [ ] TLS: Caddy / Nginx in front, Let's Encrypt
- [ ] Health and metrics endpoint
- [ ] Docker image and `docker-compose.yml`
- [ ] Optional: hosted "Quill Sync" backend as a paid SaaS for users who don't want to self-host

## Phase 3 — Desktop apps (Tauri)

Goal: real native apps on Windows, Linux, Mac.

- [ ] Tauri 2 project scaffolding
- [ ] Wrap the web app — Windows `.exe` installer
- [ ] Linux build (AppImage, deb)
- [ ] Native menu bar, system tray, file system bridge for import/export
- [ ] Native window state persistence (size, position, multi-monitor)
- [ ] Auto-updater (Tauri has one built in)
- [ ] Mac build — **deferred until Mac access is available** (Tauri Mac builds need a Mac for signing)

## Phase 4 — Polish and release

Goal: open-source-ready v0.1.

- [ ] Handwriting OCR for search — Tesseract.js (client-side) or a small server-side ML pipeline
- [ ] Export to PDF / SVG
- [ ] Import from existing notes apps (Notability JSON, GoodNotes 6 backup, Apple Notes)
- [ ] Templated pages (academic notebook, cornell, dot grid sizes, etc.)
- [ ] Layers (foreground / background ink, lock/hide per layer)
- [ ] Self-hosting docs + Docker compose for one-command server setup
- [ ] Public website / landing page
- [ ] Open-source release on GitHub with a contributing guide
- [ ] License decision: MIT or AGPL-3.0

## Non-goals (intentional)

These are commonly seen in notes apps but **not** on this roadmap:

- **Real-time multi-user collaboration with other people.** Single user, multi-device only. Adding multi-user changes the auth model significantly and dilutes focus.
- **Cloud-only mode.** Every feature works offline; sync is additive.
- **AI assistance (summarization, search-by-meaning, etc.).** Maybe v2.0+. Not for v0.1.
- **Mobile phone support (iPhone, Android phone).** PWA may run there, but UI is tablet-and-desktop-first.

## Decisions still open

Things still to pick before Phase 1 starts:

1. **React vs Svelte** — Svelte has smaller bundles and friendlier syntax; React has the much larger ecosystem (more Tiptap/Lexical examples, more component libraries, easier to find contributors). Lean React for ecosystem reasons.
2. **Tiptap vs Lexical** — Tiptap is built on ProseMirror, very mature, plugin ecosystem. Lexical is Meta's modern alternative, leaner. Either works. Tiptap is the safer pick.
3. **License: MIT vs AGPL-3.0** — MIT is simpler and lets anyone fork freely. AGPL forces hosted-service operators to share modifications, which fits an "open-source alternative to closed apps" mission. Lean AGPL for v0.1 unless we want maximum contributor friendliness.
