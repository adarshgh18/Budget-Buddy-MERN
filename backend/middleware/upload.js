const path = require("path");
const multer = require("multer");
const AppError = require("../utils/AppError");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads", "receipts"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

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
