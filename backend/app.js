// backend/server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/build")));

const bins = {}; // Store real-time bin data keyed by chipID
const pendingConfigUpdates = {}; // Store pending config updates per chipID
const configConfirmations = {}; // Store confirmation status for each chipID
//const CONFIG_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const dataFilePath = path.join(__dirname, "bolt_data.json");

// Reload from JSON file
function reloadBinsFromFile() {
  if (fs.existsSync(dataFilePath)) {
    const fileData = fs.readFileSync(dataFilePath);
    Object.assign(bins, JSON.parse(fileData));
    console.log("Reloaded bins from file.");
  }
}

//reloadBinsFromFile(); // Initial load

try {
  if (fs.existsSync(dataFilePath)) {
    const fileData = fs.readFileSync(dataFilePath);
    Object.assign(bins, JSON.parse(fileData));
    console.log("Loaded previous bin data from JSON file.");
  }
} catch (err) {
  console.error("Error loading bin data:", err);
}

// POST endpoint for ESP32 to send initial or periodic data
app.post("/update", (req, res) => {
  console.log("Incoming POST from ESP32:", req.body);
  const { chipID, boltCount, partNumber, locationCode, boltWeight } = req.body;

  if (!chipID || boltCount === undefined) {
    return res.status(400).send("Missing chipID or boltCount");
  }

  const existingBin = bins[chipID];

  if (!existingBin) {
    return res.status(404).send("Device not registered/configured");
  }

  // Only update boltCount, keep partNumber, locationCode, boltWeight
  bins[chipID] = {
    ...existingBin,
    boltCount,
    lastUpdate: new Date().toISOString(),
  };

  console.log("Updated bin data:", bins[chipID]);

  fs.writeFile(dataFilePath, JSON.stringify(bins, null, 2), (err) => {
    if (err) {
      console.error("Failed to write to bolt_data.json:", err);
    } else {
      console.log("Data written to bolt_data.json");
    }
  });

  io.emit("updateBinData", { chipID, data: bins[chipID] });

  res.status(200).send("OK");
});

/* app.post("/update", (req, res) => {
  console.log("Incoming POST from ESP32:", req.body);
  const { chipID, boltCount, partNumber, locationCode, boltWeight } = req.body;

  if (!chipID || boltCount === undefined || !partNumber || !boltWeight) {
    return res
      .status(400)
      .send(
        "Missing data (chipID, boltCount, partNumber, boltWeight required)"
      );
  }

  bins[chipID] = {
    chipID,
    boltCount,
    partNumber,
    locationCode: locationCode || null,
    boltWeight,
    //lastUpdate: new Date().toISOString(),
  };

  console.log("Updated bin data:", bins[chipID]);

  fs.writeFile(dataFilePath, JSON.stringify(bins, null, 2), (err) => {
    if (err) {
      console.error("Failed to write to bolt_data.json:", err);
    } else {
      console.log("Data written to bolt_data.json");
    }
  });

  io.emit("updateBinData", { chipID, data: bins[chipID] });

  res.status(200).send("OK");
}); */

// PATCH endpoint from frontend to update config for a specific chipID
app.patch("/config", async (req, res) => {
  const { chipID, partNumber, locationCode, boltWeight } = req.body;

  if (!chipID || !partNumber || !locationCode || boltWeight === undefined) {
    return res
      .status(400)
      .send(
        "Missing configuration data (chipID, partNumber, locationCode, boltWeight required)"
      );
  }

  if (!Number.isFinite(Number(boltWeight))) {
    return res.status(400).send("Invalid bolt weight value");
  }

  const oldBin = bins[chipID];
  if (!oldBin) {
    return res.status(404).send("Device not found");
  }

  const newBin = {
    ...oldBin,
    partNumber,
    locationCode,
    boltWeight: Number(boltWeight),
    //lastUpdate: new Date().toISOString(),
  };

  bins[chipID] = newBin;
  pendingConfigUpdates[chipID] = await {
    partNumber,
    locationCode,
    boltWeight: Number(boltWeight),
    //timestamp: Date.now(),
  };
  configConfirmations[chipID] = false;

  console.log(
    "Stored config update for device:",
    chipID,
    pendingConfigUpdates[chipID]
  );
  console.log("Updated config for bin:", newBin);

  fs.writeFile(dataFilePath, JSON.stringify(bins, null, 2), (err) => {
    if (err) {
      console.error("Failed to write updated config to bolt_data.json:", err);
    } else {
      console.log("Updated config saved to file");
    }
  });

  // reloadBinsFromFile();
  //Forward to ESP32

  io.emit("updateBinData", { chipID: chipID, data: bins[chipID] });

  res.status(200).send("Configuration updated");
});

// GET endpoint for ESP32 to poll for config updates by chipID
app.get("/config/:chipID", (req, res) => {
  //reloadBinsFromFile();
  const { chipID } = req.params;
  const bin = bins[chipID];
  console.log(`Sending config for ${chipID}:`, bin);
  if (bin) {
    console.log(`Sending config for ${chipID}:`, bin);
    return res.json(bin);
  } else {
    return res.status(404).send("Device not found");
  }
});

// POST endpoint for ESP32 to confirm config update received
/* app.post("/confirm-config", (req, res) => {
  const { chipID } = req.body;

  if (!chipID) {
    return res.status(400).send("Missing chipID for confirmation");
  }

  if (pendingConfigUpdates[chipID]) {
    delete pendingConfigUpdates[chipID];
    configConfirmations[chipID] = true;
    console.log(Config confirmed by ESP32 for chipID: ${chipID});
    return res.status(200).send("Confirmation received");
  }

  return res.status(404).send("No pending config for this chipID");
}); */

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Client connected via socket.io");
  socket.emit("initialBinData", bins);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
