const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const ActivityParticipant = require('../models/ActivityParticipant');
const FoodRequest = require('../models/FoodRequest');
const LostFoundPost = require('../models/LostFoundPost');
const RoommateIssue = require('../models/RoommateIssue');
const Notice = require('../models/Notice');

// GET dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;

    // Get active activities count (status: open or ongoing)
    const activeActivitiesCount = await Activity.countDocuments({
      status: { $in: ['open', 'ongoing'] },
      is_deleted: false
    });

    // Get open food requests count (pending or accepted)
    const openFoodRequestsCount = await FoodRequest.countDocuments({
      status: { $in: ['pending', 'accepted'] },
      is_deleted: false
    });

    // Get recent lost & found items count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLostFoundCount = await LostFoundPost.countDocuments({
      created_at: { $gte: sevenDaysAgo },
      is_deleted: false
    });

    // Get user-specific activities count if userId provided
    let userActivitiesCount = 0;
    if (userId) {
      userActivitiesCount = await ActivityParticipant.countDocuments({
        user_id: userId,
        status: 'accepted'
      });
    }

    res.json({
      success: true,
      data: {
        activeActivities: activeActivitiesCount,
        openFoodRequests: openFoodRequestsCount,
        recentLostFound: recentLostFoundCount,
        userActivities: userActivitiesCount
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});

// GET recent activity feed
router.get('/recent-activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent activities
    const recentActivities = await Activity.find({ is_deleted: false })
      .populate('creator_id', 'full_name')
      .sort({ created_at: -1 })
      .limit(limit)
      .select('title activity_type created_at');

    // Get recent notices
    const recentNotices = await Notice.find({ is_deleted: false })
      .populate('posted_by', 'full_name')
      .sort({ created_at: -1 })
      .limit(limit)
      .select('title notice_type created_at');

    // Get recent lost & found items
    const recentLostFound = await LostFoundPost.find({ is_deleted: false })
      .populate('user_id', 'full_name')
      .sort({ created_at: -1 })
      .limit(limit)
      .select('title post_type created_at');

    // Combine and sort all items by creation date
    const allItems = [
      ...recentActivities.map(item => ({
        _id: item._id,
        title: item.title,
        type: 'activity',
        subtype: item.activity_type,
        creator: item.creator_id?.full_name,
        createdAt: item.created_at
      })),
      ...recentNotices.map(item => ({
        _id: item._id,
        title: item.title,
        type: 'notice',
        subtype: item.notice_type,
        creator: item.posted_by?.full_name,
        createdAt: item.created_at
      })),
      ...recentLostFound.map(item => ({
        _id: item._id,
        title: item.title,
        type: 'lost-found',
        subtype: item.post_type,
        creator: item.user_id?.full_name,
        createdAt: item.created_at
      }))
    ];

    // Sort by creation date and limit
    const sortedItems = allItems
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    res.json({
      success: true,
      data: sortedItems
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message
    });
  }
});

module.exports = router;
