
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SECRET = process.env.API_SECRET || "change-this-secret";

// ======================================
// GPS DATA
// ======================================

let gps = {
  latitude: null,
  longitude: null,
  satellites: 0,
  valid: false,
  sunrise: "--:--",
  sunset: "--:--",
  updatedAt: null
};

// ======================================
// LED COMMAND
// ======================================

let command = {
  id: 0,
  action: "NONE"
};

// ======================================
// RECEIVE GPS FROM ESP32
// ======================================

app.post("/api/gps", (req, res) => {

  if (req.headers["x-api-key"] !== SECRET) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  const {
    latitude,
    longitude,
    satellites,
    valid,
    sunrise,
    sunset
  } = req.body;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    typeof valid !== "boolean"
  ) {
    return res.status(400).json({
      error: "Invalid GPS data"
    });
  }

  gps = {
    latitude,
    longitude,
    satellites: Number(satellites) || 0,
    valid,
    sunrise: sunrise || "--:--",
    sunset: sunset || "--:--",
    updatedAt: new Date().toISOString()
  };

  console.log("GPS DATA RECEIVED:", gps);

  res.json({
    success: true,
    message: "GPS updated"
  });
});

// ======================================
// GET LATEST GPS FOR DASHBOARD
// ======================================

app.get("/api/latest", (req, res) => {
  res.json(gps);
});

// ======================================
// DASHBOARD SENDS LED COMMAND
// ======================================

app.post("/api/command", (req, res) => {

  const { action } = req.body;

  if (!["LED_ON", "LED_OFF"].includes(action)) {
    return res.status(400).json({
      error: "Invalid command"
    });
  }

  command = {
    id: command.id + 1,
    action
  };

  console.log("LED COMMAND:", command);

  res.json({
    success: true,
    command
  });
});

// ======================================
// ESP32 RECEIVES LED COMMAND
// ======================================

app.get("/api/command", (req, res) => {

  if (req.headers["x-api-key"] !== SECRET) {
    return res.status(401).json({
      error: "Unauthorized"
    });
  }

  res.json(command);
});

// ======================================
// SERVER HEALTH
// ======================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "Server running",
    gpsValid: gps.valid,
    ledCommand: command.action
  });
});

// ======================================
// START SERVER
// ======================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`GPS Server running on port ${PORT}`);
});
