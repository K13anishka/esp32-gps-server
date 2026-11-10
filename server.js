
const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SECRET = process.env.API_SECRET || "change-this-secret";

let gps = {
  latitude: null,
  longitude: null,
  satellites: 0,
  valid: false,
  updatedAt: null
};

let command = { id: 0, action: "NONE" };

app.post("/api/gps", (req, res) => {
  if (req.headers["x-api-key"] !== SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { latitude, longitude, satellites, valid } = req.body;

  gps = {
    latitude,
    longitude,
    satellites,
    valid,
    updatedAt: new Date().toISOString()
  };

  res.json({ success: true });
});

app.get("/api/latest", (req, res) => {
  res.json(gps);
});

app.post("/api/command", (req, res) => {
  const { action } = req.body;

  if (!["LED_ON", "LED_OFF"].includes(action)) {
    return res.status(400).json({ error: "Invalid command" });
  }

  command = { id: command.id + 1, action };
  res.json({ success: true, command });
});

app.get("/api/command", (req, res) => {
  if (req.headers["x-api-key"] !== SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(command);
});

app.get("/api/health", (req, res) => {
  res.json({ status: "Server running" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`GPS Server running on port ${PORT}`);
});
