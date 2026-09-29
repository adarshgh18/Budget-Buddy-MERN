const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    amount: { type: Number, required: true, min: 0.01 },
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, required: true },
  },
  { timestamps: true }
);

budgetSchema.index({ owner: 1, year: 1, month: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
