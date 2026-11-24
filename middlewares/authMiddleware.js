
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes
const protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization;

        if (token && token.startsWith("Bearer ")) {
            token = token.split(" ")[1]; // Extract token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({ message: "Not authorized, user not found." })
            }

            next();
        } else {
            return res.status(401).json({ message: "Not authorized, no token." });
        }
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." })
    }
};

const adminOnly = async (req, res, next) => {
    if (req.user && req.user.role === "ADMIN") {
        return next();
    }

    return res.status(403).json({ message: "Access denied." });
};

module.exports = { protect, adminOnly };