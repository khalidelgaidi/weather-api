import express from "express";

const app = express();

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Solar endpoint (real logic)
app.get("/solar", (req, res) => {
  const { watt, hours } = req.query;

  if (!watt || !hours) {
    return res.json({
      error: "Missing watt or hours",
      example: "/solar?watt=300&hours=5"
    });
  }

  const w = Number(watt);
  const h = Number(hours);
  const energy = w * h;

  res.json({
    watt: w,
    hours: h,
    energy,
    message: "solar calculation ok"
  });
});

// Wind endpoint (simple logic)
app.get("/wind", (req, res) => {
  const { speed, area } = req.query;

  if (!speed || !area) {
    return res.json({
      error: "Missing speed or area",
      example: "/wind?speed=5&area=3"
    });
  }

  const v = Number(speed);
  const a = Number(area);

  // Simple wind power formula
  const power = 0.5 * a * Math.pow(v, 3);

  res.json({
    speed: v,
    area: a,
    power,
    message: "wind calculation ok"
  });
});

// Total endpoint (placeholder)
app.get("/total", (req, res) => {
  res.json({ message: "total endpoint works" });
});

// Port (Railway uses process.env.PORT)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
