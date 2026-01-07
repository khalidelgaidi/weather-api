// weather_api backend – Node.js + Express
// Fullt kompatibel med din package.json och Railway

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// Helper: fetch JSON
async function getJSON(url) {
  const res = await fetch(url);
  return res.json();
}

// -------------------------
// HEALTH CHECK
// -------------------------
app.get("/health", (req, res) => {
  res.json({ status: "weather_api_ok" });
});

// -------------------------
// SOLAR ENDPOINT
// -------------------------
app.get("/solar", async (req, res) => {
  try {
    const { city, period, area, eff } = req.query;

    if (!city) return res.status(400).json({ error: "Missing city" });

    // Geocoding
    const geo = await getJSON(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
    );

    if (!geo.results || geo.results.length === 0)
      return res.status(404).json({ error: "City not found" });

    const { latitude, longitude } = geo.results[0];

    // Solar radiation
    const weather = await getJSON(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=shortwave_radiation`
    );

    const radiation = weather.hourly.shortwave_radiation.slice(0, 24);
    const sum = radiation.reduce((a, b) => a + b, 0);

    const kWh = (sum * area * eff) / 1000;

    res.json({ solar: Number(kWh.toFixed(2)) });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// -------------------------
// WIND ENDPOINT
// -------------------------
app.get("/wind", async (req, res) => {
  try {
    const { city, period, diameter } = req.query;

    if (!city) return res.status(400).json({ error: "Missing city" });

    // Geocoding
    const geo = await getJSON(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
    );

    if (!geo.results || geo.results.length === 0)
      return res.status(404).json({ error: "City not found" });

    const { latitude, longitude } = geo.results[0];

    // Wind speed
    const weather = await getJSON(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=windspeed_10m`
    );

    const wind = weather.hourly.windspeed_10m.slice(0, 24);
    const avg = wind.reduce((a, b) => a + b, 0) / wind.length;

    const radius = diameter / 2;
    const sweptArea = Math.PI * radius * radius;

    const power = 0.5 * 1.225 * sweptArea * Math.pow(avg, 3);
    const kWh = (power * 24) / 1000;

    res.json({ wind: Number(kWh.toFixed(2)) });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// -------------------------
// TOTAL ENDPOINT
// -------------------------
app.get("/total", async (req, res) => {
  try {
    const { city, period, area, eff, diameter } = req.query;

    const solarRes = await getJSON(
      `${req.protocol}://${req.get("host")}/solar?city=${city}&period=${period}&area=${area}&eff=${eff}`
    );

    const windRes = await getJSON(
      `${req.protocol}://${req.get("host")}/wind?city=${city}&period=${period}&diameter=${diameter}`
    );

    const total = (solarRes.solar || 0) + (windRes.wind || 0);

    res.json({
      solar: solarRes.solar,
      wind: windRes.wind,
      total: Number(total.toFixed(2)),
    });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// -------------------------
app.listen(PORT, () => {
  console.log(`weather_api backend running on port ${PORT}`);
});
