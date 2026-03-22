const express = require("express");
const ussdRouter = require("./routes/ussd");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/ussd", ussdRouter);

app.use((err, _req, res, _next) => {
  // Keep responses short for gateway reliability while logging root cause.
  console.error("Unhandled error:", err);
  res.status(500).send("END Service temporarily unavailable.");
});

module.exports = app;
