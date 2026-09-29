const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

exports.protect = asyncHandler(async (req, res, next) => {
  const cookieName = process.env.COOKIE_NAME || "bb_token";
  let token = req.cookies?.[cookieName];

  const authHeader = req.headers.authorization;
  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    throw new AppError(401, "Please log in to continue.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError(401, "Your session is invalid or has expired. Please log in again.");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError(401, "User no longer exists.");
  }

  req.user = user;
  next();
});
