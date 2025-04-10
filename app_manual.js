const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
const readline = require("readline");

const total_no_of_bolts = 40;

// Serve static files from the "public" directory (for the dashboard HTML)
app.use(express.static("public"));

// Use body-parser middleware to parse JSON bodies
app.use(bodyParser.json());

// Endpoint to receive bolt count updates from ESP32 (optional)
app.post("/update", (req, res) => {
  const { boltCount } = req.body;
  console.log(`Received bolt count: ${boltCount}`);
  io.emit("updateBoltCount", boltCount);
  res.sendStatus(200);
});

// Log when a dashboard client connects
io.on("connection", (socket) => {
  console.log("A dashboard client connected");
});

// Start the server
const port = 3000;
http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  manualUpdate(); // Start manual bolt count updates
});

// Function to manually update bolt count from terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function manualUpdate() {
  rl.question("Enter new bolt count: ", (input) => {
    const boltCount = parseInt(input);
    if (!isNaN(boltCount)) {
      console.log(`Updating Bolt Count: ${boltCount}`);
      io.emit("updateBoltCount", boltCount);
    } else {
      console.log("Invalid input. Please enter a number.");
    }
    manualUpdate(); // Keep asking for new input
  });
}
