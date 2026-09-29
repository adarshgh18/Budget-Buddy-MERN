const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { register, login, updateProfile, changePassword } = require("../utils/validators");
const ctrl = require("../controllers/authController");

router.post("/register", validate(register), ctrl.register);
router.post("/login", validate(login), ctrl.login);
router.post("/logout", ctrl.logout);
router.get("/me", protect, ctrl.me);
router.patch("/me", protect, validate(updateProfile), ctrl.updateMe);
router.patch("/password", protect, validate(changePassword), ctrl.changePassword);
router.delete("/account", protect, ctrl.deleteAccount);

module.exports = router;
