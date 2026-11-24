
const mongoose = require("mongoose");

const UserBookSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        isFavorite: {
            type: Boolean,
            default: false,
        }
    },
    { timestamps: true }
);

UserBookSchema.index(
    { userId: 1, bookId: 1},
    { unique: true }
);

module.exports = mongoose.model("UserBook", UserBookSchema);