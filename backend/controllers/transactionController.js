const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const service = require("../services/transactionService");

exports.index = asyncHandler(async (req, res) => {
  const data = await service.list(req.user._id, req.query);
  success(res, data);
});

exports.show = asyncHandler(async (req, res) => {
  const transaction = await service.getById(req.user._id, req.params.id);
  success(res, { transaction });
});

exports.create = asyncHandler(async (req, res) => {
  const transaction = await service.create(req.user._id, req.body, req);
  success(res, { transaction }, 201, "Transaction added.");
});

exports.update = asyncHandler(async (req, res) => {
  const transaction = await service.update(req.user._id, req.params.id, req.body, req);
  success(res, { transaction }, 200, "Transaction updated.");
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.user._id, req.params.id);
  success(res, {}, 200, "Transaction deleted.");
});

exports.receipt = asyncHandler(async (req, res) => {
  const access = await service.getReceiptAccess(req.user._id, req.params.id);
  if (access.type === "redirect") {
    return res.redirect(access.url);
  }
  res.sendFile(access.path);
});

exports.exportCsv = asyncHandler(async (req, res) => {
  const csv = await service.exportCsv(req.user._id);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=budget-buddy-transactions.csv");
  res.status(200).send(csv);
});
