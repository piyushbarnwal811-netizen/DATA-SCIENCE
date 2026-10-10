export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  console.error(error);
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue ?? {})[0] ?? "field";
    return res.status(409).json({ message: `An account with this ${field} already exists.` });
  }
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }
  if (error.name === "MulterError") {
    return res.status(400).json({ message: error.message });
  }
  const status = error.statusCode ?? 500;
  return res.status(status).json({
    message: status >= 500 ? "Something went wrong. Please try again." : error.message
  });
}