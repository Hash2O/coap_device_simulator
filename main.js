const coap = require('coap');
const crypto = require('crypto');
const minimist = require('minimist');

// ===============================
// CLI CONFIG
// ===============================
const args = minimist(process.argv.slice(2));

const DEVICE_ID = crypto.randomUUID();
const DEVICE_NAME = args.name || "DeviceSim";

let CHAOS = {
  latency: parseInt(args.latency || 0),
  loss: parseFloat(args.loss || 0),
  offline: args.offline === true || false
};

// ===============================
// STATE
// ===============================
let temperature = 19.5;
const startTime = Date.now();

// ===============================
// UTILITIES
// ===============================
function nowTs() {
  return Math.floor(Date.now() / 1000);
}

function uptime() {
  return Math.floor((Date.now() - startTime) / 1000);
}

function maybeDrop() {
  return Math.random() < CHAOS.loss;
}

function withChaos(handler) {
  return (req, res) => {
    if (CHAOS.offline) {
      console.log("Device offline - ignoring request");
      return; // ignore completely
    }

    if (maybeDrop()) {
      console.log("Packet dropped");
      return; // simulate loss
    }

    setTimeout(() => handler(req, res), CHAOS.latency);
  };
}

// ===============================
// COAP SERVER
// ===============================
const server = coap.createServer();

  // ===========================
  // Test critique
  // ===========================

server.on('request', (req, res) => {
  console.log("Request received from:", req.rsinfo.address);
});

server.on('request', withChaos((req, res) => {
  const url = req.url;

  console.log(`➡ ${req.method} ${url}`);

  // ===========================
  // /health
  // ===========================
  if (url === '/health' && req.method === 'GET') {
    res.setOption('Content-Format', 'application/json');

    res.end(JSON.stringify({
      device_id: DEVICE_ID,
      name: DEVICE_NAME,
      uptime_s: uptime(),
      ts: nowTs()
    }));
    return;
  }

  // ===========================
  // /temperature GET
  // ===========================
  if (url === '/temperature' && req.method === 'GET') {
    res.setOption('Content-Format', 'application/json');

    res.end(JSON.stringify({
      value: temperature,
      unit: "C",
      ts: nowTs()
    }));
    return;
  }

  // ===========================
  // /temperature PUT
  // ===========================
  if (url === '/temperature' && req.method === 'PUT') {
    try {
      const payload = JSON.parse(req.payload.toString());

      if (typeof payload.value !== "number") {
        res.code = '4.00';
        return res.end("Invalid value");
      }

      temperature = payload.value;

      res.setOption('Content-Format', 'application/json');
      res.end(JSON.stringify({
        value: temperature,
        unit: "C",
        ts: nowTs()
      }));

    } catch (err) {
      res.code = '4.00';
      res.end("Invalid JSON");
    }
    return;
  }

  // ===========================
  // /chaos (OPTIONNEL)
  // ===========================
  if (url === '/chaos' && req.method === 'PUT') {
    try {
      const payload = JSON.parse(req.payload.toString());

      if (payload.latency !== undefined)
        CHAOS.latency = parseInt(payload.latency);

      if (payload.loss !== undefined)
        CHAOS.loss = parseFloat(payload.loss);

      if (payload.offline !== undefined)
        CHAOS.offline = Boolean(payload.offline);

      res.setOption('Content-Format', 'application/json');
      res.end(JSON.stringify({
        chaos: CHAOS,
        ts: nowTs()
      }));

    } catch (err) {
      res.code = '4.00';
      res.end("Invalid JSON");
    }
    return;
  }

  // ===========================
  // 404
  // ===========================
  res.code = '4.04';
  res.end("Not Found");
}));

// ===============================
// START
// ===============================
server.listen(5683, () => {
  console.log("=================================");
  console.log("CoAP Device Simulator Started");
  console.log("Port:", 5683);
  console.log("Device ID:", DEVICE_ID);
  console.log("Name:", DEVICE_NAME);
  console.log("Chaos:", CHAOS);
  console.log("=================================");
});