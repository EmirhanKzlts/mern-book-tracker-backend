
const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { createCategory, deleteCategory } = require("../controllers/categoryController");
const { createBook, deleteBook, updateBook } = require("../controllers/bookController");

const router = express.Router();

// Use Middlewares
router.use(protect, adminOnly);

router.post("/categories", createCategory);
router.delete("/categories/:id", deleteCategory);

router.post("/books", createBook);
router.put("/books/:id", updateBook);
router.delete("/books/:id", deleteBook);

module.exports = router;