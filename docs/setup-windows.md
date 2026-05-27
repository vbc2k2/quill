# Setup — Windows PC as sync host

This guide walks through running the Quill sync server on your Windows machine and connecting from your iPad on the same Wi-Fi network.

## Prerequisites

- Windows 10 or 11
- Node.js 18+ — download from [nodejs.org](https://nodejs.org) (LTS is fine)
- Git for Windows (optional, if you want `git clone`) — [git-scm.com](https://git-scm.com/download/win)

Verify your Node install in PowerShell:

```powershell
node --version
npm --version
```

You should see `v18.x` or later for Node, and `9.x` or later for npm.

## Steps

### 1. Get the code

```powershell
git clone https://github.com/vbc2k2/quill.git
cd quill
```

Or download the ZIP from GitHub → Code → Download ZIP, and extract it somewhere.

### 2. Install server dependencies

```powershell
cd server
npm install
```

This pulls down `yjs`, `y-websocket`, and `ws`. Takes ~10 seconds.

### 3. Start the server

```powershell
npm start
```

You should see the banner:

```
  Quill sync server
  HTTP  : http://localhost:1234
  WS    : ws://localhost:1234
```

Leave this terminal window open. The server runs until you press Ctrl+C.

### 4. Test from your Windows browser

Open Chrome / Edge / Firefox and go to:

```
http://localhost:1234/03-sync-demo.html
```

Draw something — it should work. Now open the same URL in a second browser window or incognito tab. They should sync between the two tabs. This proves the server itself works.

### 5. Find your Windows machine's LAN IP

In a separate PowerShell window:

```powershell
ipconfig
```

Look for the section for your active Wi-Fi (or Ethernet) connection. You want the **IPv4 Address** — something like `192.168.1.42` or `10.0.0.15`.

### 6. Allow the port through Windows Firewall

The first time another device tries to connect, Windows might block it. Run this in **admin PowerShell** to permanently allow port 1234:

```powershell
New-NetFirewallRule -DisplayName "Quill" -Direction Inbound -LocalPort 1234 -Protocol TCP -Action Allow
```

(To revoke later: `Remove-NetFirewallRule -DisplayName "Quill"`.)

### 7. Open it on your iPad

On iPad Safari, navigate to:

```
http://192.168.1.42:1234/03-sync-demo.html
```

(Use **your** actual IP from step 5.)

The page detects the host automatically. Click Connect on both devices. Draw on iPad — it should appear on Windows in ~100-500ms.

To get the iPad version "app-like":

1. Tap the Share button in Safari
2. Tap "Add to Home Screen"
3. Confirm — Quill now has its own icon on your home screen and opens fullscreen

## Troubleshooting

**"This site can't be reached" from iPad**
- Check the IP is right (`ipconfig` again, look for IPv4 of your wireless adapter)
- Check the firewall rule was created
- Make sure iPad is on the **same** Wi-Fi network (not cellular, not a guest network)

**Connection keeps dropping**
- Check the server terminal — any errors logged there?
- Check Windows isn't going to sleep (the server stops if your PC sleeps)
- Try another port: `$env:PORT=8080; npm start` then use that port in the URL

**It works locally but not from iPad**
- Almost always a firewall issue. Disable Windows Firewall temporarily to confirm, then re-enable and add the explicit rule above.

**Notes don't persist after restarting the server**
- That's expected — the prototype is memory-only. See [server/README.md](../server/README.md) for the persistence section.

## When you outgrow this

Running the sync server on your main PC works, but it stops syncing when you turn the PC off. For an always-on setup, see [setup-raspberry-pi.md](setup-raspberry-pi.md).
