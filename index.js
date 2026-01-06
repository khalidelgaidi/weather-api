require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Fix för Node 24 + CommonJS
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint – enkel koll
app.get("/", (req, res) => {
  res.json({ message: "Weather API is running" });
});

// Aktuellt väder via stad
app.get("/weather", async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }

  const apiKey = process.env.OPENWEATHER_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== 200) {
      return res.status(500).json({ error: "Failed to fetch weather" });
    }

    res.json(data);
  } catch (error) {
    console.error("WEATHER ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 5-dagars prognos (3-timmars intervaller)
app.get("/forecast", async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }

  const apiKey = process.env.OPENWEATHER_KEY;
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log("FORECAST RAW RESPONSE:", JSON.stringify(data, null, 2));

    if (data.cod !== "200") {
      return res.status(500).json({ error: "Failed to fetch forecast" });
    }

    res.json(data);
  } catch (error) {
    console.error("FORECAST ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Avancerat väder – isrisk, vind, solpaneler
app.get("/weather-advanced", async (req, res) => {
  const city = req.query.city;
  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }

  const apiKey = process.env.OPENWEATHER_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== 200) {
      return res.status(500).json({ error: "Failed to fetch weather" });
    }

    const temp = data.main?.temp;
    const humidity = data.main?.humidity;
    const clouds = data.clouds?.all; // 0–100 %
    const windSpeed = data.wind?.speed; // m/s
    const windDeg = data.wind?.deg;    // 0–360°
    const sunrise = data.sys?.sunrise; // unix
    const sunset = data.sys?.sunset;   // unix

    // 1) Isrisk (enkel modell)
    let iceRisk = false;
    let iceRiskLevel = "Ingen";

    if (typeof temp === "number" && typeof humidity === "number") {
      if (temp <= 2 && humidity >= 80) {
        iceRisk = true;
        iceRiskLevel = temp <= 0 ? "Mycket hög" : "Hög";
      } else if (temp <= 4 && humidity >= 70) {
        iceRisk = true;
        iceRiskLevel = "Måttlig";
      }
    }

    // 2) Vindriktning (grader -> text)
    function getWindDirection(deg) {
      if (deg == null) return null;
      const dirs = ["N", "NÖ", "Ö", "SÖ", "S", "SV", "V", "NV"];
      const idx = Math.round(deg / 45) % 8;
      return dirs[idx];
    }

    const windDirectionText = getWindDirection(windDeg);

    // 3) Soltimmar & solpanel‑relevans
    let sunHours = null;
    if (sunrise && sunset) {
      const seconds = sunset - sunrise;
      sunHours = Math.round((seconds / 3600) * 10) / 10; // 1 decimal
    }

    const cloudiness = typeof clouds === "number" ? clouds : null;
    let solarIntensity = null;      // 0–1, hur mycket sol som når paneler
    let panelOutputFactor = null;   // 0–1, grov uppskattning

    if (cloudiness != null) {
      // Enkel modell: 100 % moln = 0 sol, 0 % moln = 1.0
      solarIntensity = Math.max(0, Math.min(1, (100 - cloudiness) / 100));
      // Anta t.ex. 80 % effektivitet för vinkel, smuts etc.
      panelOutputFactor = Math.round(solarIntensity * 0.8 * 100) / 100;
    }

    const result = {
      city: data.name,
      temperature: temp,
      humidity,
      // 1) Isrisk
      iceRisk: {
        isRisk: iceRisk,
        level: iceRiskLevel
      },
      // 2) Vind
      wind: {
        speed: windSpeed,
        deg: windDeg,
        direction: windDirectionText
      },
      // 3) Sol & paneler
      solar: {
        sunHours,
        clouds: cloudiness,
        solarIntensity,    // 0–1
        panelOutputFactor  // 0–1
      },
      // Rådata om du vill använda mer i appen
      raw: {
        weather: data.weather,
        main: data.main,
        clouds: data.clouds,
        sys: data.sys
      }
    };

    res.json(result);
  } catch (error) {
    console.error("WEATHER-ADVANCED ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Väder via koordinater (lat/lon)
app.get("/weather-by-coords", async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon are required" });
  }

  const apiKey = process.env.OPENWEATHER_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== 200) {
      return res
        .status(500)
        .json({ error: "Failed to fetch weather by coordinates" });
    }

    res.json(data);
  } catch (error) {
    console.error("WEATHER-BY-COORDS ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Enkel test-endpoint
app.get("/hello", (req, res) => {
  res.json({ message: "Weather API is running fine" });
});

// Starta servern
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
