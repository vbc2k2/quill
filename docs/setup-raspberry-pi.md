# Setup — Raspberry Pi as always-on sync host

Once you've validated the setup on your PC, moving it to a Raspberry Pi gives you a tiny always-on sync server that your iPad and Windows can both reach whenever your home network is up.

Any Pi 3 or newer works fine. A Pi Zero 2 W is enough for personal use.

## Prerequisites

- Raspberry Pi with Raspberry Pi OS (Bookworm or newer) installed
- SSH access (or a keyboard + monitor on the Pi)
- Connected to the same Wi-Fi as your iPad and Windows

## Steps

### 1. SSH into the Pi

```bash
ssh pi@raspberrypi.local
```

(Replace with your actual user / hostname if different. If `raspberrypi.local` doesn't resolve, use the Pi's IP from your router admin panel.)

### 2. Install Node.js 18+

Raspberry Pi OS sometimes ships an old Node. Use NodeSource to get a current version:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

You want Node 18 or later.

### 3. Clone the repo

```bash
sudo apt-get install -y git
git clone https://github.com/vbc2k2/quill.git
cd quill/server
npm install
```

### 4. Test the server

```bash
npm start
```

You should see the same banner you saw on Windows. The Pi is now serving on port 1234.

Test from the Pi itself (in another SSH window):

```bash
curl http://localhost:1234/sync-demo.html | head -20
```

You should see HTML coming back.

### 5. Find the Pi's LAN IP

```bash
hostname -I
```

Take note of the IP — e.g. `192.168.1.30`.

### 6. Open it on your iPad and Windows

- iPad Safari: `http://192.168.1.30:1234/sync-demo.html`
- Windows browser: same URL
- Click Connect on both. Draw on iPad — see it on Windows.

### 7. Make it run on boot — systemd

So the server starts automatically when the Pi powers on, even after reboots:

```bash
sudo nano /etc/systemd/system/quill-sync.service
```

Paste:

```ini
[Unit]
Description=Quill sync server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/quill/server
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
Environment=PORT=1234
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
```

Save (Ctrl+O, Enter, Ctrl+X), then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable quill-sync
sudo systemctl start quill-sync
sudo systemctl status quill-sync
```

You should see `active (running)`. Reboot the Pi (`sudo reboot`) and confirm the server comes back up on its own.

To check logs later:

```bash
sudo journalctl -u quill-sync -f
```

### 8. Give the Pi a stable address

The Pi's IP can change if your router hands it a different DHCP lease. Two ways to fix this:

**Option A — Reserve a DHCP lease in your router:**
Most home routers (search the admin UI for "DHCP reservation" or "static lease") let you pin a specific IP to a specific MAC address. Find the Pi's MAC: `ip link show wlan0` (or `eth0`).

**Option B — Use mDNS (recommended for home use):**
Pi's already advertise themselves as `<hostname>.local`. Default hostname is `raspberrypi`, so `http://raspberrypi.local:1234/sync-demo.html` works from most devices, including iPad.

You can rename via `sudo raspi-config` → System Options → Hostname. Pick something memorable like `quill` → `http://quill.local:1234/...`.

## Troubleshooting

**`npm install` fails with native module errors**
- The `ws` package has no native deps so this should be clean. If you see errors, run `sudo apt-get install -y build-essential python3` and retry.

**Pi is slow to start up the server**
- First-run Node JIT warmup. After 10-15 seconds it's fully responsive.

**iPad can't reach the Pi**
- Check the Pi is on Wi-Fi: `iwconfig wlan0` — should show "ESSID" matching your network
- Check the firewall isn't blocking: Pi OS doesn't enable a firewall by default, so usually this is fine
- Confirm the URL: `http://<pi-ip>:1234/...` not `https://`

**Notes lost on reboot**
- Expected — the prototype is memory-only. See [server/README.md](../server/README.md) for adding LevelDB persistence.

## Power & networking notes

- A Pi running 24/7 draws ~2-4W (Pi 3) or under 1W (Pi Zero 2 W). Cents per month.
- The Pi only needs to be reachable from your home network. **Don't open port 1234 to the public internet** without auth in place — the prototype has no authentication, so anyone who can reach the WebSocket can read and modify your notes.

## Going further

When you're ready to access notes outside your home network:

- **Tailscale** ([tailscale.com](https://tailscale.com)) — free for personal use, gives every device a stable private IP. Easiest secure remote access.
- **Cloudflare Tunnel** — free, exposes the Pi via a public hostname with TLS, optionally behind auth.
- **VPN** — Wireguard or OpenVPN on the Pi or your router.

All of these keep the trust boundary intact: only authenticated devices can reach the sync server.
