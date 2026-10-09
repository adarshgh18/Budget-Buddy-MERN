require("dotenv").config();
// Fail fast (and clearly) on missing/insecure security configuration instead of
// crashing later mid-request. There is intentionally NO fallback JWT secret.
const missingEnv = [
  "JWT_SECRET",
  "MONGODB_URI",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
].filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(`Missing required environment variable(s): ${missingEnv.join(", ")}`);
  process.exit(1);
}
if (process.env.JWT_SECRET === "replace-with-a-long-random-secret") {
  console.error("JWT_SECRET is still the example placeholder. Set a long random secret.");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be at least 32 characters in production.");
  process.exit(1);
}

const app = require("./app");
const connectDb = require("./config/db");

const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Budget Buddy API listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server", err.message);
    process.exit(1);
  });
