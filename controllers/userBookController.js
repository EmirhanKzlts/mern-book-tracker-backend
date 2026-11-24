
const mongoose  = require("mongoose");
const UserBook = require("../models/UserBook");
const Book = require("../models/Book");
const Category = require("../models/Category");

// @desc     Get all books in user's personal library
// @route    GET /api/user/books
// @access   Private
const getUserBooks = async (req, res) => {
    try {
        const { isRead, isFavorite, search, categories, sort, page = "1", limit = "10" } = req.query;

        if(isRead !== undefined && isRead !== "true" && isRead !== "false") {
            return res.status(400).json({ message: "isRead must be true or false." })
        }

        if(isFavorite !== undefined && isFavorite !== "true" && isFavorite !== "false") {
            return res.status(400).json({ message: "isFavorite must be true or false." })
        }

        const filter = { userId: req.user._id };
        const bookFilter = {};

        if(isRead !== undefined) {
            filter.isRead = isRead === "true";
        }

        if(isFavorite !== undefined) {
            filter.isFavorite = isFavorite === "true";
        }

        if(search !== undefined) {
            if (typeof search !== "string" || search.length > 100) {
                return res.status(400).json({ message: "Invalid search parameters." });
            }

            const escapedSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            bookFilter.$or = [
                { title: { $regex: escapedSearch, $options: "i" } },
                { author: { $regex: escapedSearch, $options: "i" } },
            ];
        }

        if (categories !== undefined) {
            if(typeof categories !== "string") {
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

            bookFilter.categories = { $in: categoryIds };
        }

        if(Object.keys(bookFilter).length > 0) {
            const books = await Book.find(bookFilter).select("_id");

            const bookIds = books.map(book => book._id);

            filter.bookId = { $in: bookIds };
        }

        const selectedSort = sort === undefined ? "newest" : sort;

        if(sort) {
            if(selectedSort !== "newest" && selectedSort !== "oldest") {
                return res.status(400).json({ message: "Invalid sort parameter." })
            }
        }

        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
        }

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if(!Number.isInteger(pageNumber) || pageNumber < 1 ||
            !Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100) {
                return res.status(400).json({ message: "Invalid pagination parameters." })
        }

        const skip = ((pageNumber - 1) * limitNumber );
        
        const totalBooks = await UserBook.countDocuments(filter);
        const totalPages = Math.ceil(totalBooks / limitNumber);


        const userBooks = await UserBook.find(filter).populate({
            path: "bookId",
            populate: {
                path: "categories",
                select: "name"
            }
        })
        .sort({
            ...sortOptions[selectedSort],
            _id: 1
        })
        .skip(skip)
        .limit(limitNumber);

        const formattedUserBooks = userBooks.map(userBook => {
            const { bookId, ...rest } = userBook.toObject();

            return {
                ...rest,
                book: bookId
            };
        });

        return res.status(200).json({ 
            userBooks: formattedUserBooks,
            pagination: {
                totalBooks,
                totalPages,
                currentPage: pageNumber,
                limit: limitNumber
            }
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Failed to fetch your library."
        });
    }
};


// @desc     Add a book to user's personal list
// @route    POST /api/user/books
// @access   Private
const addUserBook = async (req, res) => {
    try {
        const { bookId } = req.body;
        
        if(!mongoose.isValidObjectId(bookId)) {
            return res.status(400).json({ message: "Invalid book ID." });
        }
        
        const bookExists = await Book.findById(bookId);
        if(!bookExists) {
            return res.status(404).json({ message: "Book not found." })
        }

        const existingUserBook = await UserBook.findOne({
            userId: req.user._id,
            bookId: bookId
        });
        if (existingUserBook) {
            return res.status(409).json({ message: "Book already exists in your library." });
        }
        
        const userBook = await UserBook.create({
            userId: req.user._id,
            bookId: bookId
        });

        return res.status(201).json({ userBook, message: "Book added to the library successfully." });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Book already exists in your library." });
        }

        return res.status(500).json({ message: "Failed to add book to your library." })
    }
};


// @desc     Update a book's read or favorite status
// @route    PATCH /api/user/books/:id
// @access   Private
const updateUserBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { isRead, isFavorite } = req.body;

        if(!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid user book ID." });
        }

        const userBook = await UserBook.findOne({
            _id: id,
            userId: req.user._id
        })
        if (!userBook) {
            return res.status(404).json({ message: "User book not found." })
        }

        if (isRead === undefined && isFavorite === undefined) {
            return res.status(400).json({
                message: "At least one field must be provided."
            });
        }

        if (isRead !== undefined && typeof isRead !== "boolean") {
            return res.status(400).json({ message: "isRead must be a boolean." })
        }

        if (isFavorite !== undefined && typeof isFavorite !== "boolean") {
            return res.status(400).json({ message: "isFavorite must be a boolean." })
        }

        if (isRead !== undefined) {
            userBook.isRead = isRead;
        }

        if (isFavorite !== undefined) {
            userBook.isFavorite = isFavorite;
        }

        await userBook.save();

        return res.status(200).json({ userBook, message: "Book updated successfully."})
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update your book."
        });
    }
};


// @desc     Remove a book from user's personal list
// @route    DELETE /api/user/books/:id
// @access   Private
const deleteUserBook = async (req, res) => {
    try {
        const { id } = req.params;

        if(!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid user book ID." });
        }

        const userBook = await UserBook.findOne({
            _id: id,
            userId: req.user._id
        })
        if (!userBook) {
            return res.status(404).json({ message: "User book not found." })
        }

        await userBook.deleteOne();
        return res.status(200).json({ message: "Book deleted from your library successfully." });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to delete from your library."
        });
    }
};

module.exports = { addUserBook, getUserBooks, updateUserBook, deleteUserBook };