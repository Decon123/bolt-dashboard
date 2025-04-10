const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
const readline = require("readline");
const fs = require("fs");

const DATA_FILE = "bolt_data.json";

// Serve static files (frontend)
app.use(express.static("public"));
app.use(bodyParser.json());

// Load stored bolt count from file (if available)
let boltData = {
  itemCode: "BOLT123",
  currentCount: 50,
  totalCount: 1000,
};

// Function to load bolt data from file (if exists)
function loadBoltData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      boltData = data;
      console.log("🔄 Loaded previous bolt data:", boltData);
    } catch (err) {
      console.error("❌ Error reading stored data:", err);
    }
  }
}

// Function to save bolt data
function saveBoltData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(boltData, null, 2));
}

// Load previous bolt count when server starts
loadBoltData();

// Function to validate bolt count
function isValidBoltCount(newCount, totalCount) {
  return newCount >= 0 && newCount <= totalCount;
}

// Endpoint to receive updates
app.post("/update", (req, res) => {
  const { itemCode, currentCount, totalCount } = req.body;

  if (totalCount) boltData.totalCount = totalCount; // Allow updating total count

  if (isValidBoltCount(currentCount, boltData.totalCount)) {
    if (itemCode) boltData.itemCode = itemCode;
    boltData.currentCount = currentCount;

    console.log(
      `✅ Updated: ${boltData.itemCode} - ${boltData.currentCount}/${boltData.totalCount}`
    );

    // Save updated bolt count
    saveBoltData();

    // Send update to all connected clients
    io.emit("updateBoltData", boltData);
    res.json({ success: true, boltData });
  } else {
    console.log("❌ Invalid bolt count! Must be between 0 and total.");
    res
      .status(400)
      .json({ error: "Bolt count must be between 0 and total count." });
  }
});

// WebSocket connection
io.on("connection", (socket) => {
  console.log("✅ Client connected");

  // Send the last saved bolt count to new clients
  socket.emit("updateBoltData", boltData);
});

// Manual input for testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function manualUpdate() {
  rl.question("Enter new bolt count: ", (input) => {
    const newCount = parseInt(input);

    if (isValidBoltCount(newCount, boltData.totalCount)) {
      boltData.currentCount = newCount;
      console.log(
        `⚡ Updating Bolt Count: ${boltData.currentCount}/${boltData.totalCount}`
      );

      // Save updated bolt count
      saveBoltData();

      io.emit("updateBoltData", boltData);
    } else {
      console.log(
        "❌ Invalid input! Bolt count must be between 0 and total count."
      );
    }

    manualUpdate(); // Keep asking for input
  });
}

http.listen(3000, () => {
  console.log(`🚀 Server running at http://localhost:3000`);
  manualUpdate();
});
