const fs = require("fs");
const path = require("path");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const AppError = require("../utils/AppError");
const { startOfYear, endOfYear } = require("../utils/date");
const { generateDueRecurring } = require("./recurringService");
const { cloudinary, RECEIPT_FOLDER } = require("../config/cloudinary");

const resolveCategory = async (userId, name, type) => {
  const category = await Category.findOne({
    owner: userId,
    name,
    ...(type ? { type } : {}),
  });
  return category;
};

// Uploads a receipt buffer (multer memoryStorage - see middleware/upload.js)
// to Cloudinary under Budget-Buddy/receipts. Uses the "authenticated"
// delivery type rather than the default public "upload" type: an
// authenticated asset cannot be fetched from Cloudinary by URL alone, only
// via a signed URL, which this app only ever generates after its own
// auth + ownership check passes (see getReceiptAccess below). This preserves
// the existing "receipts are not publicly accessible" security property
// instead of just relocating the files to a different public host.
const uploadReceiptBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: RECEIPT_FOLDER,
        resource_type: "image", // Cloudinary serves JPG/PNG/WEBP and PDF alike under "image"
        type: "authenticated",
        unique_filename: true,
        overwrite: false,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

const applyReceipt = async (req, payload) => {
  if (req.file) {
    const result = await uploadReceiptBuffer(req.file.buffer);
    payload.receiptPublicId = result.public_id;
    payload.receiptFormat = result.format;
    // Not used for actual retrieval (that always goes through the signed,
    // ownership-checked /receipt endpoint) - kept populated for visibility/
    // debugging, same field earlier local uploads used for their path.
    payload.receiptUrl = result.secure_url;
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

// Returns how the controller should serve this transaction's receipt:
//   { type: "redirect", url }  - new Cloudinary-backed receipts (the normal case
//                                 going forward)
//   { type: "file", path }    - legacy receipts uploaded before this migration,
//                                 still stored under backend/uploads/receipts
// Ownership is verified here, before either URL/path is produced, exactly as
// the previous local-disk-only implementation did.
exports.getReceiptAccess = async (userId, id) => {
  const tx = await Transaction.findOne({ _id: id, owner: userId });
  if (!tx) throw new AppError(404, "Transaction not found.");
  if (!tx.receiptPublicId && !tx.receiptUrl) {
    throw new AppError(404, "This transaction has no receipt attached.");
  }

  if (tx.receiptPublicId) {
    // NOTE: plain cloudinary.url({ type: "authenticated", sign_url: true, expires_at })
    // does NOT actually expire - expires_at is silently ignored there; it only produces
    // a deterministic, non-expiring path signature. private_download_url is Cloudinary's
    // real mechanism for a genuinely time-limited signed URL (enforced server-side).
    const url = cloudinary.utils.private_download_url(tx.receiptPublicId, tx.receiptFormat || undefined, {
      resource_type: "image",
      type: "authenticated",
      attachment: false, // inline viewing (matches the existing "open in a new tab" behavior, not a forced download)
      // Freshly generated on every request, so a 5-minute window is plenty
      // for the browser tab this is opened in to actually load the file.
      expires_at: Math.floor(Date.now() / 1000) + 300,
    });
    return { type: "redirect", url };
  }

  // Legacy path: receiptUrl is a server-generated "/uploads/receipts/<filename>"
  // from before this migration. We defensively take only the basename before
  // joining it to the receipts directory so this can never be tricked into
  // reading a file outside that folder. That folder is NOT persisted on
  // Render (ephemeral filesystem), so this only succeeds where the original
  // local file still happens to exist (e.g. local dev).
  const filename = path.basename(tx.receiptUrl);
  const filePath = path.join(__dirname, "..", "uploads", "receipts", filename);
  if (!fs.existsSync(filePath)) {
    throw new AppError(
      404,
      "This receipt was uploaded before Cloudinary storage was enabled and is no longer available."
    );
  }
  return { type: "file", path: filePath };
};

exports.create = async (userId, body, req) => {
  const cat = await resolveCategory(userId, body.category, body.type);
  const payload = await applyReceipt(req, {
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

  Object.assign(tx, await applyReceipt(req, { ...body, categoryId: cat?._id }));
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
