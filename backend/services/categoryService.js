const Category = require("../models/Category");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const RecurringTransaction = require("../models/RecurringTransaction");
const AppError = require("../utils/AppError");
const { startOfMonth, endOfMonth } = require("../utils/date");

exports.list = async (userId, query = {}) => {
  const filter = { owner: userId };
  if (query.type) filter.type = query.type;
  if (query.search) filter.name = { $regex: query.search, $options: "i" };
  if (query.isDefault === "true") filter.isDefault = true;
  if (query.isDefault === "false") filter.isDefault = false;

  const categories = await Category.find(filter).sort({ type: 1, name: 1 });

  const now = new Date();
  const monthMatch = {
    owner: userId,
    date: { $gte: startOfMonth(now), $lte: endOfMonth(now) },
  };

  const usage = await Transaction.aggregate([
    { $match: monthMatch },
    {
      $group: {
        _id: "$category",
        amount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);
  const usageMap = Object.fromEntries(
    usage.map((u) => [u._id, { amount: u.amount, count: u.count }])
  );

  const items = categories.map((c) => ({
    ...c.toObject(),
    monthAmount: usageMap[c.name]?.amount || 0,
    monthCount: usageMap[c.name]?.count || 0,
  }));

  return {
    items,
    summary: {
      total: categories.length,
      expense: categories.filter((c) => c.type === "expense").length,
      income: categories.filter((c) => c.type === "income").length,
      defaults: categories.filter((c) => c.isDefault).length,
      custom: categories.filter((c) => !c.isDefault).length,
    },
  };
};

exports.create = async (userId, body) => {
  const exists = await Category.findOne({
    owner: userId,
    name: body.name,
    type: body.type,
  });
  if (exists) throw new AppError(409, "A category with that name already exists.");
  return Category.create({ ...body, owner: userId, isDefault: false });
};

exports.update = async (userId, id, body) => {
  const category = await Category.findOne({ _id: id, owner: userId });
  if (!category) throw new AppError(404, "Category not found.");

  const prevName = category.name;
  Object.assign(category, body);
  await category.save();

  if (body.name && body.name !== prevName) {
    await Promise.all([
      Transaction.updateMany({ owner: userId, category: prevName }, { category: body.name, categoryId: category._id }),
      Budget.updateMany({ owner: userId, category: prevName }, { category: body.name, categoryId: category._id }),
      RecurringTransaction.updateMany(
        { owner: userId, category: prevName },
        { category: body.name, categoryId: category._id }
      ),
    ]);
  }
  return category;
};

exports.remove = async (userId, id, reassignTo) => {
  const category = await Category.findOne({ _id: id, owner: userId });
  if (!category) throw new AppError(404, "Category not found.");

  const inUse = await Transaction.countDocuments({
    owner: userId,
    category: category.name,
  });

  if (inUse > 0) {
    if (!reassignTo) {
      throw new AppError(
        400,
        "This category has transactions. Provide reassignTo with another category id."
      );
    }
    const target = await Category.findOne({ _id: reassignTo, owner: userId });
    if (!target) throw new AppError(404, "Reassignment category not found.");
    if (target.type !== category.type) {
      throw new AppError(400, "Reassignment category must be the same type.");
    }

    await Promise.all([
      Transaction.updateMany(
        { owner: userId, category: category.name },
        { category: target.name, categoryId: target._id }
      ),
      Budget.updateMany(
        { owner: userId, category: category.name },
        { category: target.name, categoryId: target._id }
      ),
      RecurringTransaction.updateMany(
        { owner: userId, category: category.name },
        { category: target.name, categoryId: target._id }
      ),
    ]);
  }

  await category.deleteOne();
  return { deleted: true, reassigned: inUse };
};
