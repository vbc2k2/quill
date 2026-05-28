#!/usr/bin/env node
/**
 * Quill sync server
 *
 * Single Node process that does two things on the same port:
 *   1. Serves the prototype HTML files over HTTP (from ../prototypes/)
 *   2. Provides a y-websocket sync endpoint via WebSocket upgrade
 *
 * Because HTTP and WebSocket share the same origin, the prototype pages don't
 * hit any CORS or mixed-content issues — they just connect to ws://<host>:<port>
 * automatically.
 *
 * Run:
 *   npm start                    # listens on 0.0.0.0:1234
 *   PORT=8080 npm start          # custom port
 *   HOST=127.0.0.1 npm start     # bind to loopback only
 *
 * Then open http://localhost:1234/ or
 * http://<your-LAN-IP>:1234/ from another device.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');
const os = require('os');
const WebSocket = require('ws');
// IMPORTANT: y-websocket's exports map keys this path as `./bin/utils`
// (no .js extension). With a .js suffix Node throws ERR_PACKAGE_PATH_NOT_EXPORTED
// on modern releases (Node 16+) where exports gates are enforced.
const { setupWSConnection } = require('y-websocket/bin/utils');

const PORT = parseInt(process.env.PORT || '1234', 10);
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.resolve(__dirname, '..', 'prototypes');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm':  'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
  '.map':  'application/json; charset=utf-8',
};

function safeJoin(base, requested) {
  const target = path.normalize(path.join(base, requested));
  if (!target.startsWith(base)) return null;
  return target;
}

function sendFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

function indexHtml(items, pathname) {
  const links = items
    .filter((i) => !i.startsWith('.'))
    .sort()
    .map((i) => {
      const href = path.posix.join(pathname.replace(/\/$/, ''), i);
      return `<li><a href="${href}">${i}</a></li>`;
    })
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Quill — prototypes</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 60px auto; padding: 0 24px; color: #1a1a1a; }
  h1 { font-size: 22px; margin-bottom: 6px; }
  .lede { color: #6b6b6b; margin-bottom: 28px; }
  ul { list-style: none; padding: 0; }
  li { margin: 4px 0; }
  a { color: #5b8c5a; text-decoration: none; font-size: 15px; padding: 6px 10px; border-radius: 6px; display: inline-block; }
  a:hover { background: rgba(91,140,90,0.08); }
  code { font-family: ui-monospace, monospace; font-size: 13px; background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 3px; }
</style>
</head>
<body>
  <h1>Quill — local prototypes</h1>
  <p class="lede">Served from <code>${PUBLIC_DIR}</code></p>
  <ul>${links}</ul>
</body>
</html>`;
}

// Pick the best LAN IPv4 to advertise for QR-share. Excludes loopback, link-local,
// and Docker/VPN-style interfaces when possible. Returns the first plausible RFC1918
// address, or null if none found.
function getLanIp() {
  const ifaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(ifaces)) {
    for (const info of ifaces[name] || []) {
      if (info.family !== 'IPv4' || info.internal) continue;
      // Skip obvious virtual interfaces (Docker, VPN, etc.)
      if (/^(vEthernet|docker|veth|vmnet|virbr|tap|tun)/i.test(name)) continue;
      // Prefer common LAN ranges
      const score = /^192\.168\./.test(info.address) ? 3
                  : /^10\./.test(info.address) ? 2
                  : /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(info.address) ? 1
                  : 0;
      candidates.push({ ip: info.address, name, score });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].ip;
}

function handleApi(req, res) {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname === '/api/info') {
    const lanIp = getLanIp();
    const body = {
      lanIp,
      port: PORT,
      url: lanIp ? `http://${lanIp}:${PORT}/` : `http://localhost:${PORT}/`,
      version: '0.1.0',
    };
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(body));
    return true;
  }
  return false;
}

function serveStatic(req, res) {
  if (handleApi(req, res)) return;

  const parsed = url.parse(req.url);
  let pathname = decodeURIComponent(parsed.pathname || '/');
  if (pathname === '/') pathname = '/';

  const filePath = safeJoin(PUBLIC_DIR, pathname);
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + pathname);
      return;
    }
    if (stat.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      fs.stat(indexPath, (e2, s2) => {
        if (!e2 && s2.isFile()) {
          sendFile(indexPath, res);
          return;
        }
        fs.readdir(filePath, (e3, items) => {
          if (e3) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal error');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(indexHtml(items, pathname));
        });
      });
      return;
    }
    sendFile(filePath, res);
  });
}

const server = http.createServer((req, res) => {
  serveStatic(req, res);
});

const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', (conn, req) => {
  // Room name is taken from the URL path: /<room>
  setupWSConnection(conn, req, { gc: true });
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

server.listen(PORT, HOST, () => {
  const localUrl = `http://localhost:${PORT}`;
  console.log('');
  console.log('  ┌────────────────────────────────────────────┐');
  console.log('  │  Quill sync server                         │');
  console.log('  ├────────────────────────────────────────────┤');
  console.log(`  │  HTTP  : ${localUrl.padEnd(34)}│`);
  console.log(`  │  WS    : ws://localhost:${String(PORT).padEnd(19)}│`);
  console.log(`  │  Host  : ${HOST.padEnd(34)}│`);
  console.log(`  │  Files : prototypes/                       │`);
  console.log('  └────────────────────────────────────────────┘');
  console.log('');
  console.log('  Open in your browser:');
  console.log(`    ${localUrl}/                  (notes app)`);
  console.log(`    ${localUrl}/sync-demo.html    (minimal sync demo)`);
  console.log('');
  const lanIp = getLanIp();
  console.log('  From iPad / other devices on the same network:');
  if (lanIp) {
    console.log(`    LAN URL: http://${lanIp}:${PORT}/`);
    console.log('    (The in-app Share button generates a QR code for this URL.)');
  } else {
    console.log('    Couldn\'t auto-detect LAN IP. On Windows run `ipconfig`,');
    console.log('    Linux/Mac `ip a` or `ifconfig`, and open http://<that-ip>:' + PORT + '/');
  }
  console.log('    Make sure your firewall allows incoming connections on port ' + PORT);
  console.log('');
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});

const shutdown = () => {
  console.log('\nShutting down...');
  wss.close(() => {
    server.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 5000).unref();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
