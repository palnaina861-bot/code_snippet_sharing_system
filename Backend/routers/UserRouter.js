const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/user/signup
// Register a new user
// ─────────────────────────────────────────────
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, city } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required.' });
        }

        // Check if email is already taken
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = new UserModel({
            name,
            email,
            password: hashedPassword,
            city: city || 'Unknown'
        });

        const savedUser = await newUser.save();

        // Issue JWT
        const token = jwt.sign(
            { _id: savedUser._id, email: savedUser.email, role: savedUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            message: 'Account created successfully.',
            token,
            user: {
                _id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                city: savedUser.city,
                role: savedUser.role
            }
        });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ message: 'Server error during signup.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// POST /api/user/login
// Login with email and password
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { _id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                city: user.city,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error during login.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/user/profile
// Get authenticated user's profile
// ─────────────────────────────────────────────
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        return res.status(200).json({ user: req.user });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// PUT /api/user/profile
// Update authenticated user's profile
// ─────────────────────────────────────────────
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, city, avatar } = req.body;

        const updates = {};
        if (name)   updates.name = name;
        if (city)   updates.city = city;
        if (avatar) updates.avatar = avatar;

        const updatedUser = await UserModel.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, select: '-password' }
        );

        return res.status(200).json({ message: 'Profile updated.', user: updatedUser });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// GET /api/user/getall  (Admin / debug)
// Get all users (no password)
// ─────────────────────────────────────────────
router.get('/getall', authMiddleware, async (req, res) => {
    try {
        const users = await UserModel.find().select('-password').sort({ createdAt: -1 });
        return res.status(200).json({ users });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

// ─────────────────────────────────────────────
// DELETE /api/user/delete/:id  (Admin)
// Delete a user account
// ─────────────────────────────────────────────
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        await UserModel.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: 'User deleted.' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.', error: err.message });
    }
});

module.exports = router;