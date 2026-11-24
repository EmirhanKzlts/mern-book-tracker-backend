
const express = require("express");
const { protect } = require("../middlewares/authMiddleware")
const { registerUser, loginUser, getMe } = require("../controllers/authController");

const router = express.Router();

// Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);

module.exports = router;