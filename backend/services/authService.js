const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Category = require("../models/Category");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");
const RecurringTransaction = require("../models/RecurringTransaction");
const AppError = require("../utils/AppError");
const { DEFAULT_CATEGORIES } = require("../utils/constants");

const cookieName = () => process.env.COOKIE_NAME || "bb_token";

exports.signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

exports.setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(cookieName(), token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

exports.clearAuthCookie = (res) => {
  res.clearCookie(cookieName(), {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
};

exports.publicUser = (user) => ({
  id: user._id,
  fullName: user.fullName || "",
  username: user.username,
  email: user.email,
  preferences: user.preferences,
  notifications: user.notifications,
  createdAt: user.createdAt,
});

exports.seedDefaultCategories = async (userId) => {
  const docs = DEFAULT_CATEGORIES.map((c) => ({ ...c, owner: userId }));
  await Category.insertMany(docs);
};

exports.register = async (payload) => {
  const existing = await User.findOne({
    $or: [{ email: payload.email.toLowerCase() }, { username: payload.username.toLowerCase() }],
  });
  if (existing) {
    if (existing.email === payload.email.toLowerCase()) {
      throw new AppError(409, "An account with that email already exists.");
    }
    throw new AppError(409, "Username already exists. Please choose another.");
  }

  const hashed = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    fullName: payload.fullName || "",
    username: payload.username.toLowerCase(),
    email: payload.email.toLowerCase(),
    password: hashed,
  });

  await exports.seedDefaultCategories(user._id);
  return user;
};

exports.login = async ({ username, email, password }) => {
  const query = email
    ? { email: email.toLowerCase() }
    : { username: username.toLowerCase() };

  const user = await User.findOne(query).select("+password");
  if (!user) {
    throw new AppError(401, "Invalid credentials.");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError(401, "Invalid credentials.");
  }

  return user;
};

exports.updateProfile = async (userId, payload) => {
  const updates = {};
  if (payload.fullName !== undefined) updates.fullName = payload.fullName;
  if (payload.username) updates.username = payload.username.toLowerCase();
  if (payload.email) updates.email = payload.email.toLowerCase();
  if (payload.preferences) {
    Object.entries(payload.preferences).forEach(([k, v]) => {
      updates[`preferences.${k}`] = v;
    });
  }
  if (payload.notifications) {
    Object.entries(payload.notifications).forEach(([k, v]) => {
      updates[`notifications.${k}`] = v;
    });
  }

  try {
    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });
    return user;
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(409, "Username or email is already in use.");
    }
    throw err;
  }
};

exports.changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    throw new AppError(400, "Current password is incorrect.");
  }
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
};

exports.deleteAccount = async (userId) => {
  await Promise.all([
    Transaction.deleteMany({ owner: userId }),
    Budget.deleteMany({ owner: userId }),
    Goal.deleteMany({ owner: userId }),
    RecurringTransaction.deleteMany({ owner: userId }),
    Category.deleteMany({ owner: userId }),
    User.findByIdAndDelete(userId),
  ]);
};
