const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const lostFoundRoutes = require('./lostFound');
const activitiesRoutes = require('./activities');
const foodRequestsRoutes = require('./foodRequests');
const roommateIssuesRoutes = require('./roommateIssues');
const noticesRoutes = require('./notices');
const profileRoutes = require('./profile');
const rewardsRoutes = require('./rewards');
const dashboardRoutes = require('./dashboard');
const wardenRoutes = require('./warden');
const foodStallsRoutes = require('./foodStalls');

// Mount routes
router.use('/auth', authRoutes);
router.use('/lost-found', lostFoundRoutes);
router.use('/activities', activitiesRoutes);
router.use('/food-requests', foodRequestsRoutes);
router.use('/roommate-issues', roommateIssuesRoutes);
router.use('/notices', noticesRoutes);
router.use('/profile', profileRoutes);
router.use('/rewards', rewardsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/warden', wardenRoutes);
router.use('/food-stalls', foodStallsRoutes);

// Health check endpoint
router.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  
  res.json({
    success: true,
    status: 'OK',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hostel Management API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      lostFound: '/api/lost-found',
      activities: '/api/activities',
      foodRequests: '/api/food-requests',
      roommateIssues: '/api/roommate-issues',
      notices: '/api/notices',
      profile: '/api/profile',
      rewards: '/api/rewards',
      health: '/api/health'
    }
  });
});

module.exports = router;
