import { logger } from "../utils/logger.js";

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
};

// Last middleware in the chain — catches anything that reached next(err),
// threw inside an async handler, or came from a lower-level failure like the
// CORS origin check (which otherwise falls through to Express's default HTML
// error page instead of a JSON response the frontend can actually parse).
// Express identifies error-handling middleware by arity — `next` must stay
// in the signature even though it's unused.
export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const log = req.log || logger;
  log.error({ err, reqId: req.id, status }, err.message || "Unhandled error");

  res.status(status).json({
    message: status === 500 ? "Server error" : err.message || "Something went wrong",
  });
};
