const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { protect, authorize } = require('../middleware/auth');

// GET all notices (non-expired, non-deleted)
router.get('/', async (req, res) => {
  try {
    const { notice_type, is_official } = req.query;
    const filter = { is_deleted: false };
    
    // Filter out expired notices
    filter.$or = [
      { expiry_date: null },
      { expiry_date: { $gte: new Date() } }
    ];
    
    if (notice_type) filter.notice_type = notice_type;
    if (is_official !== undefined) filter.is_official = is_official === 'true';
    
    const notices = await Notice.find(filter)
      .populate('posted_by', 'full_name email role_id')
      .sort({ created_at: -1 });
    
    res.json({
      success: true,
      data: notices
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notices',
      error: error.message
    });
  }
});

// GET single notice by ID
router.get('/:id', async (req, res) => {
  try {
    const notice = await Notice.findOne({
      _id: req.params.id,
      is_deleted: false
    }).populate('posted_by', 'full_name email role_id');
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }
    
    res.json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error('Error fetching notice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notice',
      error: error.message
    });
  }
});

// POST create new notice (warden only)
router.post('/', protect, authorize('warden'), async (req, res) => {
  try {
    const {
      posted_by,
      title,
      content,
      notice_type,
      attachment_url,
      is_official,
      expiry_date
    } = req.body;
    
    const newNotice = new Notice({
      posted_by,
      title,
      content,
      notice_type,
      attachment_url,
      is_official,
      expiry_date
    });
    
    await newNotice.save();
    await newNotice.populate('posted_by', 'full_name email');
    
    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: newNotice
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create notice',
      error: error.message
    });
  }
});

// PUT update notice (warden only)
router.put('/:id', protect, authorize('warden'), async (req, res) => {
  try {
    const { title, content, notice_type, expiry_date, is_official } = req.body;
    const updateData = {};
    
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (notice_type) updateData.notice_type = notice_type;
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date;
    if (is_official !== undefined) updateData.is_official = is_official;
    
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('posted_by', 'full_name email');
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notice updated successfully',
      data: notice
    });
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update notice',
      error: error.message
    });
  }
});

// DELETE soft delete notice (warden only)
router.delete('/:id', protect, authorize('warden'), async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { is_deleted: true },
      { new: true }
    );
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notice',
      error: error.message
    });
  }
});

module.exports = router;
