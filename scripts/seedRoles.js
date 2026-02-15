// Seed script to create initial roles
require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');

const seedRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected');

    // Check if roles already exist
    const existingRoles = await Role.find();
    if (existingRoles.length > 0) {
      console.log('Roles already exist. Skipping seed.');
      process.exit(0);
    }

// Create default roles
    const roles = [
      { role_name: 'student' },
      { role_name: 'warden' },
      { role_name: 'admin' },
    ];

    await Role.insertMany(roles);
    console.log('✅ Default roles created successfully!');
    
    // Display role IDs for reference
    const createdRoles = await Role.find();
    console.log('\nRole IDs (use these for registration):');
    createdRoles.forEach(role => {
      console.log(`${role.role_name}: ${role._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
};

seedRoles();
