
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware to handle CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

module.exports = app;