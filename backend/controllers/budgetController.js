const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const service = require("../services/budgetService");

exports.index = asyncHandler(async (req, res) => {
  const data = await service.list(req.user._id, req.query);
  success(res, data);
});

exports.create = asyncHandler(async (req, res) => {
  const budget = await service.create(req.user._id, req.body);
  success(res, { budget }, 201, "Budget created.");
});

exports.update = asyncHandler(async (req, res) => {
  const budget = await service.update(req.user._id, req.params.id, req.body);
  success(res, { budget }, 200, "Budget updated.");
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.user._id, req.params.id);
  success(res, {}, 200, "Budget deleted.");
});
