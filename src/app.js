const express = require("express");
const ussdRouter = require("./routes/ussd");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/ussd", (req, _res, next) => {
  // #region agent log
  fetch("http://127.0.0.1:7823/ingest/ea59d108-0aa6-41c6-94f2-3101e6c1c433", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "59f53b",
    },
    body: JSON.stringify({
      sessionId: "59f53b",
      runId: "pre-fix-1",
      hypothesisId: "H1_H3",
      location: "src/app.js:9",
      message: "USSD request observed",
      data: {
        method: req.method,
        path: req.path,
        contentType: req.headers["content-type"] || null,
        bodyKeys: req.body ? Object.keys(req.body) : [],
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  next();
});

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
