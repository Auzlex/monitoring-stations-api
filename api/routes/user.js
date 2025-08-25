const loadEnv = require('../../loadEnv');
loadEnv(); // Load and process environment variables

const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const User = require("../models/user");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


// Ensure default admin exists
// we also ensure the password is matching the env file
const ensureAdmin = async () => {
    try {
        const adminEmail = "admin@example.com";
        const adminPassword = process.env.ENDPOINT_ADMIN_ACCESS_PASSWORD;

        if (!adminPassword) {
            console.warn("Admin password not set in environment variable.");
            return;
        }

        const existingAdmin = await User.findOne({ email: adminEmail });

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        if (!existingAdmin) {
            // Create admin if it doesn't exist
            const adminUser = new User({
                _id: new mongoose.Types.ObjectId(),
                email: adminEmail,
                password: hashedPassword
            });
            await adminUser.save();
            console.log("Admin user created.");
        } else {
            // Update password if it has changed
            const passwordMatches = await bcrypt.compare(adminPassword, existingAdmin.password);
            if (!passwordMatches) {
                existingAdmin.password = hashedPassword;
                await existingAdmin.save();
                console.log("Admin password updated.");
            }
        }
    } catch (err) {
        console.error("Error creating/updating admin user:", err);
    }
};

// Call it on server start
ensureAdmin();

// Login route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Sign a JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.email === "admin@example.com" ? "admin" : "user" },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;