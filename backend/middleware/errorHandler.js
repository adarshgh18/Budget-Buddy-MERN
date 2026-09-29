const AppError = require("../utils/AppError");

module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong.";

  if (err.name === "CastError") {
    statusCode = 404;
    message = "The requested resource was not found.";
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(" ");
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with that ${field} already exists.`;
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session is invalid or has expired. Please log in again.";
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File is too large. Maximum size is 10MB.";
  }

  const payload = {
    success: false,
    message,
  };

  if (err.details) payload.details = err.details;
  if (process.env.NODE_ENV !== "production" && statusCode === 500) {
    payload.debug = err.message;
  }

  res.status(statusCode).json(payload);
};
