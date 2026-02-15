const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id)
        .select('-password_hash')
        .populate('hostel_id', 'name block')
        .populate('role_id', 'role_name');

      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Check if user account is active
      if (req.user.account_status !== 'active') {
        return res.status(403).json({ 
          success: false, 
          message: 'Account is not active' 
        });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, token failed' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, no token' 
    });
  }
};

// Check user role
const authorize = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const userRole = req.user.role_id.role_name;

    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${userRole}' is not authorized to access this route` 
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
