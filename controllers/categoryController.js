
const Category = require("../models/Category");
const Book = require("../models/Book");
const { default: mongoose } = require("mongoose");

// @desc     Get all categories
// @route    GET /api/categories
// @access   Public
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find();

        res.status(200).json(categories);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch categories." })
    }
};

// @desc     Create a new category
// @route    POST /api/admin/categories
// @access   Private (Admin Only)
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ message: "Category name is required." })
        }

        const normalizedname = name.trim().toLowerCase();

        const categoryExists = await Category.findOne({name: normalizedname});
        if (categoryExists) {
            return res.status(409).json({ message: "Category already exists." });
        }

        const category = await Category.create({ name: normalizedname })

        return res.status(201).json({ category, message: "Category created successfully." });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Category already exists."
            });
        }
        return res.status(500).json({ message: "Failed to create category." })
    }
};

// @desc     Delete a category
// @route    DELETE /api/admin/categories/:id
// @access   Private (Admin Only)
const deleteCategory = async (req, res) => {
    try {

        if(!mongoose.isValidObjectId(req.params.id)){
            return res.status(400).json({ message: "Invalid category ID." })
        }

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: "Category not found." });
        }

        const hasBooks = await Book.exists({ categories: category._id })

        if (hasBooks) {
            return res.status(409).json({ message: "Cannot delete category. Category contains books."});
        }

        await Category.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "Category deleted successfully." })
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete category." })
    }
};

module.exports = { getCategories, createCategory, deleteCategory };