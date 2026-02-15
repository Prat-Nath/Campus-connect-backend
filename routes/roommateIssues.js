const express = require('express');
const router = express.Router();
const RoommateIssue = require('../models/RoommateIssue');
const RoommateParticipant = require('../models/RoommateParticipant');

// GET all roommate issues
router.get('/', async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = { is_deleted: false };
    
    if (category) filter.issue_category = category;
    if (status) filter.status = status;
    
    const issues = await RoommateIssue.find(filter)
      .populate('raised_by', 'full_name email hostel_id room_number')
      .populate('escalated_to', 'full_name email')
      .sort({ created_at: -1 });
    
    // Get participant counts for each issue
    const issuesWithCounts = await Promise.all(
      issues.map(async (issue) => {
        const participantCount = await RoommateParticipant.countDocuments({
          issue_id: issue._id
        });
        
        return {
          ...issue.toObject(),
          participant_count: participantCount
        };
      })
    );
    
    res.json({
      success: true,
      data: issuesWithCounts
    });
  } catch (error) {
    console.error('Error fetching roommate issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roommate issues',
      error: error.message
    });
  }
});

// GET single roommate issue by ID
router.get('/:id', async (req, res) => {
  try {
    const issue = await RoommateIssue.findOne({
      _id: req.params.id,
      is_deleted: false
    })
      .populate('raised_by', 'full_name email hostel_id room_number')
      .populate('escalated_to', 'full_name email');
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Get participants
    const participants = await RoommateParticipant.find({ issue_id: issue._id })
      .populate('user_id', 'full_name email');
    
    res.json({
      success: true,
      data: {
        ...issue.toObject(),
        participants
      }
    });
  } catch (error) {
    console.error('Error fetching roommate issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roommate issue',
      error: error.message
    });
  }
});

// POST create new roommate issue
router.post('/', async (req, res) => {
  try {
    const { raised_by, issue_category, description } = req.body;
    
    const newIssue = new RoommateIssue({
      raised_by,
      issue_category,
      description
    });
    
    await newIssue.save();
    await newIssue.populate('raised_by', 'full_name email hostel_id room_number');
    
    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: newIssue
    });
  } catch (error) {
    console.error('Error creating roommate issue:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create issue',
      error: error.message
    });
  }
});

// PUT update roommate issue (status, escalate, resolve)
router.put('/:id', async (req, res) => {
  try {
    const { status, escalated_to, resolution_note } = req.body;
    const updateData = {};
    
    if (status) {
      updateData.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date();
      }
    }
    if (escalated_to) {
      updateData.escalated_to = escalated_to;
      updateData.status = 'escalated';
    }
    if (resolution_note) updateData.resolution_note = resolution_note;
    
    const issue = await RoommateIssue.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('raised_by', 'full_name email')
      .populate('escalated_to', 'full_name email');
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Issue updated successfully',
      data: issue
    });
  } catch (error) {
    console.error('Error updating roommate issue:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update issue',
      error: error.message
    });
  }
});

// DELETE soft delete roommate issue
router.delete('/:id', async (req, res) => {
  try {
    const issue = await RoommateIssue.findByIdAndUpdate(
      req.params.id,
      { is_deleted: true },
      { new: true }
    );
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting roommate issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete issue',
      error: error.message
    });
  }
});

module.exports = router;
