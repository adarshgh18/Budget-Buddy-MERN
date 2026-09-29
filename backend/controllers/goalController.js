const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const service = require("../services/goalService");

exports.index = asyncHandler(async (req, res) => {
  const data = await service.list(req.user._id);
  success(res, data);
});

exports.create = asyncHandler(async (req, res) => {
  const goal = await service.create(req.user._id, req.body);
  success(res, { goal }, 201, "Goal created.");
});

exports.update = asyncHandler(async (req, res) => {
  const goal = await service.update(req.user._id, req.params.id, req.body);
  success(res, { goal }, 200, "Goal updated.");
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.user._id, req.params.id);
  success(res, {}, 200, "Goal deleted.");
});
