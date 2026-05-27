# Quill

An open-source, cross-platform notes app where the **iPad-to-desktop sync loop** is the killer feature. Write naturally on iPad with Apple Pencil; see your strokes on Windows / Mac / Linux within seconds.

> **Status:** Early prototype. Not production-ready. Architecture validated, real codebase migration in progress.

## What's in this repo

```
quill/
├── prototypes/      # Self-contained HTML prototypes you can open in any browser
│   ├── 00-ink-latency-test.html   # Minimal canvas: pen latency measurement
│   ├── 01-quill-v1.html           # First full-feature build (folders, all tools)
│   ├── 02-quill-v2.html           # Polished: smooth ink, zoom, hand tool, page templates
│   └── 03-sync-demo.html          # Two-device Y.js sync demo
├── server/          # Self-hostable y-websocket sync server (Node)
├── docs/            # Architecture, setup guides, roadmap
└── README.md        # You are here
```

## Quick start

You need Node.js 18+ on the machine that will host sync (your PC or Raspberry Pi).

```bash
git clone https://github.com/vbc2k2/quill.git
cd quill/server
npm install
npm start
```

The server starts on `http://localhost:1234` and serves the prototypes alongside the WebSocket sync endpoint on the same port.

Open in a browser:
- `http://localhost:1234/02-quill-v2.html` — the main notes app
- `http://localhost:1234/03-sync-demo.html` — minimal sync demonstration

From another device on the same network (your iPad, for example):
1. Find your machine's LAN IP — on Windows: `ipconfig` and look for IPv4 Address (usually `192.168.x.x`)
2. On iPad Safari, open `http://<that-ip>:1234/03-sync-demo.html`
3. The page detects the host automatically — sync just works between your devices

Detailed setup:
- [Windows PC setup](docs/setup-windows.md)
- [Raspberry Pi setup](docs/setup-raspberry-pi.md)

## Final product shape

| Device | Delivery | Capability |
| --- | --- | --- |
| **iPad** | PWA (Add to Home Screen) | Apple Pencil handwriting, offline-first, syncs to your server |
| **Windows / Linux** | Tauri 2 native app (`.exe` / Linux binary) | Native window, rich text typing alongside ink, file system access |
| **Sync server** | y-websocket-server on Node | Self-hosted on a VPS, Raspberry Pi, or anywhere — you own the data |

See [docs/architecture.html](docs/architecture.html) for the full picture.

## Tech stack

- **UI:** plain HTML/JS today, migrating to React or Svelte
- **Ink rendering:** custom outline algorithm in prototypes; will swap in [perfect-freehand](https://github.com/steveruizok/perfect-freehand) for production
- **Sync:** [Y.js](https://yjs.dev) CRDT over WebSocket ([y-websocket](https://github.com/yjs/y-websocket))
- **Desktop wrapper:** [Tauri 2](https://tauri.app)
- **iPad delivery:** PWA — no App Store, no Apple Developer account, no Mac needed

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for phased plan.

**Now:** prototype validation (✓ feature-set, ✓ sync mechanism, ✓ self-hostable server)
**Next:** integrate sync into the full Quill app, migrate to React/Svelte, ship a Tauri Windows build

## Inspiration & references

The handwriting notes space has excellent open-source projects worth studying:

- [perfect-freehand](https://github.com/steveruizok/perfect-freehand) — gold standard for JS ink rendering
- [Excalidraw](https://github.com/excalidraw/excalidraw) — open whiteboard with mature selection/shapes
- [tldraw](https://github.com/tldraw/tldraw) — sophisticated whiteboard UX
- [Saber](https://github.com/adil192/saber) — Flutter cross-platform handwriting notes (closest existing match)
- [Xournal++](https://github.com/xournalpp/xournalpp) — desktop FOSS handwriting notes
- [Joplin](https://github.com/laurent22/joplin) — text notes with sync (reference for sync server architecture)

## License

MIT for now — see [LICENSE](LICENSE). May switch to AGPL-3.0 before v1.0 to require service operators to share modifications.

---

*Prototyped collaboratively with Claude (Anthropic). Not affiliated with any of the apps or libraries above.*
