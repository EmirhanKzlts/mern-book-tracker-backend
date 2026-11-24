
const express = require("express");

const { getBooks } = require("../controllers/bookController");
const { getCategories } = require("../controllers/categoryController");

const router = express.Router();

router.get("/books", getBooks);
router.get("/categories", getCategories);

module.exports = router;