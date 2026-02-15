const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const ActivityParticipant = require('../models/ActivityParticipant');

// GET all activities
router.get('/', async (req, res) => {
  try {
    const { activity_type, status } = req.query;
    const filter = { is_deleted: false };
    
    if (activity_type) filter.activity_type = activity_type;
    if (status) filter.status = status;
    
    const activities = await Activity.find(filter)
      .populate('creator_id', 'full_name email')
      .sort({ activity_time: 1 });
    
    // Get participant counts for each activity
    const activitiesWithCounts = await Promise.all(
      activities.map(async (activity) => {
        const participantCount = await ActivityParticipant.countDocuments({
          activity_id: activity._id,
          status: 'accepted'
        });
        
        return {
          ...activity.toObject(),
          current_participants: participantCount
        };
      })
    );
    
    res.json({
      success: true,
      data: activitiesWithCounts
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
});

// GET single activity by ID
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      is_deleted: false
    }).populate('creator_id', 'full_name email');
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Get participant count
    const participantCount = await ActivityParticipant.countDocuments({
      activity_id: activity._id,
      status: 'accepted'
    });
    
    res.json({
      success: true,
      data: {
        ...activity.toObject(),
        current_participants: participantCount
      }
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity',
      error: error.message
    });
  }
});

// POST create new activity
router.post('/', async (req, res) => {
  try {
    const {
      creator_id,
      title,
      description,
      activity_type,
      location,
      activity_time,
      required_participants,
      max_participants,
      is_private
    } = req.body;
    
    const newActivity = new Activity({
      creator_id,
      title,
      description,
      activity_type,
      location,
      activity_time,
      required_participants,
      max_participants,
      is_private
    });
    
    await newActivity.save();
    await newActivity.populate('creator_id', 'full_name email');
    
    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: {
        ...newActivity.toObject(),
        current_participants: 0
      }
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create activity',
      error: error.message
    });
  }
});

// PUT update activity
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      activity_time,
      max_participants,
      status
    } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (location) updateData.location = location;
    if (activity_time) updateData.activity_time = activity_time;
    if (max_participants) updateData.max_participants = max_participants;
    if (status) updateData.status = status;
    
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('creator_id', 'full_name email');
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Get participant count
    const participantCount = await ActivityParticipant.countDocuments({
      activity_id: activity._id,
      status: 'accepted'
    });
    
    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: {
        ...activity.toObject(),
        current_participants: participantCount
      }
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update activity',
      error: error.message
    });
  }
});

// DELETE soft delete activity
router.delete('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      { is_deleted: true },
      { new: true }
    );
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity',
      error: error.message
    });
  }
});


// POST join activity
router.post('/:id/join', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if activity exists and is open
    const activity = await Activity.findOne({
      _id: req.params.id,
      is_deleted: false
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    if (activity.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Activity is not open for joining'
      });
    }

    // Check if already a participant
    const existingParticipant = await ActivityParticipant.findOne({
      activity_id: req.params.id,
      user_id: user_id
    });

    if (existingParticipant) {
      if (existingParticipant.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'You have already joined this activity'
        });
      }
      // If previously left, reactivate
      existingParticipant.status = 'accepted';
      existingParticipant.joined_at = new Date();
      await existingParticipant.save();
    } else {
      // Check if activity is full
      const currentParticipants = await ActivityParticipant.countDocuments({
        activity_id: req.params.id,
        status: 'accepted'
      });

      if (currentParticipants >= activity.max_participants) {
        return res.status(400).json({
          success: false,
          message: 'Activity is full'
        });
      }

      // Create new participant
      await ActivityParticipant.create({
        activity_id: req.params.id,
        user_id: user_id,
        status: 'accepted'
      });
    }

    res.json({
      success: true,
      message: 'Successfully joined the activity'
    });
  } catch (error) {
    console.error('Error joining activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join activity',
      error: error.message
    });
  }
});

// POST leave activity
router.post('/:id/leave', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const participant = await ActivityParticipant.findOne({
      activity_id: req.params.id,
      user_id: user_id,
      status: 'accepted'
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'You are not a participant of this activity'
      });
    }

    // Update participant status to left
    participant.status = 'left';
    await participant.save();

    res.json({
      success: true,
      message: 'Successfully left the activity'
    });
  } catch (error) {
    console.error('Error leaving activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave activity',
      error: error.message
    });
  }
});

module.exports = router;

