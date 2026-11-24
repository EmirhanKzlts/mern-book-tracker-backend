
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId}, process.env.JWT_SECRET, { expiresIn: "1d"} );
}

// @desc     Register a new user
// @route    POST /api/auth/register
// @access   Public
const registerUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (typeof username !== "string" || typeof password !== "string"|| !username.trim() || !password) {
            return res.status(400).json({ message: "Valid username and password are required." })
        }

        if(password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters." });
        }

        const normalizedUsername = username.trim();

        // Check if user already exists
        const userExists = await User.findOne({ username: normalizedUsername });
        if (userExists) {
            return res.status(409).json({ message: "User already exists." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = await User.create({
            username: normalizedUsername,
            password: hashedPassword,
            role: "USER" 
        });

        // Return user data
        res.status(201).json({
            _id: user._id,
            username: user.username,
            role: user.role
        });
    } catch (error) {
        if (error.code === 11000){ // MongoDB Error Code
            return res.status(409).json({ message: "Username already exists." })
        }
        console.error("Register error:", error);
        return res.status(500).json({ message: "Register error"});
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (typeof username !== "string" || typeof password !== "string"|| !username.trim() || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        const normalizedUsername = username.trim();

        const user = await User.findOne({ username: normalizedUsername });
        if (!user) {
            return res.status(401).json({ message:"Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message:"Invalid username or password" });
        }

        // Return user data with JWT
        res.status(200).json({
            _id: user._id,
            username: user.username,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Login error"});
    }
};

const getMe = async (req, res) => {
    return res.status(200).json({
        _id: req.user._id,
        username: req.user.username,
        role: req.user.role,
    });
};

module.exports = { registerUser, loginUser, getMe };