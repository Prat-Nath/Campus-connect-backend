const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const Activity = require('../models/Activity');
const ActivityParticipant = require('../models/ActivityParticipant');
const LostFoundPost = require('../models/LostFoundPost');

// GET current user profile (/:userId for now, can be replaced with auth middleware)
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('hostel_id', 'hostel_name location')
      .populate('role_id', 'role_name')
      .select('-password_hash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get activity stats
    const activitiesCreated = await Activity.countDocuments({
      creator_id: user._id,
      is_deleted: false
    });
    
    const activitiesJoined = await ActivityParticipant.countDocuments({
      user_id: user._id,
      status: 'joined'
    });
    
    const lostFoundPosts = await LostFoundPost.countDocuments({
      user_id: user._id,
      is_deleted: false
    });
    
    res.json({
      success: true,
      data: {
        ...user.toObject(),
        stats: {
          activitiesCreated,
          activitiesJoined,
          lostFoundPosts,
          totalRewardPoints: user.reward_points,
          reputationScore: user.reputation_score
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// PUT update user profile
router.put('/:userId', async (req, res) => {
  try {
    const { full_name, hostel_id, room_number, batch } = req.body;
    const updateData = {};
    
    if (full_name) updateData.full_name = full_name;
    if (hostel_id) updateData.hostel_id = hostel_id;
    if (room_number !== undefined) updateData.room_number = room_number;
    if (batch) updateData.batch = batch;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('hostel_id', 'hostel_name location')
      .populate('role_id', 'role_name')
      .select('-password_hash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// GET user's reward transactions
router.get('/:userId/rewards', async (req, res) => {
  try {
    const transactions = await RewardTransaction.find({
      user_id: req.params.userId
    })
      .sort({ created_at: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching reward transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reward transactions',
      error: error.message
    });
  }
});

// GET user's activity history
router.get('/:userId/activities', async (req, res) => {
  try {
    const participations = await ActivityParticipant.find({
      user_id: req.params.userId
    })
      .populate({
        path: 'activity_id',
        select: 'title activity_type location activity_time status',
        populate: {
          path: 'creator_id',
          select: 'full_name'
        }
      })
      .sort({ joined_at: -1 })
      .limit(20);
    
    res.json({
      success: true,
      data: participations
    });
  } catch (error) {
    console.error('Error fetching activity history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity history',
      error: error.message
    });
  }
});

module.exports = router;
