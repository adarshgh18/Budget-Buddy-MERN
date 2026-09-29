const RecurringTransaction = require("../models/RecurringTransaction");
const Category = require("../models/Category");
const AppError = require("../utils/AppError");
const { addFrequency } = require("../utils/date");
const { generateDueRecurring, monthlyEquivalent } = require("./recurringService");

const daysUntil = (date) => Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));

exports.list = async (userId) => {
  await generateDueRecurring(userId);
  const items = await RecurringTransaction.find({ owner: userId }).sort({ nextRunAt: 1 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const active = items.filter((i) => i.isActive);
  const monthlyAmount = active.reduce((s, i) => {
    const signed = i.type === "expense" ? i.amount : -i.amount;
    return s + monthlyEquivalent(signed, i.frequency);
  }, 0);

  const upcoming = active
    .filter((i) => daysUntil(i.nextRunAt) <= 14)
    .map((i) => ({
      ...i.toObject(),
      daysUntil: daysUntil(i.nextRunAt),
    }));

  const thisMonthDue = active.filter(
    (i) => i.nextRunAt >= monthStart && i.nextRunAt < monthEnd
  );
  const thisMonthAmount = thisMonthDue.reduce(
    (s, i) => s + (i.type === "expense" ? i.amount : 0),
    0
  );

  return {
    summary: {
      activeCount: active.length,
      pausedCount: items.filter((i) => !i.isActive).length,
      monthlyAmount: Math.round(monthlyAmount * 100) / 100,
      upcomingCount: upcoming.length,
      thisMonthAmount,
    },
    upcoming,
    items,
  };
};

exports.create = async (userId, body) => {
  const cat = await Category.findOne({ owner: userId, name: body.category, type: body.type });
  return RecurringTransaction.create({
    ...body,
    owner: userId,
    categoryId: cat?._id,
    nextRunAt: body.startDate,
    isActive: body.isActive !== false,
  });
};

exports.update = async (userId, id, body) => {
  const item = await RecurringTransaction.findOne({ _id: id, owner: userId });
  if (!item) throw new AppError(404, "Recurring transaction not found.");

  if (body.category || body.type) {
    const cat = await Category.findOne({
      owner: userId,
      name: body.category || item.category,
      type: body.type || item.type,
    });
    item.categoryId = cat?._id;
  }
  if (body.startDate && !body.nextRunAt) {
    body.nextRunAt = body.startDate;
  }
  Object.assign(item, body);
  await item.save();
  return item;
};

exports.remove = async (userId, id) => {
  const item = await RecurringTransaction.findOneAndDelete({ _id: id, owner: userId });
  if (!item) throw new AppError(404, "Recurring transaction not found.");
  return item;
};

exports.advanceNext = addFrequency;
