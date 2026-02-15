const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Role');
const { protect, authorize } = require('../middleware/auth');

// All warden routes require auth and warden role
router.use(protect);
router.use(authorize('warden', 'admin'));

// GET warden dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const studentRole = await Role.findOne({ role_name: 'student' });
    
    if (!studentRole) {
      return res.status(404).json({
        success: false,
        message: 'Student role not found'
      });
    }

    // Get total students
    const totalStudents = await User.countDocuments({
      role_id: studentRole._id,
      account_status: 'active'
    });

    // Get pending verifications
    const pendingVerifications = await User.countDocuments({
      role_id: studentRole._id,
      is_verified: false,
      account_status: 'active'
    });

    // Get verified students
    const verifiedStudents = await User.countDocuments({
      role_id: studentRole._id,
      is_verified: true,
      account_status: 'active'
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        pendingVerifications,
        verifiedStudents,
        verificationRate: totalStudents > 0 ? (verifiedStudents / totalStudents * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching warden stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
});

// GET all students with filters
router.get('/students', async (req, res) => {
  try {
    const { verified, search, limit = 50, skip = 0 } = req.query;
    
    const studentRole = await Role.findOne({ role_name: 'student' });
    
    if (!studentRole) {
      return res.status(404).json({
        success: false,
        message: 'Student role not found'
      });
    }

    const filter = {
      role_id: studentRole._id,
      account_status: 'active'
    };

    // Filter by verification status
    if (verified !== undefined) {
      filter.is_verified = verified === 'true';
    }

    // Search by name or email
    if (search) {
      filter.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { college_email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(filter)
      .select('-password_hash')
      .populate('hostel_id', 'hostel_name location')
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        students,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
});

// GET pending verification students
router.get('/students/pending', async (req, res) => {
  try {
    const studentRole = await Role.findOne({ role_name: 'student' });
    
    if (!studentRole) {
      return res.status(404).json({
        success: false,
        message: 'Student role not found'
      });
    }

    const students = await User.find({
      role_id: studentRole._id,
      is_verified: false,
      account_status: 'active'
    })
      .select('-password_hash')
      .populate('hostel_id', 'hostel_name location')
      .sort({ created_at: -1 });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching pending students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending students',
      error: error.message
    });
  }
});

// PUT verify a student
router.put('/students/:id/verify', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('role_id', 'role_name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a student
    if (user.role_id.role_name !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Only students can be verified'
      });
    }

    user.is_verified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Student verified successfully',
      data: {
        _id: user._id,
        full_name: user.full_name,
        college_email: user.college_email,
        is_verified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Error verifying student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify student',
      error: error.message
    });
  }
});

// PUT unverify a student
router.put('/students/:id/unverify', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('role_id', 'role_name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a student
    if (user.role_id.role_name !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Only students can be unverified'
      });
    }

    user.is_verified = false;
    await user.save();

    res.json({
      success: true,
      message: 'Student unverified successfully',
      data: {
        _id: user._id,
        full_name: user.full_name,
        college_email: user.college_email,
        is_verified: user.is_verified
      }
    });
  } catch (error) {
    console.error('Error unverifying student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unverify student',
      error: error.message
    });
  }
});

// PUT bulk verify students
router.put('/students/verify/bulk', async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'studentIds array is required'
      });
    }

    const result = await User.updateMany(
      { _id: { $in: studentIds } },
      { $set: { is_verified: true } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} students verified successfully`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error bulk verifying students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk verify students',
      error: error.message
    });
  }
});

// PUT allocate hostel to a student
router.put('/students/:id/allocate-hostel', async (req, res) => {
  try {
    const { hostel_id, room_number } = req.body;

    const user = await User.findById(req.params.id)
      .populate('role_id', 'role_name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a student
    if (user.role_id.role_name !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Only students can be assigned to hostels'
      });
    }

    // Validate hostel exists if hostel_id is provided
    if (hostel_id) {
      const Hostel = require('../models/Hostel');
      const hostel = await Hostel.findById(hostel_id);
      if (!hostel) {
        return res.status(404).json({
          success: false,
          message: 'Hostel not found'
        });
      }
    }

    // Update student's hostel assignment
    user.hostel_id = hostel_id || null;
    user.room_number = room_number || null;
    await user.save();

    // Populate hostel info for response
    await user.populate('hostel_id', 'name block gender_type');

    res.json({
      success: true,
      message: 'Hostel allocated successfully',
      data: {
        _id: user._id,
        full_name: user.full_name,
        college_email: user.college_email,
        hostel_id: user.hostel_id,
        room_number: user.room_number
      }
    });
  } catch (error) {
    console.error('Error allocating hostel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate hostel',
      error: error.message
    });
  }
});

// GET all hostels
router.get('/hostels', async (req, res) => {
  try {
    const Hostel = require('../models/Hostel');
    const hostels = await Hostel.find()
      .sort({ name: 1 });

    res.json({
      success: true,
      data: hostels
    });
  } catch (error) {
    console.error('Error fetching hostels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hostels',
      error: error.message
    });
  }
});

// POST create a new hostel
router.post('/hostels', async (req, res) => {
  try {
    const Hostel = require('../models/Hostel');
    const { name, block, gender_type, total_rooms } = req.body;

    // Validate required fields
    if (!name || !block || !gender_type || !total_rooms) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (name, block, gender_type, total_rooms)'
      });
    }

    // Validate gender_type
    if (!['male', 'female', 'co-ed'].includes(gender_type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Gender type must be one of: male, female, co-ed'
      });
    }

    // Check if hostel with same name and block already exists
    const existingHostel = await Hostel.findOne({ name, block });
    if (existingHostel) {
      return res.status(400).json({
        success: false,
        message: 'A hostel with this name and block already exists'
      });
    }

    const hostel = await Hostel.create({
      name,
      block,
      gender_type: gender_type.toLowerCase(),
      total_rooms: parseInt(total_rooms)
    });

    res.status(201).json({
      success: true,
      message: 'Hostel created successfully',
      data: hostel
    });
  } catch (error) {
    console.error('Error creating hostel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hostel',
      error: error.message
    });
  }
});

// PUT update a hostel
router.put('/hostels/:id', async (req, res) => {
  try {
    const Hostel = require('../models/Hostel');
    const { name, block, gender_type, total_rooms } = req.body;

    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    // Validate gender_type if provided
    if (gender_type && !['male', 'female', 'co-ed'].includes(gender_type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Gender type must be one of: male, female, co-ed'
      });
    }

    // Update fields
    if (name) hostel.name = name;
    if (block) hostel.block = block;
    if (gender_type) hostel.gender_type = gender_type.toLowerCase();
    if (total_rooms) hostel.total_rooms = parseInt(total_rooms);

    await hostel.save();

    res.json({
      success: true,
      message: 'Hostel updated successfully',
      data: hostel
    });
  } catch (error) {
    console.error('Error updating hostel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hostel',
      error: error.message
    });
  }
});

// DELETE a hostel
router.delete('/hostels/:id', async (req, res) => {
  try {
    const Hostel = require('../models/Hostel');
    
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    // Check if any students are assigned to this hostel
    const studentsCount = await User.countDocuments({ hostel_id: req.params.id });
    if (studentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete hostel. ${studentsCount} student(s) are currently assigned to this hostel.`
      });
    }

    await Hostel.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Hostel deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hostel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete hostel',
      error: error.message
    });
  }
});

// ============ FOOD STALL MANAGEMENT ============

// GET all food stalls
router.get('/food-stalls', async (req, res) => {
  try {
    const FoodStall = require('../models/FoodStall');
    const { is_active } = req.query;
    
    const filter = {};
    if (is_active !== undefined) {
      filter.is_active = is_active === 'true';
    }

    const foodStalls = await FoodStall.find(filter)
      .sort({ name: 1 });

    res.json({
      success: true,
      data: foodStalls
    });
  } catch (error) {
    console.error('Error fetching food stalls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food stalls',
      error: error.message
    });
  }
});

// POST create a new food stall
router.post('/food-stalls', async (req, res) => {
  try {
    const FoodStall = require('../models/FoodStall');
    const { name, location } = req.body;

    // Validate required fields
    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Name and location are required'
      });
    }

    // Check if food stall with same name already exists
    const existingStall = await FoodStall.findOne({ name });
    if (existingStall) {
      return res.status(400).json({
        success: false,
        message: 'A food stall with this name already exists'
      });
    }

    const foodStall = await FoodStall.create({
      name,
      location
    });

    res.status(201).json({
      success: true,
      message: 'Food stall created successfully',
      data: foodStall
    });
  } catch (error) {
    console.error('Error creating food stall:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create food stall',
      error: error.message
    });
  }
});

// PUT update a food stall
router.put('/food-stalls/:id', async (req, res) => {
  try {
    const FoodStall = require('../models/FoodStall');
    const { name, location, is_active } = req.body;

    const foodStall = await FoodStall.findById(req.params.id);
    if (!foodStall) {
      return res.status(404).json({
        success: false,
        message: 'Food stall not found'
      });
    }

    // Update fields
    if (name !== undefined) foodStall.name = name;
    if (location !== undefined) foodStall.location = location;
    if (is_active !== undefined) foodStall.is_active = is_active;

    await foodStall.save();

    res.json({
      success: true,
      message: 'Food stall updated successfully',
      data: foodStall
    });
  } catch (error) {
    console.error('Error updating food stall:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update food stall',
      error: error.message
    });
  }
});

// DELETE a food stall (soft delete)
router.delete('/food-stalls/:id', async (req, res) => {
  try {
    const FoodStall = require('../models/FoodStall');
    
    const foodStall = await FoodStall.findById(req.params.id);
    if (!foodStall) {
      return res.status(404).json({
        success: false,
        message: 'Food stall not found'
      });
    }

    // Soft delete by setting is_active to false
    foodStall.is_active = false;
    await foodStall.save();

    res.json({
      success: true,
      message: 'Food stall deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting food stall:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete food stall',
      error: error.message
    });
  }
});

// ============== ROOMMATE ISSUES MANAGEMENT ==============

// GET all roommate issues (for warden review)
router.get('/roommate-issues', protect, authorize('warden', 'admin'), async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = { is_deleted: false };

    if (status) filter.status = status;
    if (category) filter.issue_category = category;

    const RoommateIssue = require('../models/RoommateIssue');
    const RoommateParticipant = require('../models/RoommateParticipant');

    const issues = await RoommateIssue.find(filter)
      .populate('raised_by', 'full_name email hostel_id room_number')
      .populate('escalated_to', 'full_name email')
      .sort({ created_at: -1 });

    // Get participant counts
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

// PUT update roommate issue status
router.put('/roommate-issues/:id/status', protect, authorize('warden', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['open', 'in_progress', 'resolved', 'closed', 'escalated'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: open, in_progress, resolved, closed, escalated'
      });
    }

    const RoommateIssue = require('../models/RoommateIssue');
    const updateData = { status };

    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date();
    }

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
        message: 'Roommate issue not found'
      });
    }

    res.json({
      success: true,
      message: 'Issue status updated successfully',
      data: issue
    });
  } catch (error) {
    console.error('Error updating issue status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update issue status',
      error: error.message
    });
  }
});

// PUT resolve roommate issue with note
router.put('/roommate-issues/:id/resolve', protect, authorize('warden', 'admin'), async (req, res) => {
  try {
    const { resolution_note } = req.body;

    if (!resolution_note || resolution_note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Resolution note is required'
      });
    }

    const RoommateIssue = require('../models/RoommateIssue');

    const issue = await RoommateIssue.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolution_note: resolution_note.trim(),
        resolved_at: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate('raised_by', 'full_name email')
      .populate('escalated_to', 'full_name email');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Roommate issue not found'
      });
    }

    res.json({
      success: true,
      message: 'Issue resolved successfully',
      data: issue
    });
  } catch (error) {
    console.error('Error resolving issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve issue',
      error: error.message
    });
  }
});

module.exports = router;
