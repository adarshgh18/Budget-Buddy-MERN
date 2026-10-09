const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// All Budget Buddy receipt assets live under this folder so they stay
// namespaced away from any other asset (e.g. unrelated WanderLust assets)
// already in the same Cloudinary account.
const RECEIPT_FOLDER = "Budget-Buddy/receipts";

module.exports = { cloudinary, RECEIPT_FOLDER };

