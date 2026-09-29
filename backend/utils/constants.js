exports.PAYMENT_METHODS = [
  "cash",
  "debit_card",
  "credit_card",
  "bank_transfer",
  "upi",
  "other",
];

exports.DEFAULT_CATEGORIES = [
  { name: "Food & Dining", type: "expense", icon: "utensils", color: "#F59E0B", isDefault: true },
  { name: "Housing", type: "expense", icon: "home", color: "#6366F1", isDefault: true },
  { name: "Transportation", type: "expense", icon: "car", color: "#3B82F6", isDefault: true },
  { name: "Entertainment", type: "expense", icon: "ticket", color: "#A855F7", isDefault: true },
  { name: "Utilities", type: "expense", icon: "zap", color: "#F59E0B", isDefault: true },
  { name: "Shopping", type: "expense", icon: "bag", color: "#EC4899", isDefault: true },
  { name: "Health & Fitness", type: "expense", icon: "heart", color: "#10B981", isDefault: true },
  { name: "Travel", type: "expense", icon: "plane", color: "#0EA5E9", isDefault: true },
  { name: "Other Expense", type: "expense", icon: "more", color: "#64748B", isDefault: true },
  { name: "Salary", type: "income", icon: "wallet", color: "#10B981", isDefault: true },
  { name: "Freelance", type: "income", icon: "briefcase", color: "#14B8A6", isDefault: true },
  { name: "Other Income", type: "income", icon: "plus", color: "#22C55E", isDefault: true },
];

exports.FREQUENCIES = ["daily", "weekly", "monthly", "yearly"];
