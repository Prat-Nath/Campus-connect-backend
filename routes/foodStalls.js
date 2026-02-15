const express = require('express');
const router = express.Router();
const FoodStall = require('../models/FoodStall');

// GET all active food stalls (public endpoint for students)
router.get('/', async (req, res) => {
  try {
    const foodStalls = await FoodStall.find({ is_active: true })
      .sort({ name: 1 })
      .select('name location is_active');

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

module.exports = router;
