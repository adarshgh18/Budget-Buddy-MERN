const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const service = require("../services/recurringCrudService");

exports.index = asyncHandler(async (req, res) => {
  const data = await service.list(req.user._id);
  success(res, data);
});

exports.create = asyncHandler(async (req, res) => {
  const recurring = await service.create(req.user._id, req.body);
  success(res, { recurring }, 201, "Recurring transaction created.");
});

exports.update = asyncHandler(async (req, res) => {
  const recurring = await service.update(req.user._id, req.params.id, req.body);
  success(res, { recurring }, 200, "Recurring transaction updated.");
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.user._id, req.params.id);
  success(res, {}, 200, "Recurring transaction deleted.");
});
