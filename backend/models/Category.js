const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    icon: { type: String, default: "tag" },
    color: { type: String, default: "#2563EB" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

categorySchema.index({ owner: 1, type: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
