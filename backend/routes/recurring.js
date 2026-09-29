const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { recurring, recurringUpdate } = require("../utils/validators");
const ctrl = require("../controllers/recurringController");

router.use(protect);
router.get("/", ctrl.index);
router.post("/", validate(recurring), ctrl.create);
router.patch("/:id", validate(recurringUpdate), ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
