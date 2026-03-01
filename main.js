// main.js

const coap = require('coap');
const dgram = require('dgram');
const os = require('os');
const crypto = require('crypto');

// =============================
// Configuration
// =============================

const COAP_PORT = 5683;
const MULTICAST_ADDR = '239.255.255.250';
const MULTICAST_PORT = 5684;
const ANNOUNCE_INTERVAL_MS = 3000;

const deviceId = crypto.randomUUID();
const deviceName = "DeviceSim";

let temperature = 22;
const startTime = Date.now();

// =============================
// Utilitaire : récupérer IP locale
// =============================

function getLocalIp() {
  const interfaces = os.networkInterfaces();

  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  return "0.0.0.0";
}

// =============================
// Serveur CoAP
// =============================

const server = coap.createServer();

server.on('request', (req, res) => {
  console.log(`${req.method} ${req.url} from ${req.rsinfo.address}`);

  if (req.url === '/health') {
    res.end(JSON.stringify({
      device_id: deviceId,
      name: deviceName,
      uptime_s: Math.floor((Date.now() - startTime) / 1000),
      ts: Date.now()
    }));
  }

  else if (req.url === '/temperature' && req.method === 'GET') {
    res.end(JSON.stringify({
      temperature
    }));
  }

  else if (req.url === '/temperature' && req.method === 'PUT') {
    let body = '';

    req.on('data', chunk => body += chunk);

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        temperature = parsed.temperature;
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.code = '4.00';
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  }

  else {
    res.code = '4.04';
    res.end('Not Found');
  }
});

server.listen(COAP_PORT, () => {
  console.log(`CoAP server running on port ${COAP_PORT}`);
});

// =============================
// Multicast announce
// =============================

const announceSocket = dgram.createSocket('udp4');

function sendAnnounce() {
  const message = JSON.stringify({
    device_id: deviceId,
    name: deviceName,
    ip: getLocalIp(),
    ts: Date.now()
  });

  announceSocket.send(
    message,
    MULTICAST_PORT,
    MULTICAST_ADDR
  );
}

setInterval(sendAnnounce, ANNOUNCE_INTERVAL_MS);

console.log("Multicast announce started");