const RecurringTransaction = require("../models/RecurringTransaction");
const Transaction = require("../models/Transaction");
const { addFrequency } = require("../utils/date");

/**
 * On-demand generation: create any due occurrences when the user hits the API.
 * This is not a background bank feed.
 */
exports.generateDueRecurring = async (userId) => {
  const now = new Date();
  const due = await RecurringTransaction.find({
    owner: userId,
    isActive: true,
    nextRunAt: { $lte: now },
  });

  for (const item of due) {
    let guard = 0;
    while (item.nextRunAt <= now && guard < 36) {
      await Transaction.create({
        owner: userId,
        title: item.title,
        amount: item.amount,
        type: item.type,
        category: item.category,
        categoryId: item.categoryId,
        date: item.nextRunAt,
        paymentMethod: item.paymentMethod,
        description: item.description,
        recurringId: item._id,
      });
      item.nextRunAt = addFrequency(item.nextRunAt, item.frequency);
      guard += 1;
    }
    await item.save();
  }
};

exports.monthlyEquivalent = (amount, frequency) => {
  if (frequency === "daily") return amount * 30;
  if (frequency === "weekly") return (amount * 52) / 12;
  if (frequency === "yearly") return amount / 12;
  return amount;
};
