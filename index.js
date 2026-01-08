// Total endpoint (simple combined logic)
app.get("/total", (req, res) => {
  const { watt, hours, speed, area } = req.query;

  // Validate all parameters
  if (!watt || !hours || !speed || !area) {
    return res.json({
      error: "Missing one or more parameters",
      required: ["watt", "hours", "speed", "area"],
      example: "/total?watt=300&hours=5&speed=5&area=3"
    });
  }

  // Convert to numbers
  const w = Number(watt);
  const h = Number(hours);
  const v = Number(speed);
  const a = Number(area);

  // Solar energy
  const solarEnergy = w * h;

  // Wind power (simple formula)
  const windPower = 0.5 * a * Math.pow(v, 3);

  // Total
  const totalEnergy = solarEnergy + windPower;

  res.json({
    solar: {
      watt: w,
      hours: h,
      energy: solarEnergy
    },
    wind: {
      speed: v,
      area: a,
      power: windPower
    },
    total: totalEnergy,
    message: "total calculation ok"
  });
});
