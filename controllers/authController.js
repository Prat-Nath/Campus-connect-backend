const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const UserSession = require('../models/UserSession');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { college_email, password, full_name, role_id } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ college_email });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Create user
    const user = await User.create({
      college_email,
      password_hash: password, // Will be hashed by pre-save hook
      full_name,
      role_id
    });

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await UserSession.create({
      user_id: user._id,
      refresh_token: refreshToken,
      device_info: req.headers['user-agent'] || 'Unknown',
      expires_at: expiresAt
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          college_email: user.college_email,
          full_name: user.full_name,
          role_id: user.role_id
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    console.log('Login attempt:', req.body.college_email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { college_email, password } = req.body;

    // Find user
    const user = await User.findOne({ college_email })
      .populate('hostel_id', 'name block')
      .populate('role_id', 'role_name');

    if (!user) {
      console.log('User not found:', college_email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    console.log('User found:', user.college_email, 'Role:', user.role_id?.role_name);

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for:', college_email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check account status
    if (user.account_status !== 'active') {
      console.log('Account not active:', college_email, 'Status:', user.account_status);
      return res.status(403).json({ 
        success: false, 
        message: 'Account is not active' 
      });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await UserSession.create({
      user_id: user._id,
      refresh_token: refreshToken,
      device_info: req.headers['user-agent'] || 'Unknown',
      expires_at: expiresAt
    });

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password_hash;

    console.log('Login successful for:', college_email);

    res.json({
      success: true,
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: error.message 
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password_hash')
      .populate('hostel_id', 'name block gender_type')
      .populate('role_id', 'role_name');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      // Delete the session
      await UserSession.deleteOne({ refresh_token: refreshToken });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during logout',
      error: error.message 
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Refresh token is required' 
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if session exists
    const session = await UserSession.findOne({ 
      refresh_token: refreshToken,
      user_id: decoded.id 
    });

    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid refresh token' 
      });
    }

    // Check if session expired
    if (session.expires_at < new Date()) {
      await UserSession.deleteOne({ _id: session._id });
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token expired' 
      });
    }

    // Generate new access token
    const newToken = generateToken(decoded.id);

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid refresh token',
      error: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  refreshToken
};
