const express = require('express');
const router = express.Router();
const FoodRequest = require('../models/FoodRequest');

// GET all food requests
router.get('/', async (req, res) => {
  try {
    const { status, requester_id, accepted_by } = req.query;
    const filter = { is_deleted: false };
    
    if (status) filter.status = status;
    if (requester_id) filter.requester_id = requester_id;

    let requests;

    // If filtering by accepted_by, need to join with FoodRequestAcceptance
    if (accepted_by) {
      const FoodRequestAcceptance = require('../models/FoodRequestAcceptance');
      const acceptedRequests = await FoodRequestAcceptance.find({ accepted_by })
        .select('request_id');
      
      const requestIds = acceptedRequests.map(a => a.request_id);
      filter._id = { $in: requestIds };
    }
    
    requests = await FoodRequest.find(filter)
      .populate('requester_id', 'full_name email')
      .populate('stall_id', 'name location')
      .sort({ request_time: -1 });
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching food requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food requests',
      error: error.message
    });
  }
});

// GET single food request by ID
router.get('/:id', async (req, res) => {
  try {
    const request = await FoodRequest.findOne({
      _id: req.params.id,
      is_deleted: false
    })
      .populate('requester_id', 'full_name email')
      .populate('stall_id', 'name location');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Food request not found'
      });
    }
    
    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error fetching food request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food request',
      error: error.message
    });
  }
});

// POST create new food request
router.post('/', async (req, res) => {
  try {
    const {
      requester_id,
      stall_id,
      item_name,
      quantity,
      service_charge
    } = req.body;
    
    const newRequest = new FoodRequest({
      requester_id,
      stall_id,
      item_name,
      quantity,
      service_charge
    });
    
    await newRequest.save();
    await newRequest.populate('requester_id', 'full_name email');
    await newRequest.populate('stall_id', 'name location');
    
    res.status(201).json({
      success: true,
      message: 'Food request created successfully',
      data: newRequest
    });
  } catch (error) {
    console.error('Error creating food request:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create food request',
      error: error.message
    });
  }
});

// PUT update food request
router.put('/:id', async (req, res) => {
  try {
    const { status, is_paid, delivered_confirmed } = req.body;
    const updateData = {};
    
    if (status) updateData.status = status;
    if (typeof is_paid !== 'undefined') updateData.is_paid = is_paid;
    if (typeof delivered_confirmed !== 'undefined') updateData.delivered_confirmed = delivered_confirmed;
    
    const request = await FoodRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('requester_id', 'full_name email')
      .populate('stall_id', 'name location');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Food request not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Food request updated successfully',
      data: request
    });
  } catch (error) {
    console.error('Error updating food request:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update food request',
      error: error.message
    });
  }
});

// POST accept a food request
router.post('/:id/accept', async (req, res) => {
  try {
    const { accepted_by } = req.body;

    if (!accepted_by) {
      return res.status(400).json({
        success: false,
        message: 'accepted_by user ID is required'
      });
    }

    // Check if request exists and is pending
    const request = await FoodRequest.findOne({
      _id: req.params.id,
      is_deleted: false
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Food request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been accepted or completed'
      });
    }

    // Check if user is trying to accept their own request
    if (request.requester_id.toString() === accepted_by) {
      return res.status(400).json({
        success: false,
        message: 'You cannot accept your own food request'
      });
    }

    // Create acceptance record
    const FoodRequestAcceptance = require('../models/FoodRequestAcceptance');
    const acceptance = new FoodRequestAcceptance({
      request_id: request._id,
      accepted_by
    });

    await acceptance.save();

    // Update request status
    request.status = 'accepted';
    await request.save();

    // Populate and return updated request
    await request.populate('requester_id', 'full_name email');
    await request.populate('stall_id', 'name location');
    await acceptance.populate('accepted_by', 'full_name email');

    res.json({
      success: true,
      message: 'Food request accepted successfully',
      data: {
        request,
        acceptance
      }
    });
  } catch (error) {
    console.error('Error accepting food request:', error);
    
    // Handle duplicate acceptance error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This request has already been accepted'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to accept food request',
      error: error.message
    });
  }
});

// DELETE soft delete food request
router.delete('/:id', async (req, res) => {
  try {
    const request = await FoodRequest.findByIdAndUpdate(
      req.params.id,
      { is_deleted: true },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Food request not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Food request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting food request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete food request',
      error: error.message
    });
  }
});

module.exports = router;
