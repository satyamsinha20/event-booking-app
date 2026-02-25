const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

const { connectDb } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errors");

const userRoutes = require("./routes/users");
const eventRoutes = require("./routes/events");
const ticketRoutes = require("./routes/tickets");

dotenv.config();

async function main() {
  await connectDb(process.env.MONGODB_URI);

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

  const port = Number(process.env.PORT || 4000);
  app.listen(port, "0.0.0.0", () => {
    console.log(`API listening on http://0.0.0.0:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

