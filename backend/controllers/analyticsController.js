const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const service = require("../services/analyticsService");

exports.dashboard = asyncHandler(async (req, res) => {
  const data = await service.getDashboard(req.user._id);
  success(res, data);
});

exports.analytics = asyncHandler(async (req, res) => {
  const data = await service.getAnalytics(req.user._id, req.query);
  success(res, data);
});

exports.insights = asyncHandler(async (req, res) => {
  const data = await service.getInsights(req.user._id, req.user.notifications);
  success(res, data);
});
