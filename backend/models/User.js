const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: "" },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, select: false },
    preferences: {
      currency: { type: String, default: "USD" },
      dateFormat: { type: String, default: "MMM d, yyyy" },
      theme: { type: String, enum: ["light", "dark", "system"], default: "light" },
    },
    notifications: {
      budgetAlerts: { type: Boolean, default: true },
      largeTransactionAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

module.exports = mongoose.model("User", userSchema);
