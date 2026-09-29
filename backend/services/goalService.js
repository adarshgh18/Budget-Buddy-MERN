const Goal = require("../models/Goal");
const AppError = require("../utils/AppError");

const decorate = (goal) => {
  const obj = goal.toObject();
  const percent = obj.targetAmount > 0 ? (obj.currentAmount / obj.targetAmount) * 100 : 0;
  const remaining = Math.max(0, obj.targetAmount - obj.currentAmount);
  let pace = "on_track";
  if (obj.status === "completed" || percent >= 100) pace = "completed";
  else if (percent >= 80) pace = "almost";
  return {
    ...obj,
    percent: Math.round(percent * 10) / 10,
    remaining,
    pace,
  };
};

exports.list = async (userId) => {
  const goals = await Goal.find({ owner: userId }).sort({ createdAt: -1 });
  const items = goals.map(decorate);
  const active = items.filter((g) => g.status === "active");
  const totalTarget = items.reduce((s, g) => s + g.targetAmount, 0);
  const saved = items.reduce((s, g) => s + g.currentAmount, 0);
  return {
    summary: {
      activeGoals: active.length,
      completedGoals: items.filter((g) => g.status === "completed").length,
      totalTarget,
      savedSoFar: saved,
      overallProgress: totalTarget > 0 ? Math.round((saved / totalTarget) * 1000) / 10 : 0,
    },
    items,
  };
};

exports.create = async (userId, body) => {
  const currentAmount = body.currentAmount || 0;
  const status = currentAmount >= body.targetAmount ? "completed" : "active";
  return Goal.create({ ...body, currentAmount, status, owner: userId });
};

exports.update = async (userId, id, body) => {
  const goal = await Goal.findOne({ _id: id, owner: userId });
  if (!goal) throw new AppError(404, "Goal not found.");

  if (body.contribution) {
    goal.currentAmount += body.contribution;
  }
  Object.assign(goal, {
    ...body,
    contribution: undefined,
  });
  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = "completed";
    goal.currentAmount = goal.targetAmount;
  } else {
    goal.status = "active";
  }
  await goal.save();
  return decorate(goal);
};

exports.remove = async (userId, id) => {
  const goal = await Goal.findOneAndDelete({ _id: id, owner: userId });
  if (!goal) throw new AppError(404, "Goal not found.");
  return goal;
};
