
// ========================================
// Device Simulator - Professional Version
// ========================================

const coap = require('coap');
const dgram = require('dgram');
const os = require('os');
const crypto = require('crypto');

// =============================
// Configuration
// =============================

const COAP_PORT = parseInt(process.env.PORT) || 5683;

const MULTICAST_ADDR = '239.255.255.250';
const MULTICAST_PORT = 5684;
const ANNOUNCE_INTERVAL_MS = 3000;

const deviceId = process.env.DEVICE_ID || crypto.randomUUID();
const deviceName = process.env.DEVICE_NAME || "DeviceSim";

let temperature = parseFloat(process.env.INIT_TEMP) || 22;
const startTime = Date.now();

// =============================
// Chaos Configuration
// =============================

let chaos = {
  latencyMs: parseInt(process.env.CHAOS_LATENCY) || 0,
  lossRate: parseFloat(process.env.CHAOS_LOSS) || 0,
  offline: process.env.CHAOS_OFFLINE === "true"
};

// =============================
// Utils
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

function respondWithChaos(res, payloadBuilder) {

  if (chaos.offline) {
    console.log("Device in OFFLINE mode");
    return;
  }

  if (Math.random() < chaos.lossRate) {
    console.log("Simulated packet loss");
    return;
  }

  setTimeout(() => {
    try {
      res.end(payloadBuilder());
    } catch (err) {
      res.code = '5.00';
      res.end(JSON.stringify({ error: "Internal error" }));
    }
  }, chaos.latencyMs);
}

// =============================
// CoAP Server
// =============================

const server = coap.createServer();

server.on('request', (req, res) => {

  console.log(`${req.method} ${req.url} from ${req.rsinfo.address}`);

  // ---------- HEALTH ----------
  if (req.url === '/health') {

    respondWithChaos(res, () => JSON.stringify({
      device_id: deviceId,
      name: deviceName,
      port: COAP_PORT,
      uptime_s: Math.floor((Date.now() - startTime) / 1000),
      chaos: chaos,
      ts: Date.now()
    }));
  }

  // ---------- GET TEMPERATURE ----------
  else if (req.url === '/temperature' && req.method === 'GET') {

  respondWithChaos(res, () => JSON.stringify({
    value: temperature,
    ts: Date.now()
  }));
}

  // ---------- SET TEMPERATURE ----------
else if (req.url === '/temperature' && req.method === 'PUT') {

  let body = '';

  req.on('data', chunk => body += chunk);

  req.on('end', () => {

    respondWithChaos(res, () => {

      try {
        const parsed = JSON.parse(body);

        if (typeof parsed.value !== "number") {
          res.code = '4.00';
          return JSON.stringify({ error: "Invalid value" });
        }

        temperature = parsed.value;

        const responsePayload = {
          value: temperature,
          ts: Date.now()
        };

        console.log(`🌡 Temperature updated to ${temperature}`);

        return JSON.stringify(responsePayload);

      } catch {
        res.code = '4.00';
        return JSON.stringify({ error: "Invalid JSON" });
      }
    });
  });
}

  // ---------- CHAOS CONFIG ----------
  else if (req.url === '/chaos' && req.method === 'PUT') {

    let body = '';

    req.on('data', chunk => body += chunk);

    req.on('end', () => {

      try {
        const parsed = JSON.parse(body);

        chaos.latencyMs = parsed.latency_ms ?? chaos.latencyMs;
        chaos.lossRate = parsed.loss_rate ?? chaos.lossRate;
        chaos.offline = parsed.offline ?? chaos.offline;

        console.log("Chaos config updated:", chaos);

        res.end(JSON.stringify({ success: true, chaos }));

      } catch {
        res.code = '4.00';
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  }

  // ---------- NOT FOUND ----------
  else {
    res.code = '4.04';
    res.end('Not Found');
  }
});

server.listen(COAP_PORT, () => {
  console.log("=================================");
  console.log("Device Simulator Started");
  console.log("=================================");
  console.log("Device ID :", deviceId);
  console.log("Device Name :", deviceName);
  console.log("Port :", COAP_PORT);
  console.log("Initial Chaos :", chaos);
  console.log("=================================");
});

// =============================
// Multicast Announce
// =============================

const announceSocket = dgram.createSocket('udp4');

function sendAnnounce() {

  if (chaos.offline) return;

  const message = JSON.stringify({
    device_id: deviceId,
    name: deviceName,
    ip: getLocalIp(),
    port: COAP_PORT,
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