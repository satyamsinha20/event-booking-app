function notFound(_req, res) {
  res.status(404).json({ message: "Not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  const isZod = err && (err.name === "ZodError" || err.constructor?.name === "ZodError");
  const status = Number((isZod ? 400 : undefined) || err.statusCode || err.status || 500);
  const message =
    status >= 500 ? "Internal server error" : err.message || "Request failed";

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({
    message,
    ...(isZod ? { issues: err.issues } : {}),
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };

