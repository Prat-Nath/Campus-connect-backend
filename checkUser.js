require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ college_email: 'aditya@gmail.com' })
      .populate('role_id');
    
    if (user) {
      console.log('\n=== User Found ===');
      console.log('Email:', user.college_email);
      console.log('Name:', user.full_name);
      console.log('Role:', user.role_id?.role_name || 'No role assigned');
      console.log('Verified:', user.is_verified);
      console.log('Account Status:', user.account_status);
      console.log('================\n');
    } else {
      console.log('\n❌ User NOT found with email: aditya@gmail.com\n');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUser();
