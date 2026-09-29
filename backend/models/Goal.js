const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 0.01 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date },
    icon: { type: String, default: "flag" },
    notes: { type: String, default: "", trim: true },
    status: { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true }
);

goalSchema.index({ owner: 1, status: 1 });

module.exports = mongoose.model("Goal", goalSchema);
