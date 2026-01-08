import express from "express";

const app = express();

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Solar endpoint
app.get("/solar", (req, res) => {
  res.json({ message: "solar endpoint works" });
});

// Wind endpoint
app.get("/wind", (req, res) => {
  res.json({ message: "wind endpoint works" });
});

// Total endpoint
app.get("/total", (req, res) => {
  res.json({ message: "total endpoint works" });
});

// Port (Railway uses process.env.PORT)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
