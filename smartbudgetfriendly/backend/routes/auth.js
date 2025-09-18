const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Corrected file paths
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Generate JWT token (helper function)
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
    '/register',
    [
        body('name', 'Name is required.').not().isEmpty(),
        body('email', 'Please include a valid email.').isEmail(),
        body('password', 'Password must be 6 or more characters.').isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // Check if user already exists
            let user = await User.findOne({ email: req.body.email });
            if (user) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            // Create new user (password is hashed in the User model pre-save hook)
            user = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            });

            await user.save();

            // Generate and return a token
            const token = generateToken(user.id);
            res.json({ token, user: { id: user.id, name: user.name, email: user.email } });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        body('email', 'Please include a valid email.').isEmail(),
        body('password', 'Password is required.').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        try {
            // Check for user
            let user = await User.findOne({ email: req.body.email });
            if (!user) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            // Check password
            const isMatch = await user.comparePassword(req.body.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            // Generate and return a token
            const token = generateToken(user.id);
            res.json({ token, user: { id: user.id, name: user.name, email: user.email } });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   GET /api/auth/me
// @desc    Get current user details (protected route)
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
