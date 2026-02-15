const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');
const RewardRedemption = require('../models/RewardRedemption');

// GET leaderboard (top users by points and reputation)
router.get('/leaderboard', async (req, res) => {
  try {
    const { sortBy = 'points', limit = 10 } = req.query;
    const sortField = sortBy === 'reputation' ? 'reputation_score' : 'reward_points';
    
    const users = await User.find({
      account_status: 'active'
    })
      .select('full_name hostel_id batch reward_points reputation_score')
      .populate('hostel_id', 'hostel_name')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
});

// GET user's reward transactions
router.get('/transactions/:userId', async (req, res) => {
  try {
    const transactions = await RewardTransaction.find({
      user_id: req.params.userId
    })
      .sort({ created_at: -1 })
      .limit(100);
    
    const totalEarned = await RewardTransaction.aggregate([
      {
        $match: {
          user_id: new require('mongoose').Types.ObjectId(req.params.userId),
          points: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$points' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        transactions,
        totalEarned: totalEarned[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// POST redeem reward points
router.post('/redeem', async (req, res) => {
  try {
    const { user_id, points, stall_id, description } = req.body;
    
    // Check if user has enough points
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.reward_points < points) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient reward points'
      });
    }
    
    // Create redemption record
    const redemption = new RewardRedemption({
      user_id,
      points_redeemed: points,
      stall_id,
      description
    });
    
    // Deduct points from user
    user.reward_points -= points;
    
    await redemption.save();
    await user.save();
    
    // Create negative transaction record
    const transaction = new RewardTransaction({
      user_id,
      points: -points,
      reason: `Redeemed at ${description || 'food stall'}`,
      reference_type: 'manual',
      reference_id: redemption._id
    });
    await transaction.save();
    
    res.status(201).json({
      success: true,
      message: 'Points redeemed successfully',
      data: {
        redemption,
        remainingPoints: user.reward_points
      }
    });
  } catch (error) {
    console.error('Error redeeming points:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to redeem points',
      error: error.message
    });
  }
});

// POST award points (helper function for other routes)
router.post('/award', async (req, res) => {
  try {
    const { user_id, points, reason, reference_type, reference_id } = req.body;
    
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Add points to user
    user.reward_points += points;
    user.reputation_score += Math.floor(points / 2); // Reputation is half of points
    
    await user.save();
    
    // Create transaction record
    const transaction = new RewardTransaction({
      user_id,
      points,
      reason,
      reference_type,
      reference_id
    });
    await transaction.save();
    
    res.status(201).json({
      success: true,
      message: 'Points awarded successfully',
      data: {
        transaction,
        newTotal: user.reward_points,
        newReputation: user.reputation_score
      }
    });
  } catch (error) {
    console.error('Error awarding points:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to award points',
      error: error.message
    });
  }
});

module.exports = router;
