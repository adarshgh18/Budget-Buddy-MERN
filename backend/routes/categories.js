const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { category, categoryUpdate } = require("../utils/validators");
const ctrl = require("../controllers/categoryController");

router.use(protect);
router.get("/", ctrl.index);
router.post("/", validate(category), ctrl.create);
router.patch("/:id", validate(categoryUpdate), ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
