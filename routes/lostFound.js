const express = require('express');
const router = express.Router();
const LostFoundPost = require('../models/LostFoundPost');
const LostFoundClaim = require('../models/LostFoundClaim');
const User = require('../models/User');
const RewardTransaction = require('../models/RewardTransaction');

// GET all lost & found posts
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = { is_deleted: false };
    
    if (type) filter.post_type = type;
    if (status) filter.status = status;
    
    const posts = await LostFoundPost.find(filter)
      .populate('user_id', 'full_name email')
      .sort({ created_at: -1 });
    
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching lost & found posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: error.message
    });
  }
});

// GET single post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await LostFoundPost.findOne({ 
      _id: req.params.id, 
      is_deleted: false 
    }).populate('user_id', 'full_name email');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Get claims for this post
    const claims = await LostFoundClaim.find({ post_id: post._id })
      .populate('claimant_id', 'full_name email')
      .sort({ created_at: -1 });
    
    res.json({
      success: true,
      data: {
        ...post.toObject(),
        claims
      }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post',
      error: error.message
    });
  }
});

// POST create new lost/found post
router.post('/', async (req, res) => {
  try {
    const { post_type, title, description, location, incident_time, image_url, user_id } = req.body;
    
    const newPost = new LostFoundPost({
      user_id,
      post_type,
      title,
      description,
      location,
      incident_time,
      image_url
    });
    
    await newPost.save();
    await newPost.populate('user_id', 'full_name email');
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: newPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create post',
      error: error.message
    });
  }
});

// POST claim an item
router.post('/:id/claim', async (req, res) => {
  try {
    const { claimant_id, claim_description, contact_info } = req.body;
    
    const post = await LostFoundPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    if (post.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This item has already been claimed or resolved'
      });
    }
    
    // Create claim
    const claim = new LostFoundClaim({
      post_id: post._id,
      claimant_id,
      claim_description,
      contact_info
    });
    
    await claim.save();
    await claim.populate('claimant_id', 'full_name email');
    
    // Update post status to claimed
    post.status = 'claimed';
    await post.save();
    
    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully',
      data: claim
    });
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to submit claim',
      error: error.message
    });
  }
});

// PUT confirm item return and award points
router.put('/:id/confirm', async (req, res) => {
  try {
    const { claim_id, confirmed_by } = req.body;
    
    const post = await LostFoundPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    const claim = await LostFoundClaim.findById(claim_id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }
    
    // Update claim status
    claim.claim_status = 'approved';
    claim.confirmed_at = new Date();
    await claim.save();
    
    // Update post status
    post.status = 'resolved';
    await post.save();
    
    // Award reward points to the helper (claimant)
    const REWARD_POINTS = 50; // Standard reward for helping with lost & found
    
    const helper = await User.findById(claim.claimant_id);
    if (helper) {
      helper.reward_points += REWARD_POINTS;
      helper.reputation_score += 25; // Half of reward points
      await helper.save();
      
      // Create reward transaction
      const transaction = new RewardTransaction({
        user_id: helper._id,
        points: REWARD_POINTS,
        reason: `Helped return ${post.post_type} item: ${post.title}`,
        reference_type: 'lost_found',
        reference_id: post._id
      });
      await transaction.save();
    }
    
    res.json({
      success: true,
      message: 'Item return confirmed and points awarded',
      data: {
        post,
        claim,
        pointsAwarded: REWARD_POINTS
      }
    });
  } catch (error) {
    console.error('Error confirming return:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to confirm return',
      error: error.message
    });
  }
});

// PUT update post
router.put('/:id', async (req, res) => {
  try {
    const { status, title, description, location } = req.body;
    const updateData = {};
    
    if (status) updateData.status = status;
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (location) updateData.location = location;
    
    const post = await LostFoundPost.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user_id', 'full_name email');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Post updated successfully',
      data: post
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update post',
      error: error.message
    });
  }
});

// DELETE soft delete post
router.delete('/:id', async (req, res) => {
  try {
    const post = await LostFoundPost.findByIdAndUpdate(
      req.params.id,
      { is_deleted: true },
      { new: true }
    );
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
      error: error.message
    });
  }
});

module.exports = router;
