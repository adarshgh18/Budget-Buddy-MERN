const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { goal, goalUpdate } = require("../utils/validators");
const ctrl = require("../controllers/goalController");

router.use(protect);
router.get("/", ctrl.index);
router.post("/", validate(goal), ctrl.create);
router.patch("/:id", validate(goalUpdate), ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
