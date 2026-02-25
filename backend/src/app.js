const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { notFound, errorHandler } = require("./middleware/errors");
const userRoutes = require("./routes/users");
const eventRoutes = require("./routes/events");
const ticketRoutes = require("./routes/tickets");

function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (allowedOrigins.length === 0) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error("CORS: origin not allowed"));
      },
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/users", userRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/tickets", ticketRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

