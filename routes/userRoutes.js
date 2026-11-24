
const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { addUserBook, getUserBooks, updateUserBook, deleteUserBook } = require("../controllers/userBookController"); 

const router = express.Router();

// Use Middlewares
router.use(protect);

router.get("/books", getUserBooks);
router.post("/books", addUserBook);
router.put("/books/:id", updateUserBook);
router.delete("/books/:id", deleteUserBook);


module.exports = router;