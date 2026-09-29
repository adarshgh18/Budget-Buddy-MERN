const path = require("path");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const AppError = require("../utils/AppError");
const { startOfYear, endOfYear } = require("../utils/date");
const { generateDueRecurring } = require("./recurringService");

const resolveCategory = async (userId, name, type) => {
  const category = await Category.findOne({
    owner: userId,
    name,
    ...(type ? { type } : {}),
  });
  return category;
};

const applyReceipt = (req, payload) => {
  if (req.file) {
    payload.receiptUrl = `/uploads/receipts/${req.file.filename}`;
    payload.receiptOriginalName = req.file.originalname;
  }
  return payload;
};

exports.list = async (userId, query) => {
  await generateDueRecurring(userId);

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const { type, category, search, sort, year, month } = query;

  const filter = { owner: userId };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }
  if (year && year !== "all") {
    const y = Number(year);
    if (month) {
      const m = Number(month) - 1;
      filter.date = {
        $gte: new Date(y, m, 1),
        $lt: new Date(y, m + 1, 1),
      };
    } else {
      filter.date = { $gte: startOfYear(y), $lt: endOfYear(y) };
    }
  } else if (month) {
    const now = new Date();
    const m = Number(month) - 1;
    filter.date = {
      $gte: new Date(now.getFullYear(), m, 1),
      $lt: new Date(now.getFullYear(), m + 1, 1),
    };
  }

  const sortOption = {};
  if (sort === "highest") sortOption.amount = -1;
  else if (sort === "lowest") sortOption.amount = 1;
  else if (sort === "oldest") sortOption.date = 1;
  else {
    sortOption.date = -1;
    sortOption._id = -1;
  }

  const [items, total, summaryAgg] = await Promise.all([
    Transaction.find(filter).sort(sortOption).skip(skip).limit(limit),
    Transaction.countDocuments(filter),
    Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  let totalIncome = 0;
  let totalExpense = 0;
  summaryAgg.forEach((row) => {
    if (row._id === "income") totalIncome = row.total;
    if (row._id === "expense") totalExpense = row.total;
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    summary: {
      totalTransactions: total,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    },
  };
};

exports.getById = async (userId, id) => {
  const tx = await Transaction.findOne({ _id: id, owner: userId });
  if (!tx) throw new AppError(404, "Transaction not found.");
  return tx;
};

exports.getReceiptPath = async (userId, id) => {
  const tx = await Transaction.findOne({ _id: id, owner: userId });
  if (!tx) throw new AppError(404, "Transaction not found.");
  if (!tx.receiptUrl) throw new AppError(404, "This transaction has no receipt attached.");
  // receiptUrl is always server-generated (see applyReceipt) as "/uploads/receipts/<filename>",
  // but we defensively take only the basename before joining it to the receipts directory so
  // this can never be tricked into reading a file outside that folder.
  const filename = path.basename(tx.receiptUrl);
  return path.join(__dirname, "..", "uploads", "receipts", filename);
};

exports.create = async (userId, body, req) => {
  const cat = await resolveCategory(userId, body.category, body.type);
  const payload = applyReceipt(req, {
    ...body,
    owner: userId,
    categoryId: cat?._id,
  });
  return Transaction.create(payload);
};

exports.update = async (userId, id, body, req) => {
  const tx = await Transaction.findOne({ _id: id, owner: userId });
  if (!tx) throw new AppError(404, "Transaction not found.");

  const nextType = body.type || tx.type;
  const nextCategory = body.category || tx.category;
  const cat = await resolveCategory(userId, nextCategory, nextType);

  Object.assign(tx, applyReceipt(req, { ...body, categoryId: cat?._id }));
  await tx.save();
  return tx;
};

exports.remove = async (userId, id) => {
  const tx = await Transaction.findOneAndDelete({ _id: id, owner: userId });
  if (!tx) throw new AppError(404, "Transaction not found.");
  return tx;
};

exports.exportCsv = async (userId) => {
  await generateDueRecurring(userId);
  const rows = await Transaction.find({ owner: userId }).sort({ date: -1 });
  const header = [
    "Date",
    "Title",
    "Type",
    "Category",
    "Amount",
    "Payment Method",
    "Description",
  ];
  const lines = [header.join(",")];
  rows.forEach((t) => {
    const cells = [
      t.date.toISOString().slice(0, 10),
      `"${String(t.title).replace(/"/g, '""')}"`,
      t.type,
      `"${String(t.category).replace(/"/g, '""')}"`,
      t.amount,
      t.paymentMethod || "",
      `"${String(t.description || "").replace(/"/g, '""')}"`,
    ];
    lines.push(cells.join(","));
  });
  return lines.join("\n");
};
