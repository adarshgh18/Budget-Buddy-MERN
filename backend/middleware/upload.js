const multer = require("multer");
const AppError = require("../utils/AppError");

// Receipts are uploaded to Cloudinary (see services/transactionService.js),
// not written to local disk - memoryStorage hands the file bytes to the
// route handler as req.file.buffer instead of saving them to this server's
// (ephemeral, on Render) filesystem.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new AppError(400, "Receipt must be a PDF, PNG, JPG, or WEBP file."));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
