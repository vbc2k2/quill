# Quill sync server

A tiny Node process that does two things on the same port:

1. **Serves the prototype HTML** files from `../prototypes/`
2. **Provides a y-websocket sync endpoint** for real-time collaboration

Because HTTP and WebSocket share the same origin, the prototypes connect to sync without any CORS, mixed-content, or third-party-blocking issues.

## Run

```bash
npm install
npm start
```

You should see:

```
  Quill sync server
  HTTP  : http://localhost:1234
  WS    : ws://localhost:1234
```

Open `http://localhost:1234/index.html` or `http://localhost:1234/sync-demo.html` in your browser.

## Configure via environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `1234` | TCP port to listen on |
| `HOST` | `0.0.0.0` | Bind address (`127.0.0.1` for loopback only) |

```bash
PORT=8080 npm start
HOST=127.0.0.1 PORT=1234 npm start
```

## Connect from another device

On the same Wi-Fi network:

1. **Find this machine's LAN IP:**
   - Windows: `ipconfig` (look for "IPv4 Address" — usually `192.168.x.x`)
   - macOS: `ifconfig | grep "inet "` or System Settings → Network
   - Linux: `ip a` or `hostname -I`
2. **Allow the port through your firewall:**
   - Windows: Settings → Privacy & Security → Windows Security → Firewall → Allow an app, or run `New-NetFirewallRule -DisplayName "Quill" -Direction Inbound -LocalPort 1234 -Protocol TCP -Action Allow` in admin PowerShell
   - macOS: System Settings → Network → Firewall → allow Node when prompted
   - Linux (ufw): `sudo ufw allow 1234/tcp`
3. **Open on the other device** (iPad, etc.): `http://<that-LAN-IP>:1234/sync-demo.html`

The page detects the host automatically — both devices will sync to the same server with no extra configuration.

## Persistence

This server is **memory-only by default**. Strokes live as long as the process runs. For durable storage, see the [y-websocket persistence guide](https://github.com/yjs/y-websocket#persistence) — typically a few lines to wire up `y-leveldb` for an on-disk store.

## Production hardening (TODO)

For Phase 2:

- Authentication (room-level tokens or JWT)
- TLS termination (Caddy or Nginx in front; or use `https` module + Let's Encrypt)
- Document persistence (LevelDB or Postgres)
- Rate limiting and connection caps per IP
- Health check endpoint
- Systemd unit / Docker image for hands-off ops

The current setup is intentionally tiny for prototype use.
