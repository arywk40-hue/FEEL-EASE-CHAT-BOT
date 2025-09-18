const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    if (user) {
      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isPremium: user.isPremium
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isPremium: user.isPremium,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isPremium: user.isPremium,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user data' });
  }
};

// Update user profile
const updateUser = async (req, res) => {
  try {
    const { name, phone, preferences } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, preferences },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isPremium: user.isPremium,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// Upgrade to premium
const upgradeToPremium = async (req, res) => {
  try {
    // Set premium expiry to 30 days from now
    const premiumExpiry = new Date();
    premiumExpiry.setDate(premiumExpiry.getDate() + 30);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        isPremium: true,
        premiumExpiry
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Account upgraded to premium successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        premiumExpiry: user.premiumExpiry
      }
    });
  } catch (error) {
    console.error('Premium upgrade error:', error);
    res.status(500).json({ message: 'Server error upgrading to premium' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUser,
  upgradeToPremium
};