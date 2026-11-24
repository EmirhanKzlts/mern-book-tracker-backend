
const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        author: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            maxLength: 255,
        },
        publishedYear: {
            type: Number,
            required: true,
            min: 1450,
        },
        coverImage: {
            type: String,
        },
        categories: {
            type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
            }],
            validate: {
                validator: function (value) {
                    return Array.isArray(value) && value.length > 0;
                },
                message: "A book must have at least one category."
            }
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Book", BookSchema);