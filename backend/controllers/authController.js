const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const authService = require("../services/authService");

exports.register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  const token = authService.signToken(user._id);
  authService.setAuthCookie(res, token);
  success(res, { user: authService.publicUser(user) }, 201, "Account created.");
});

exports.login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  const token = authService.signToken(user._id);
  authService.setAuthCookie(res, token);
  success(res, { user: authService.publicUser(user) }, 200, "Logged in.");
});

exports.logout = asyncHandler(async (req, res) => {
  authService.clearAuthCookie(res);
  success(res, {}, 200, "Logged out.");
});

exports.me = asyncHandler(async (req, res) => {
  success(res, { user: authService.publicUser(req.user) });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  success(res, { user: authService.publicUser(user) }, 200, "Profile updated.");
});

exports.changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
  success(res, {}, 200, "Password updated.");
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  await authService.deleteAccount(req.user._id);
  authService.clearAuthCookie(res);
  success(res, {}, 200, "Account deleted.");
});
