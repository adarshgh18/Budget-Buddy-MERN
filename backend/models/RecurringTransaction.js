const mongoose = require("mongoose");
const { FREQUENCIES, PAYMENT_METHODS } = require("../utils/constants");

const recurringSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "other" },
    description: { type: String, default: "", maxlength: 250 },
    frequency: { type: String, enum: FREQUENCIES, required: true },
    startDate: { type: Date, required: true },
    nextRunAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

recurringSchema.index({ owner: 1, isActive: 1, nextRunAt: 1 });

module.exports = mongoose.model("RecurringTransaction", recurringSchema);
