const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const AppError = require("../utils/AppError");
const { daysRemainingInMonth } = require("../utils/date");

const period = (query) => {
  const now = new Date();
  const year = Number(query.year) || now.getFullYear();
  const month = Number(query.month) || now.getMonth() + 1;
  return { year, month };
};

const spentMap = async (userId, year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const rows = await Transaction.aggregate([
    {
      $match: {
        owner: userId,
        type: "expense",
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: "$category", spent: { $sum: "$amount" } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.spent]));
};

const decorate = (budget, spent) => {
  const used = spent || 0;
  const remaining = budget.amount - used;
  const percent = budget.amount > 0 ? (used / budget.amount) * 100 : 0;
  let status = "on_track";
  if (percent >= 100) status = "over";
  else if (percent >= 80) status = "near";
  return {
    ...budget.toObject(),
    spent: used,
    remaining,
    percentUsed: Math.round(percent * 10) / 10,
    status,
  };
};

exports.list = async (userId, query) => {
  const { year, month } = period(query);
  const budgets = await Budget.find({ owner: userId, year, month }).sort({ category: 1 });
  const spent = await spentMap(userId, year, month);
  const items = budgets.map((b) => decorate(b, spent[b.category] || 0));

  const totalBudget = items.reduce((s, b) => s + b.amount, 0);
  const totalSpent = items.reduce((s, b) => s + b.spent, 0);
  const remaining = totalBudget - totalSpent;
  const overallUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return {
    period: { year, month, daysRemaining: daysRemainingInMonth() },
    summary: {
      totalBudget,
      totalSpent,
      remaining,
      overallUsage: Math.round(overallUsage * 10) / 10,
      count: items.length,
      onTrack: items.filter((i) => i.status === "on_track").length,
      near: items.filter((i) => i.status === "near").length,
      over: items.filter((i) => i.status === "over").length,
    },
    items,
  };
};

exports.create = async (userId, body) => {
  const now = new Date();
  const month = body.month || now.getMonth() + 1;
  const year = body.year || now.getFullYear();
  const cat = await Category.findOne({ owner: userId, name: body.category, type: "expense" });

  try {
    return await Budget.create({
      owner: userId,
      category: body.category,
      categoryId: cat?._id,
      amount: body.amount,
      month,
      year,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(409, "A budget for this category already exists in that month.");
    }
    throw err;
  }
};

exports.update = async (userId, id, body) => {
  const budget = await Budget.findOne({ _id: id, owner: userId });
  if (!budget) throw new AppError(404, "Budget not found.");
  if (body.category) {
    const cat = await Category.findOne({ owner: userId, name: body.category, type: "expense" });
    budget.categoryId = cat?._id;
  }
  Object.assign(budget, body);
  await budget.save();
  return budget;
};

exports.remove = async (userId, id) => {
  const budget = await Budget.findOneAndDelete({ _id: id, owner: userId });
  if (!budget) throw new AppError(404, "Budget not found.");
  return budget;
};
