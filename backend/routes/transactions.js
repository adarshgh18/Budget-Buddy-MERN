const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const upload = require("../middleware/upload");
const { transaction, transactionUpdate } = require("../utils/validators");
const ctrl = require("../controllers/transactionController");

router.use(protect);

router.get("/export", ctrl.exportCsv);
router.get("/", ctrl.index);
router.post("/", upload.single("receipt"), validate(transaction), ctrl.create);
router.get("/:id", ctrl.show);
router.get("/:id/receipt", ctrl.receipt);
router.patch("/:id", upload.single("receipt"), validate(transactionUpdate), ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
