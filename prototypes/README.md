# Prototypes

Self-contained HTML files. Each can be opened directly in a browser (file://) or served by the sync server. No build step.

| File | What it demonstrates |
| --- | --- |
| `00-ink-latency-test.html` | Minimal canvas with Pointer Events. Measures fps, stroke count, and JS-side input lag. The earliest experiment, used to confirm a PWA-on-iPad path is viable. |
| `01-quill-v1.html` | First full-feature build. Folders, notes, pages, pen, highlighter, eraser, lasso, shapes, ruler, text, image, table. Persists to `localStorage`. |
| `02-quill-v2.html` | Polished build. Adds smooth outline ink rendering, size sliders, custom color pickers, page templates (lined / wide / grid / squares / dots), zoom (pinch + Ctrl+scroll), pan via hand tool, page deletion. Same `localStorage` schema as v1 (data carries over). |
| `03-sync-demo.html` | Two-device sync over Y.js. Auto-picks WebSocket URL based on how the page is loaded: served from the local server → same-origin sync; opened standalone → public Y.js demo server fallback. Includes `?server=ws://...` override. |

## Local data

`01` and `02` use `localStorage` keyed by `quill-state-v1` and `quill-state-v2` respectively. Clearing browser site data wipes them.

`03` (sync demo) does **not** persist locally. Strokes only survive while at least one peer is connected — once everyone disconnects, the room is empty.

## Connecting the sync demo to your own server

When you run the local server (`cd ../server && npm start`) and open `http://localhost:1234/03-sync-demo.html`, the page detects the host and connects to `ws://localhost:1234` automatically. No configuration.

For a custom WebSocket endpoint:

```
http://localhost:1234/03-sync-demo.html?server=ws://192.168.1.42:1234
```

Useful if your server runs on a different machine than the static files (e.g. you've split the static hosting onto a CDN).

## Why these are HTML files instead of a real codebase

Phase 0 is about proving feasibility on real iPad hardware with the least possible friction. Single-file HTML can be opened directly, tested without npm or git, copied to a USB stick, mailed as an attachment. Once Phase 1 starts, this all moves into a React/Svelte project with proper tooling.

See [../docs/roadmap.md](../docs/roadmap.md).
