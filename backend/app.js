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
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/build")));

const bins = {}; // Store real-time bolt count data
const dataFilePath = path.join(__dirname, "bolt_data.json");

// Load existing data from JSON file on server start
/* if (fs.existsSync(dataFilePath)) {
  const fileData = fs.readFileSync(dataFilePath);
  Object.assign(bins, JSON.parse(fileData));
  console.log("Loaded previous bin data from JSON file.");
} */

try {
  if (fs.existsSync(dataFilePath)) {
    const fileData = fs.readFileSync(dataFilePath);
    Object.assign(bins, JSON.parse(fileData));
    console.log("Loaded previous bin data from JSON file.");
  }
} catch (err) {
  console.error("Error loading bin data:");
}
// POST endpoint for Arduino ESP32 to send data
app.post("/update", (req, res) => {
  console.log("Incoming POST from ESP32:", req.body);
  const { boltCount, partNumber, locationCode } = req.body;

  if (boltCount === undefined || !partNumber || !locationCode) {
    return res.status(400).send("Missing data");
  }

  const binData = {
    boltCount,
    partNumber,
    locationCode,
    lastUpdate: new Date().toISOString(),
  };

  bins[locationCode] = binData;
  console.log("Updated bin data:", binData);

  // Save updated bins to file
  fs.writeFile(dataFilePath, JSON.stringify(bins, null, 2), (err) => {
    if (err) {
      console.error("Failed to write to bolt_data.json:", err);
    } else {
      console.log("Data written to bolt_data.json");
    }
  });

  // Emit to connected React clients
  io.emit("updateBinData", { binId: locationCode, data: binData });

  res.status(200).send("OK");
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Client connected via socket.io");
  socket.emit("initialBinData", bins);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
