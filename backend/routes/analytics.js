const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/analyticsController");

router.use(protect);
router.get("/dashboard", ctrl.dashboard);
router.get("/analytics", ctrl.analytics);
router.get("/analytics/insights", ctrl.insights);

module.exports = router;
