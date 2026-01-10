import express from "express";
import fetch from "node-fetch";

const app = express();

// -----------------------------
// Helper: Convert city → lat/lon
// -----------------------------
async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    return null;
  }

  return {
    lat: data.results[0].latitude,
    lon: data.results[0].longitude,
    name: data.results[0].name
  };
}

// -----------------------------
// Weather endpoint
// -----------------------------
app.get("/weather", async (req, res) => {
  let { city, lat, lon, panel_area, panel_eff, rotor_area, rotor_eff } = req.query;

  // Default equipment values if not provided
  panel_area = Number(panel_area) || 1.6;     // m²
  panel_eff = Number(panel_eff) || 0.20;      // 20%
  rotor_area = Number(rotor_area) || 3;       // m²
  rotor_eff = Number(rotor_eff) || 0.35;      // 35%

  // If city is provided → convert to lat/lon
  if (city) {
    const geo = await geocodeCity(city);
    if (!geo) {
      return res.json({ error: "City not found" });
    }
    lat = geo.lat;
    lon = geo.lon;
    city = geo.name;
  }

  // Validate coordinates
  if (!lat || !lon) {
    return res.json({
      error: "Missing coordinates",
      example: "/weather?city=Stockholm OR /weather?lat=59.3&lon=18.0"
    });
  }

  // Fetch weather data from Open-Meteo
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation`;

  const weatherRes = await fetch(weatherUrl);
  const weather = await weatherRes.json();

  const temp = weather.hourly.temperature_2m[0];
  const humidity = weather.hourly.relative_humidity_2m[0];
  const wind = weather.hourly.wind_speed_10m[0];
  const radiation = weather.hourly.shortwave_radiation[0];

  // -----------------------------
  // Energy calculations
  // -----------------------------

  // Solar energy (Wh)
  const solarEnergy = radiation * panel_area * panel_eff;

  // Wind power (W)
  const airDensity = 1.225; // kg/m³
  const windPower = 0.5 * airDensity * rotor_area * Math.pow(wind, 3) * rotor_eff;

  // Ice risk
  let iceRisk = "low";
  if (temp < 0 && humidity > 80) iceRisk = "high";
  else if (temp < 2 && humidity > 70) iceRisk = "medium";

  // -----------------------------
  // Response
  // -----------------------------
  res.json({
    location: city || { lat, lon },
    weather: {
      temperature: temp,
      humidity,
      wind_speed: wind,
      radiation
    },
    solar: {
      panel_area,
      panel_eff,
      energy_Wh: solarEnergy
    },
    wind: {
      rotor_area,
      rotor_eff,
      power_W: windPower
    },
    ice: {
      risk: iceRisk
    }
  });
});

// -----------------------------
// Health check
// -----------------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
