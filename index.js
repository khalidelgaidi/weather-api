import express from "express";

const app = express();

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Solar endpoint (real logic)
app.get("/solar", (req, res) => {
  const { watt, hours } = req.query;

  // Validate input
  if (!watt || !hours) {
    return res.json({
      error: "Missing watt or hours",
      example: "/solar?watt=300&hours=5"
    });
  }

  const w = Number(watt);
  const h = Number(hours);

  // Basic calculation
  const energy = w * h;

  res.json({
    watt: w,
    hours: h,
    energy,
    message: "solar calculation ok"
  });
});

// Wind endpoint (placeholder)
app.get("/wind", (req, res) => {
  res.json({ message: "wind endpoint works" });
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
