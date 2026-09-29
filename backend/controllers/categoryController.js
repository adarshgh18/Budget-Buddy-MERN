const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const service = require("../services/categoryService");

exports.index = asyncHandler(async (req, res) => {
  const data = await service.list(req.user._id, req.query);
  success(res, data);
});

exports.create = asyncHandler(async (req, res) => {
  const category = await service.create(req.user._id, req.body);
  success(res, { category }, 201, "Category created.");
});

exports.update = asyncHandler(async (req, res) => {
  const category = await service.update(req.user._id, req.params.id, req.body);
  success(res, { category }, 200, "Category updated.");
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await service.remove(req.user._id, req.params.id, req.body.reassignTo);
  success(res, result, 200, "Category deleted.");
});
