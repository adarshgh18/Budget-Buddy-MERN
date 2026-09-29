const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const AppError = require("./utils/AppError");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const categoryRoutes = require("./routes/categories");
const budgetRoutes = require("./routes/budgets");
const goalRoutes = require("./routes/goals");
const recurringRoutes = require("./routes/recurring");
const analyticsRoutes = require("./routes/analytics");

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// CSRF defense-in-depth: browsers always attach an Origin header to cross-site
// state-changing requests. Reject any POST/PUT/PATCH/DELETE whose Origin is not
// the configured client. Requests with no Origin (curl, server-to-server, Bearer
// clients) are unaffected. In production this is strictly CLIENT_ORIGIN; in
// development localhost/127.0.0.1 origins are also accepted.
app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (!origin) return next();
  const allowed = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  if (origin === allowed) return next();
  if (process.env.NODE_ENV !== "production") {
    try {
      const host = new URL(origin).hostname;
      if (host === "localhost" || host === "127.0.0.1") return next();
    } catch (e) {
      /* fall through to rejection */
    }
  }
  return res.status(403).json({ success: false, message: "Origin not allowed." });
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Receipt files were previously served unauthenticated from here. They now go
// through GET /api/v1/transactions/:id/receipt, which verifies the requester
// owns the transaction before streaming the file. See routes/transactions.js.

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  // /me is called on every page load/refresh (and already requires a valid
  // session) and /logout is not a credential-guessing vector, so neither should
  // consume the strict login/register/password attempt budget.
  skip: (req) => req.path === "/me" || req.path === "/logout",
  message: { success: false, message: "Too many attempts. Please try again later." },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

app.get("/api/v1/health", (req, res) => {
  res.json({ success: true, message: "Budget Buddy API is running." });
});

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1", apiLimiter);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/budgets", budgetRoutes);
app.use("/api/v1/goals", goalRoutes);
app.use("/api/v1/recurring-transactions", recurringRoutes);
app.use("/api/v1", analyticsRoutes);

app.use((req, res, next) => {
  next(new AppError(404, "The requested endpoint was not found."));
});

app.use(errorHandler);

module.exports = app;
