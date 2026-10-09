const mongoose = require("mongoose");
const { PAYMENT_METHODS } = require("../utils/constants");

const transactionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true, trim: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    date: { type: Date, required: true },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "other",
    },
    description: { type: String, trim: true, default: "", maxlength: 250 },
    receiptUrl: { type: String, default: "" },
    receiptOriginalName: { type: String, default: "" },
    // Cloudinary public_id for receipts uploaded after the Cloudinary migration.
    // Used to generate a fresh signed delivery URL on each authenticated,
    // ownership-checked /receipt request (see transactionService.getReceiptAccess).
    // Empty for transactions whose receipt predates this migration - those fall
    // back to the legacy local-path handling in receiptUrl.
    receiptPublicId: { type: String, default: "" },
    // Cloudinary's public_id excludes the file extension; the format (e.g.
    // "jpg", "pdf") returned by the upload is needed to reconstruct a
    // correct signed delivery URL later.
    receiptFormat: { type: String, default: "" },
    recurringId: { type: mongoose.Schema.Types.ObjectId, ref: "RecurringTransaction" },
  },
  { timestamps: true }
);

transactionSchema.index({ owner: 1, date: -1 });
transactionSchema.index({ owner: 1, type: 1, date: -1 });
transactionSchema.index({ owner: 1, category: 1 });
transactionSchema.index({ owner: 1, title: "text" });

module.exports = mongoose.model("Transaction", transactionSchema);
