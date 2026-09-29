const Joi = require("joi");
const { PAYMENT_METHODS, FREQUENCIES } = require("../utils/constants");

const register = Joi.object({
  fullName: Joi.string().allow("").max(80),
  username: Joi.string().alphanum().min(3).max(32).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(72).required(),
});

const login = Joi.object({
  username: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().required(),
}).or("username", "email");

const updateProfile = Joi.object({
  fullName: Joi.string().allow("").max(80),
  username: Joi.string().alphanum().min(3).max(32),
  email: Joi.string().email(),
  preferences: Joi.object({
    currency: Joi.string().max(8),
    dateFormat: Joi.string().max(32),
    theme: Joi.string().valid("light", "dark", "system"),
  }),
  notifications: Joi.object({
    budgetAlerts: Joi.boolean(),
    largeTransactionAlerts: Joi.boolean(),
  }),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(72).required(),
});

const transaction = Joi.object({
  title: Joi.string().trim().min(1).max(120).required(),
  amount: Joi.number().positive().required(),
  type: Joi.string().valid("income", "expense").required(),
  category: Joi.string().trim().min(1).max(60).required(),
  date: Joi.date().required(),
  paymentMethod: Joi.string().valid(...PAYMENT_METHODS),
  description: Joi.string().allow("").max(250),
});

const transactionUpdate = transaction.fork(
  ["title", "amount", "type", "category", "date"],
  (schema) => schema.optional()
);

const category = Joi.object({
  name: Joi.string().trim().min(1).max(60).required(),
  type: Joi.string().valid("income", "expense").required(),
  icon: Joi.string().allow("").max(40),
  color: Joi.string().allow("").max(20),
});

const categoryUpdate = category.fork(["name", "type"], (schema) => schema.optional());

const budget = Joi.object({
  category: Joi.string().trim().min(1).max(60).required(),
  amount: Joi.number().positive().required(),
  month: Joi.number().integer().min(1).max(12),
  year: Joi.number().integer().min(2000).max(2100),
});

const budgetUpdate = Joi.object({
  category: Joi.string().trim().min(1).max(60),
  amount: Joi.number().positive(),
  month: Joi.number().integer().min(1).max(12),
  year: Joi.number().integer().min(2000).max(2100),
});

const goal = Joi.object({
  name: Joi.string().trim().min(1).max(80).required(),
  targetAmount: Joi.number().positive().required(),
  currentAmount: Joi.number().min(0),
  targetDate: Joi.date().allow(null),
  icon: Joi.string().allow("").max(40),
  notes: Joi.string().allow("").max(250),
});

const goalUpdate = Joi.object({
  name: Joi.string().trim().min(1).max(80),
  targetAmount: Joi.number().positive(),
  currentAmount: Joi.number().min(0),
  targetDate: Joi.date().allow(null),
  icon: Joi.string().allow("").max(40),
  notes: Joi.string().allow("").max(250),
  contribution: Joi.number().positive(),
});

const recurring = Joi.object({
  title: Joi.string().trim().min(1).max(120).required(),
  amount: Joi.number().positive().required(),
  type: Joi.string().valid("income", "expense").required(),
  category: Joi.string().trim().min(1).max(60).required(),
  paymentMethod: Joi.string().valid(...PAYMENT_METHODS),
  description: Joi.string().allow("").max(250),
  frequency: Joi.string().valid(...FREQUENCIES).required(),
  startDate: Joi.date().required(),
  isActive: Joi.boolean(),
});

const recurringUpdate = recurring.fork(
  ["title", "amount", "type", "category", "frequency", "startDate"],
  (schema) => schema.optional()
);

module.exports = {
  register,
  login,
  updateProfile,
  changePassword,
  transaction,
  transactionUpdate,
  category,
  categoryUpdate,
  budget,
  budgetUpdate,
  goal,
  goalUpdate,
  recurring,
  recurringUpdate,
};
