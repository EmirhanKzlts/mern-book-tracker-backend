
const mongoose = require("mongoose");
const Book = require("../models/Book");
const Category = require("../models/Category");
const UserBook = require("../models/UserBook");

// @desc     Get all books
// @route    GET /api/books
// @access   Public
const getBooks = async (req, res) => {
    try {
        const { search, categories, page = 1, limit = 10, sort = "title_asc" } = req.query;

        const filter = {};

        if (search) {
            if (typeof search !== "string" || search.length > 100) {
                return res.status(400).json({ message: "Invalid search parameters." });
            }

            const escapedSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                { title: {$regex: escapedSearch, $options: "i"} },
                { author: {$regex: escapedSearch, $options: "i"} },
            ];
        }

        if (categories !== undefined) {
            if (typeof categories !== "string") {
                return res.status(400).json({ message: "Invalid categories parameter." });
            }

            const categoryNames = categories
                .split(",")
                .map(name => name.trim().toLowerCase());
            if ( categoryNames.some(name => !name)) {
                return res.status(400).json({ message: "Category names cannot be empty." });
            }

            const uniqueCategoryNames = new Set(categoryNames);
            if (uniqueCategoryNames.size !== categoryNames.length) {
                return res.status(400).json({
                    message: "Duplicate categories are not allowed."
                });
            }

            const foundCategories = await Category.find({
                name: { $in: categoryNames }
            }).select("_id");

            if (foundCategories.length !== categoryNames.length) {
                return res.status(400).json({
                    message: "One or more categories do not exist."
                });
            }

            const categoryIds = foundCategories.map(category => category._id)

            filter.categories = { $in: categoryIds };
        }

        const sortOptions = {
            title_asc: { title: 1 },
            title_desc: { title: -1 },
            author_asc: { author: 1 },
            author_desc: { author: -1 },
            year_asc: { publishedYear: 1 },
            year_desc: { publishedYear: -1 },
        }

        if (typeof sort !== "string" || !Object.hasOwn(sortOptions, sort)) {
            return res.status(400).json({ message: "Invalid sort parameters" });
        }

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if(!Number.isInteger(pageNumber) || pageNumber < 1 ||
            !Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100) {
                return res.status(400).json({ message: "Invalid pagination parameters." })
        }

        const skip = ((pageNumber - 1) * limitNumber );

        const totalBooks = await Book.countDocuments(filter);
        const totalPages = Math.ceil(totalBooks / limitNumber);

        const books = await Book.find(filter)
                                .populate("categories", "name")
                                .sort({ ...sortOptions[sort], _id: 1})
                                .skip(skip)
                                .limit(limitNumber);

        return res.status(200).json({ 
            books, 
            pagination: { 
                totalBooks, 
                totalPages, 
                currentPage: pageNumber, 
                limit: limitNumber 
            } 
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch books." })
    }
};

// @desc     Create a new book
// @route    POST /api/admin/books
// @access   Private (Admin Only)
const createBook = async (req, res) => {
    try {
        const { title, author, description, publishedYear, categoryIds } = req.body;

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ message: "Book title is required." })
        }

        const normalizedTitle = title.trim();

        if (typeof author !== "string" || !author.trim()) {
            return res.status(400).json({ message: "Author is required." })
        }

        const normalizedAuthor = author.trim();

        if (description !== undefined && (typeof description !== "string" || description.length > 255)) {
            return res.status(400).json({ message: "Description must be a string with at most 255 characters." })
        }

        if (!Number.isInteger(publishedYear) || publishedYear < 1450 || publishedYear > new Date().getFullYear()) {
            return res.status(400).json({ message: "Published year is not valid." })
        }

        if(!Array.isArray(categoryIds) || categoryIds.length < 1) {
            return res.status(400).json({ message: "At least one category is required." })
        }

        if (!categoryIds.every(id => mongoose.isValidObjectId(id))) {
            return res.status(400).json({ message: "Invalid category ID." });
        }

        const uniqueCategoryIds = new Set(categoryIds);
        if (uniqueCategoryIds.size !== categoryIds.length) {
            return res.status(400).json({ message: "Duplicate categories are not allowed." });
        }

        const categories = await Category.find({ _id: { $in: categoryIds }});
        if (categories.length !== categoryIds.length) {
            return res.status(400).json({ message: "One or more categories do not exist." })
        }

        const book = await Book.create({ 
            title: normalizedTitle,
            author: normalizedAuthor,
            description,
            publishedYear,
            categories: categoryIds,
        })

        await book.populate("categories", "name");

        return res.status(201).json({ book, message: "Book created successfully." });

    } catch (error) {
        return res.status(500).json({ message: "Failed to create book." })
    }
};

// @desc     Update a book
// @route    PUT /api/admin/books/:id
// @access   Private (Admin Only)
const updateBook = async (req, res) => {
    try {

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid book ID." });
        }

        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({ message: "Book not found." })
        }

        const { title, author, description, publishedYear, categoryIds } = req.body;

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ message: "Book title is required." })
        }

        const normalizedTitle = title.trim();

        if (typeof author !== "string" || !author.trim()) {
            return res.status(400).json({ message: "Author is required." })
        }

        const normalizedAuthor = author.trim();

        if (description !== undefined && (typeof description !== "string" || description.length > 255)) {
            return res.status(400).json({ message: "Description must be a string with at most 255 characters." })
        }


        if (!Number.isInteger(publishedYear) || publishedYear < 1450 || publishedYear > new Date().getFullYear()) {
            return res.status(400).json({ message: "Published year is not valid." })
        }


        if(!Array.isArray(categoryIds) || categoryIds.length < 1) {
            return res.status(400).json({ message: "At least one category is required." })
        }

        if (!categoryIds.every(id => mongoose.isValidObjectId(id))) {
            return res.status(400).json({ message: "Invalid category ID." });
        }

        const uniqueCategoryIds = new Set(categoryIds);
        if (uniqueCategoryIds.size !== categoryIds.length) {
            return res.status(400).json({ message: "Duplicate categories are not allowed." });
        }

        const categories = await Category.find({ _id: { $in: categoryIds }});
        if (categories.length !== categoryIds.length) {
            return res.status(400).json({ message: "One or more categories do not exist." })
        }

        book.title = normalizedTitle;
        book.author = normalizedAuthor;
        book.description = description ?? "";
        book.publishedYear = publishedYear;
        book.categories = categoryIds;

        await book.save();

        await book.populate("categories", "name");

        return res.status(200).json({ book, message: "Book updated successfully." });

    } catch (error) {
        return res.status(500).json({ message: "Failed to update book." })
    }
};


// @desc     Delete a book
// @route    DELETE /api/admin/books/:id
// @access   Private (Admin Only)
const deleteBook = async (req, res) => {
    try {

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid book ID." });
        }

        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: "Book not found." });
        }

        const isInLibrary = await UserBook.exists({ bookId: req.params.id });
        if (isInLibrary) {
            return res.status(409).json({ message: "Cannot delete book. Book exists in user libraries." });
        }

        await Book.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "Book deleted successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete book." });
    }
};

module.exports = { getBooks, createBook, updateBook, deleteBook };