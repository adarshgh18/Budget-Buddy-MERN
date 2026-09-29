const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { budget, budgetUpdate } = require("../utils/validators");
const ctrl = require("../controllers/budgetController");

router.use(protect);
router.get("/", ctrl.index);
router.post("/", validate(budget), ctrl.create);
router.patch("/:id", validate(budgetUpdate), ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
