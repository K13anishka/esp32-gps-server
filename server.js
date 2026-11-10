
const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const DEVICE_TOKEN = process.env.DEVICE_TOKEN || "change-this-secret";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let latestGPS = {
    connected: false,
    latitude: null,
    longitude: null,
    altitude: null,
    speed: null,
    satellites: 0,
    hdop: null,
    timestamp: null
};

// ESP32 sends GPS data here
app.post("/api/gps", (req, res) => {

    const token = req.headers["x-device-token"];

    if (token !== DEVICE_TOKEN) {
        return res.status(401).json({
            error: "Unauthorized device"
        });
    }

    const { latitude, longitude, altitude, speed, satellites, hdop } = req.body;

    if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
    ) {
        return res.status(400).json({ error: "Invalid GPS coordinates" });
    }

    latestGPS = {
        connected: true,
        latitude,
        longitude,
        altitude,
        speed,
        satellites,
        hdop,
        timestamp: new Date().toISOString()
    };

    console.log("GPS RECEIVED:", latestGPS);

    res.json({
        success: true,
        message: "GPS data received"
    });
});

// Dashboard requests latest GPS data here
app.get("/api/gps", (req, res) => {
    const age = latestGPS.timestamp
        ? Date.now() - new Date(latestGPS.timestamp).getTime()
        : Infinity;

    res.json({
        ...latestGPS,
        connected: age < 20000
    });
});

app.get("/api/health", (req, res) => {
    res.json({ status: "Server running" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`GPS Server running on port ${PORT}`);
});
